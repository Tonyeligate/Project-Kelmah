/**
 * Analytics Routes
 * Provides admin analytics endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middlewares/auth');
const AnalyticsController = require('../controllers/analytics.controller');

// All analytics routes require admin authentication
router.use(authenticate);

// Platform analytics (admin only)
router.get('/platform', authorizeRoles('admin'), AnalyticsController.getPlatformAnalytics);

// System metrics (admin only)
router.get('/system-metrics', authorizeRoles('admin'), AnalyticsController.getSystemMetrics);

// User activity (admin only)
router.get('/user-activity', authorizeRoles('admin'), AnalyticsController.getUserActivity);

// Worker analytics (jobs/payments/reviews)
router.get('/worker/:workerId', AnalyticsController.getWorkerAnalytics);

module.exports = router;
