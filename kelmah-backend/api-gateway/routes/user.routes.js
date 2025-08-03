/**
 * User Service Routes
 * Proxy configuration for user-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const authenticate = require('../middlewares/auth.middleware');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').USER_SERVICE;

// Protected user proxy
const userProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/users',
    requireAuth: true
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
router.get('/', userProxy); // Get all users (admin only)
router.get('/:userId', userProxy); // Get specific user
router.put('/:userId', userProxy); // Update user
router.delete('/:userId', userProxy); // Delete user

// Worker-specific routes
router.get('/workers', userProxy);
router.get('/workers/:workerId', userProxy);
router.put('/workers/:workerId/status', userProxy);
router.get('/workers/:workerId/portfolio', userProxy);
router.put('/workers/:workerId/portfolio', userProxy);

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

module.exports = router;