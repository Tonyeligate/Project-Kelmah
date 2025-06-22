const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const appointmentsController = require('../controllers/appointments.controller');

const router = express.Router();

// Protect all appointment routes
router.use(authenticateUser);

// GET /api/appointments - get all appointments for the current worker
router.get('/', appointmentsController.getAppointments);

// Create a new appointment
router.post('/', appointmentsController.createAppointment);

// Update an appointment
router.patch('/:id', appointmentsController.updateAppointment);

// Delete an appointment
router.delete('/:id', appointmentsController.deleteAppointment);

module.exports = router; 