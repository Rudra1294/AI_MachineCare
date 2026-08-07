const Technician = require('../models/Technician.model');

// Get all technicians
const getTechnicians = async (req, res) => {
    try {
        const technicians = await Technician.find().sort({ date_added: -1 });
        res.status(200).json(technicians);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a new technician
const addTechnician = async (req, res) => {
    try {
        const { name, employee_id, specialty, is_available } = req.body;
        const newTech = new Technician({ name, employee_id, specialty, is_available });
        await newTech.save();
        res.status(201).json(newTech);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle availability or edit details
const updateTechnician = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTech = await Technician.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedTech);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove a technician
const deleteTechnician = async (req, res) => {
    try {
        const { id } = req.params;
        await Technician.findByIdAndDelete(id);
        res.status(200).json({ message: "Technician removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getTechnicians, addTechnician, updateTechnician, deleteTechnician };