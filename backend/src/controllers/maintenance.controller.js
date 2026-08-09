const axios = require('axios');
const MachineLog = require('../models/MachineLog.model');
const Technician = require('../models/Technician.model');
const Machine = require('../models/Machine.model');

const processFactoryData = async (req, res) => {
    try {
        const { machines } = req.body;
        
        // 1. Fetch available technicians safely
        const availableTechs = await Technician.find({ is_available: true });
        
        const mappedTechs = availableTechs.map(tech => ({
            technician_id: tech.technician_id || (tech._id ? tech._id.toString() : "UNKNOWN"),
            specialty: tech.specialty || "General"
        }));

        const aiPayload = {
            machines: machines,
            available_technicians: mappedTechs
        };

        // 2. Send to Python (ensure this URL matches your Python route)
        // const pythonBaseUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
        const aiResponse = await axios.post(`${process.env.PYTHON_API_URL}/api/predict_and_schedule`, aiPayload);
        const { predictions, milp_schedule, compute_engine, prediction_model } = aiResponse.data;

        const savedLogs = [];

        // ==========================================
        // 3. START LOOP (Process each prediction)
        // ==========================================
        for (let i = 0; i < machines.length; i++) {
            const input = machines[i];
            const prediction = predictions[i];
            
            const isRisk = prediction.status === 'FAILURE_RISK';

            // Save History Log
            const log = new MachineLog({
                machine_id: input.machine_id,
                type: input.type,
                air_temperature: input.air_temperature,
                process_temperature: input.process_temperature,
                rotational_speed: input.rotational_speed,
                torque: input.torque,
                tool_wear: input.tool_wear,
                ai_prediction: {
                    status: prediction.status,
                    failure_cause: prediction.failure_cause || "None",
                    is_scheduled: false,
                    maintenance_status: isRisk ? 'Action Required' : 'Normal'
                }
            });
            await log.save();
            savedLogs.push(log);

            // Update Master Machine Inventory
            await Machine.findOneAndUpdate(
                { machine_id: input.machine_id },
                {
                    status: prediction.status === 'HEALTHY' ? 'OPTIMAL' : 'WARNING',
                    latest_telemetry: {
                        air_temperature: input.air_temperature,
                        process_temperature: input.process_temperature,
                        rotational_speed: input.rotational_speed,
                        torque: input.torque,
                        tool_wear: input.tool_wear,
                        last_updated: new Date()
                    }
                }
            );
        }
        // ==========================================
        // END LOOP (Do not send response inside the loop!)
        // ==========================================

        // 4. Send the SINGLE success response back to React
        return res.status(200).json({
            message: "Data processed successfully",
            predictions,
            milp_schedule,
            compute_engine,       
            prediction_model,
            available_technicians: availableTechs
        });

    } catch (error) {
        // If an error happens, return immediately to prevent double-responses
        if (error.response && error.response.status === 422) {
            console.error("FastAPI Validation Error:", JSON.stringify(error.response.data.detail, null, 2));
            return res.status(422).json({ 
                error: "Data Validation Failed in AI Engine", 
                details: error.response.data.detail 
            });
        }
        
        console.error("Error processing data:", error.message);
        return res.status(500).json({ error: "Failed to process factory data or reach AI engine." });
    }
};

const getMachineHistory = async (req, res) => {
    try {
        const history = await MachineLog.find().sort({ timestamp: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const dispatchTechnician = async (req, res) => {
    try {
        const { machine_id, technician_id } = req.body;

        const tech = await Technician.findById(technician_id);
        if (!tech) return res.status(404).json({ error: "Technician not found." });
        
        if (tech.is_available === false) {
            return res.status(400).json({ error: `Cannot dispatch: ${tech.name} is already assigned!` });
        }

        // 1. Mark tech as busy
        tech.is_available = false;
        tech.current_task = machine_id;
        await tech.save();

        // 2. Save the absolute MongoDB _id into the log for perfect mapping
        const updatedLog = await MachineLog.findOneAndUpdate(
            { machine_id: machine_id, "ai_prediction.maintenance_status": "Action Required" },
            { 
                "ai_prediction.is_scheduled": true,
                "ai_prediction.maintenance_status": "Pending",
                "ai_prediction.assigned_technician_id": tech._id.toString(), // Bulletproof ID
                "ai_prediction.assigned_technician_name": tech.name
            },
            { sort: { timestamp: -1 }, new: true }
        );

        res.status(200).json({ message: "Technician successfully dispatched!", updatedLog });
    } catch (error) {
        console.error("Dispatch Error:", error);
        res.status(500).json({ error: "Failed to dispatch technician." });
    }
};

const updateMaintenanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const log = await MachineLog.findById(id);
        if (!log) return res.status(404).json({ error: "Log not found" });

        const assignedTechId = log.ai_prediction?.assigned_technician_id;
        log.ai_prediction.maintenance_status = status;
        
        // If Resolved, clear the schedule AND explicitly free the technician via their _id
        if (status === 'Resolved') {
            log.ai_prediction.is_scheduled = false; 
            await log.save();

            if (assignedTechId) {
                await Technician.findByIdAndUpdate(
                    assignedTechId,
                    { is_available: true, current_task: null }
                );
            }
        } else {
            await log.save();
        }
        
        res.status(200).json(log);
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// NEW: Fetch only machines that need human attention
const getActionQueue = async (req, res) => {
    try {
        const queue = await MachineLog.find({ "ai_prediction.maintenance_status": "Action Required" }).sort({ timestamp: -1 });
        res.status(200).json(queue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// NEW: Fetch technicians who are currently free
const getAvailableTechnicians = async (req, res) => {
    try {
        const techs = await Technician.find({ is_available: true });
        res.status(200).json(techs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { processFactoryData, getMachineHistory, updateMaintenanceStatus, dispatchTechnician, getActionQueue, getAvailableTechnicians };