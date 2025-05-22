const express = require('express');
const router = express.Router();
const workerController = require('../controllers/worker.controller');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Profile routes
router.get('/profile', workerController.getProfile);
router.put('/profile', workerController.updateProfile);

// Availability routes
router.get('/availability', workerController.getAvailability);
router.put('/availability', workerController.updateAvailability);

// Skills routes
router.get('/skills', workerController.getSkills);
router.put('/skills', workerController.updateSkills);

module.exports = router; 