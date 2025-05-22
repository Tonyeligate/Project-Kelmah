/**
 * Notification Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/notification-analytics.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// All analytics routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Analytics dashboard data
router.get('/dashboard', analyticsController.getAnalyticsDashboard);

// Engagement metrics
router.get('/engagement', analyticsController.getEngagementMetrics);

// Template performance
router.get('/templates', analyticsController.getTemplatePerformance);

// Export notification data
router.get('/export', analyticsController.exportNotificationData);

module.exports = router; 