/**
 * Notification service routes
 */

const express = require('express');
const router = express.Router();
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');

// Main notification endpoints
router.use('/', notificationRoutes);

// Analytics endpoints
router.use('/analytics', analyticsRoutes);

module.exports = router; 