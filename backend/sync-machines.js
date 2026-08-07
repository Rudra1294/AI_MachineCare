require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const MachineLog = require('./src/models/MachineLog.model');
const Machine = require('./src/models/Machine.model');

const syncMachines = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB. Scanning historical logs...");

        // 1. Group logs by machine_id to find unique machines, their type, and their earliest log date
        const uniqueMachines = await MachineLog.aggregate([
            {
                $group: {
                    _id: "$machine_id",
                    type: { $first: "$type" }, // Grab the type
                    install_date: { $min: "$timestamp" } // Use their oldest log as install date
                }
            }
        ]);

        console.log(`Found ${uniqueMachines.length} unique machines in history. Synchronizing inventory...`);

        // 2. Insert or Update them in the official Machine inventory collection
        let addedCount = 0;
        for (const m of uniqueMachines) {
            const existing = await Machine.findOne({ machine_id: m._id });
            
            if (!existing) {
                await Machine.create({
                    machine_id: m._id,
                    type: m.type,
                    install_date: m.install_date,
                    status: 'OPTIMAL' // Default to optimal
                });
                addedCount++;
            }
        }

        console.log(`Synchronization Complete! Added ${addedCount} missing machines to the inventory.`);
        process.exit(0);
    } catch (error) {
        console.error("Error during synchronization:", error);
        process.exit(1);
    }
};

syncMachines();