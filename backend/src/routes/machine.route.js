const express = require('express');
const router = express.Router();
const { getMachines, addMachine, deleteMachine } = require('../controllers/machine.controller');

router.get('/', getMachines);
router.post('/', addMachine);
router.delete('/:id', deleteMachine);

module.exports = router;