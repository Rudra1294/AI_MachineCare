const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
    machine_id: { type: String, required: true, unique: true },
    type: { type: Number, required: true },
    install_date: { type: Date, default: Date.now },
    status: { type: String, enum: ['OPTIMAL', 'WARNING'], default: 'OPTIMAL' },
    // NEW: Digital Twin state to hold the most recent sensor data
    latest_telemetry: {
        air_temperature: { type: Number },
        process_temperature: { type: Number },
        rotational_speed: { type: Number },
        torque: { type: Number },
        tool_wear: { type: Number },
        last_updated: { type: Date }
    }
});

module.exports = mongoose.model('Machine', MachineSchema);