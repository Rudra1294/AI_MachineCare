require('dotenv').config();
const mongoose = require('mongoose');
const MachineLog = require('./src/models/MachineLog.model');
const connectDB = require('./src/config/db');

// Dummy data generator simulating your training data properties
const generateHistoricalData = (numRecords) => {
    const logs = [];
    const now = new Date();

    for (let i = 0; i < numRecords; i++) {
        // Random date within the last 6 months (180 days)
        const pastDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
        
        // Randomize whether this was a healthy log or a failure
        const isFailure = Math.random() > 0.85; // 15% failure rate for realism
        const machineType = Math.floor(Math.random() * 3); // 0, 1, or 2

        logs.push({
            machine_id: `MCH-${Math.floor(Math.random() * 20) + 100}`,
            type: machineType,
            air_temperature: (295 + Math.random() * 15).toFixed(1),
            process_temperature: (305 + Math.random() * 15).toFixed(1),
            rotational_speed: (1300 + Math.random() * 400).toFixed(1),
            torque: (30 + Math.random() * 40).toFixed(1),
            tool_wear: isFailure ? (200 + Math.random() * 50).toFixed(1) : (Math.random() * 100).toFixed(1),
            ai_prediction: {
                status: isFailure ? 'FAILURE_RISK' : 'HEALTHY',
                is_scheduled: isFailure,
                maintenance_status: isFailure ? 'Resolved' : 'Pending' // Mark old failures as resolved
            },
            timestamp: pastDate
        });
    }
    return logs;
};

const seedDatabase = async () => {
    await connectDB();
    console.log("Connected to MongoDB. Clearing old history...");
    
    // Optional: Clear existing logs to start fresh
    // await MachineLog.deleteMany({}); 

    console.log("Generating 500 historical logs...");
    const data = generateHistoricalData(500);

    await MachineLog.insertMany(data);
    console.log("Successfully seeded database! Your Analytics page will now look amazing.");
    
    process.exit();
};

seedDatabase();