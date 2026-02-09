/**
 * Analytics Routes
 * Provides admin analytics endpoints
 */

const express = require('express');
const router = express.Router();
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');
const AnalyticsController = require('../controllers/analytics.controller');

// All analytics routes require gateway authentication
router.use(verifyGatewayRequest);

// Platform analytics (admin only)
router.get('/platform', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, AnalyticsController.getPlatformAnalytics);

// System metrics (admin only)
router.get('/system-metrics', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, AnalyticsController.getSystemMetrics);

// User activity (admin only)
router.get('/user-activity', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, AnalyticsController.getUserActivity);

// Worker analytics (jobs/payments/reviews)
router.get('/worker/:workerId', AnalyticsController.getWorkerAnalytics);

module.exports = router;
