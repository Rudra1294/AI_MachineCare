const Machine = require('../models/Machine.model');

const getMachines = async (req, res) => {
    try {
        const machines = await Machine.find().sort({ install_date: -1 });
        res.status(200).json(machines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addMachine = async (req, res) => {
    try {
        const { machine_id, type } = req.body;
        
        // Explicit frontend validation check
        const existingMachine = await Machine.findOne({ machine_id });
        if (existingMachine) {
            return res.status(400).json({ error: `A machine with the ID '${machine_id}' already exists.` });
        }

        const newMachine = new Machine({ machine_id, type: Number(type) });
        await newMachine.save();
        res.status(201).json(newMachine);
    } catch (error) {
        // Catch MongoDB unique constraint errors just in case
        if (error.code === 11000) {
            return res.status(400).json({ error: "Machine ID must be unique." });
        }
        res.status(500).json({ error: "Failed to add machine." });
    }
};

const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        await Machine.findByIdAndDelete(id);
        res.status(200).json({ message: "Machine deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete machine" });
    }
};

module.exports = { getMachines, addMachine, deleteMachine };