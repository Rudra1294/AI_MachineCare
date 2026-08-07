const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employee_id: { type: String, required: true, unique: true },
    specialty: { type: String, default: 'General Maintenance' },
    is_available: { type: Boolean, default: true }, // Admin can toggle this to false if someone is sick/off-shift
    current_task: { type: String, default: null },
    date_added: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Technician', TechnicianSchema);