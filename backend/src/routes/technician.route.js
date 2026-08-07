const express = require('express');
const router = express.Router();
const { getTechnicians, addTechnician, updateTechnician, deleteTechnician } = require('../controllers/technician.controller');

router.get('/', getTechnicians);
router.post('/', addTechnician);
router.put('/:id', updateTechnician);
router.delete('/:id', deleteTechnician);

module.exports = router;