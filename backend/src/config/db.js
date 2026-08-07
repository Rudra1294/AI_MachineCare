const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME || "factory_maintenance",
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Atlas Connected`);
        console.log(`Host: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);

    } catch (error) {
        console.error("❌ MongoDB Atlas Connection Failed");
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;