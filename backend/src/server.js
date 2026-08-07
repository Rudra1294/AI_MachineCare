require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const maintenanceRoutes = require('./routes/maintenance.route');
const technicianRoutes = require('./routes/technician.route');   
const authRoutes = require('./routes/auth.route');
const machineRoutes = require('./routes/machine.route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/technicians', technicianRoutes); 
app.use('/api/machines', machineRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Node API Gateway running on http://localhost:${PORT}`);
});