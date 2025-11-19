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
const { authenticate } = require('../middlewares/auth');

// Public routes
// Bypass proxy for login/register to avoid body/timeout issues
router.post('/login', async (req, res) => {
  try {
    // Direct connection to auth service avoiding proxy
    // Use resolved service URL from service discovery (supports cloud + local)
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/auth/login`;

    console.log(`[LOGIN] Attempting login to: ${url}`);
    console.log(`[LOGIN] Body:`, JSON.stringify(req.body));

    const r = await axios.post(url, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.id || '',
        'User-Agent': 'kelmah-api-gateway',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log(`[LOGIN] Response status: ${r.status}`);
    res.status(r.status).json(r.data);
  } catch (e) {
    console.error(`[LOGIN] Error:`, e.message);
    console.error(`[LOGIN] Stack:`, e.stack);
    res.status(504).json({
      success: false,
      message: 'Authentication service temporarily unavailable',
      debug: e.message
    });
  }
});

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
router.get('/verify', authenticate, protectedAuthProxy);
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