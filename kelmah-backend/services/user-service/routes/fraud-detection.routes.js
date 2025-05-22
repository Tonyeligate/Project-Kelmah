const express = require('express');
const router = express.Router();
const fraudDetectionController = require('../controllers/fraud-detection.controller');
const { isAdmin, verifyToken } = require('../../auth-service/middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(isAdmin);

/**
 * @route GET /api/fraud-detection/alerts
 * @desc Get all fraud alerts with optional filtering
 * @access Admin only
 */
router.get('/alerts', fraudDetectionController.getFraudAlerts);

/**
 * @route GET /api/fraud-detection/stats
 * @desc Get fraud detection statistics
 * @access Admin only
 */
router.get('/stats', fraudDetectionController.getFraudStats);

/**
 * @route GET /api/fraud-detection/alerts/:alertId
 * @desc Get detailed information about a specific fraud alert
 * @access Admin only
 */
router.get('/alerts/:alertId', fraudDetectionController.getAlertDetails);

/**
 * @route PUT /api/fraud-detection/alerts/:alertId/resolve
 * @desc Resolve a fraud alert
 * @access Admin only
 */
router.put('/alerts/:alertId/resolve', fraudDetectionController.resolveAlert);

module.exports = router; 