const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const router = express.Router();

// Secret key for JWT (In production, put this in your .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_key_2026';

// 1. LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await admin.matchPassword(password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        // Generate Token
        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, admin: { email: admin.email, name: admin.name } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. SETUP ROUTE (Run this once in Postman to create your first admin)
router.post('/setup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const adminExists = await Admin.findOne({ email });
        
        if (adminExists) return res.status(400).json({ error: "Admin already exists" });

        const admin = await Admin.create({ email, password, name });
        res.status(201).json({ message: "Admin created successfully. You can now log in.", email: admin.email });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;