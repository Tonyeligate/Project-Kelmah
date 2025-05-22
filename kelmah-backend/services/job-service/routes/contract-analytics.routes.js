/**
 * Contract Analytics Routes
 * API routes for contract analytics and reporting
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const contractAnalyticsController = require('../controllers/contract-analytics.controller');

// Protected routes for authenticated users
router.use(auth());

// Analytics routes
router.get('/status', contractAnalyticsController.getContractCountByStatus);
router.get('/value', contractAnalyticsController.getContractValueMetrics);
router.get('/timeline', contractAnalyticsController.getContractTimelineMetrics);
router.get('/active-users', contractAnalyticsController.getMostActiveUsers);
router.get('/completion-rate', contractAnalyticsController.getContractCompletionRate);

module.exports = router; 