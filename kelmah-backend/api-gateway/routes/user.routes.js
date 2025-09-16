/**
 * User Service Routes
 * Proxy configuration for user-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const { authenticate } = require('../middleware/auth');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').USER_SERVICE;

// Protected user proxy
const userProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    // Don't preserve the /api/users prefix - let it be stripped
    requireAuth: true,
  });
  return proxy(req, res, next);
};

// All user routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userProxy);
router.put('/profile', userProxy);
router.get('/profile/:userId', userProxy);

// User management routes
router.get('/', userProxy);
router.get('/:userId', userProxy);
router.put('/:userId', userProxy);
router.delete('/:userId', userProxy);

// Worker-specific routes
router.get('/workers', userProxy);
router.get('/workers/:workerId', userProxy);
router.put('/workers/:workerId/status', userProxy);
router.get('/workers/:workerId/portfolio', userProxy);
router.put('/workers/:workerId/portfolio', userProxy);
router.get('/workers/:workerId/availability', userProxy);
router.put('/workers/:workerId/availability', userProxy);
router.get('/workers/:workerId/skills', userProxy);
router.post('/workers/:workerId/skills', userProxy);
router.put('/workers/:workerId/skills/:skillId', userProxy);
router.delete('/workers/:workerId/skills/:skillId', userProxy);
router.get('/workers/:workerId/stats', userProxy);
router.get('/workers/:workerId/earnings', userProxy);
router.post('/workers/nearby', userProxy);
// Analytics proxy (admin + worker self)
router.get('/analytics/platform', userProxy);
router.get('/analytics/system-metrics', userProxy);
router.get('/analytics/user-activity', userProxy);
router.get('/analytics/worker/:workerId', userProxy);
router.get('/users/analytics/worker/:workerId', userProxy);

// Hirer-specific routes
router.get('/hirers', userProxy);
router.get('/hirers/:hirerId', userProxy);
router.get('/hirers/:hirerId/jobs', userProxy);

// User verification routes
router.post('/verify-email', userProxy);
router.post('/resend-verification', userProxy);
router.put('/verify-phone', userProxy);

// Settings routes
router.get('/settings', userProxy);
router.put('/settings', userProxy);
router.put('/settings/notifications', userProxy);
router.put('/settings/privacy', userProxy);

// Fallback: proxy any other /api/users/* paths to user-service preserving prefix
router.use('/', userProxy);

module.exports = router;