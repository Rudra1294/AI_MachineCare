const mongoose = require('mongoose');

const MachineLogSchema = new mongoose.Schema({
    machine_id: { type: String, required: true },
    type: { type: Number, required: true }, // NEW: Added Type to the schema
    air_temperature: { type: Number, required: true },
    process_temperature: { type: Number, required: true },
    rotational_speed: { type: Number, required: true },
    torque: { type: Number, required: true },
    tool_wear: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    ai_prediction: {
        status: { type: String },
        failure_cause: { type: String }, // NEW: Save the exact cause
        is_scheduled: { type: Boolean, default: false },
        maintenance_status: { type: String, enum: ['Normal', 'Action Required', 'In Progress', 'Pending', 'Resolved'], default: 'Normal' },
        assigned_technician_id: { type: String },
        assigned_technician_name: { type: String }
    }
});

module.exports = mongoose.model('MachineLog', MachineLogSchema);