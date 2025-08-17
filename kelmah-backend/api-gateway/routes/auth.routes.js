/**
 * Authentication Service Routes
 * Proxy configuration for auth-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const axios = require('axios');

// Get service URLs from app context
const getServiceUrl = (req) => req.app.get('serviceUrls').AUTH_SERVICE;

// Public authentication routes (no auth required)
const publicAuthProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/auth',
    // No rewrite: auth-service expects '/api/auth/*'
    requireAuth: false
  });
  return proxy(req, res, next);
};

// Protected authentication routes (auth required)
const protectedAuthProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/auth',
    // No rewrite: auth-service expects '/api/auth/*'
    requireAuth: true
  });
  return proxy(req, res, next);
};

// Authentication middleware for protected routes
const { authenticate } = require('../middleware/auth');

// Public routes  
router.post('/login', publicAuthProxy);

router.post('/register', async (req, res) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/auth/register`;
    const r = await axios.post(url, req.body, {
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': req.id || '' },
      timeout: 45000,
      validateStatus: () => true,
    });
    res.status(r.status).set(r.headers).send(r.data);
  } catch (e) {
    const status = e.response?.status || 504;
    res.status(status).json({ success: false, message: e.message || 'Auth service unavailable' });
  }
});
router.post('/forgot-password', publicAuthProxy);
router.post('/reset-password', publicAuthProxy);
router.get('/verify-email/:token', publicAuthProxy);
// Refresh token aliases for FE compatibility
router.post('/refresh', publicAuthProxy);
router.post('/refresh-token', publicAuthProxy);
// Verify auth (returns current user)
router.get('/verify', publicAuthProxy);
// Resend verification email
router.post('/resend-verification-email', publicAuthProxy);

// Protected routes
router.post('/logout', authenticate, protectedAuthProxy);
router.get('/me', authenticate, protectedAuthProxy);
router.put('/change-password', authenticate, protectedAuthProxy);
router.post('/validate', authenticate, protectedAuthProxy);

// MFA routes
router.post('/setup-mfa', authenticate, protectedAuthProxy);
router.post('/verify-mfa', authenticate, protectedAuthProxy);
router.post('/disable-mfa', authenticate, protectedAuthProxy);

module.exports = router;