const express = require('express');
const router = express.Router();
const { 
    processFactoryData, 
    getMachineHistory, 
    updateMaintenanceStatus, 
    dispatchTechnician,
    getActionQueue, 
    getAvailableTechnicians 
} = require('../controllers/maintenance.controller');

router.post('/process', processFactoryData);
router.get('/history', getMachineHistory);
router.put('/:id', updateMaintenanceStatus);
router.post('/dispatch', dispatchTechnician);
router.get('/queue', getActionQueue);
router.get('/technicians/available', getAvailableTechnicians);

module.exports = router;