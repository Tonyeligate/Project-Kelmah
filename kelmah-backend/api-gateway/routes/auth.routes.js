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
      message: 'Authentication service temporarily unavailable'
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
    // Only forward safe headers — avoid leaking internal upstream headers
    const safeHeaders = {};
    if (r.headers['content-type']) safeHeaders['content-type'] = r.headers['content-type'];
    if (r.headers['set-cookie']) safeHeaders['set-cookie'] = r.headers['set-cookie'];
    res.status(r.status).set(safeHeaders).send(r.data);
  } catch (e) {
    const status = e.response?.status || 504;
    res.status(status).json({ success: false, message: e.message || 'Auth service unavailable' });
  }
});
router.post('/forgot-password', publicAuthProxy);
router.post('/reset-password', publicAuthProxy);
router.get('/verify-email/:token', publicAuthProxy);
// Refresh token aliases for FE compatibility.
// Use direct axios (not proxy middleware) with a 60s timeout so Render cold starts
// (~20-50s) don't cause a 504 Gateway Timeout before the auth service wakes up.
const refreshTokenDirectHandler = async (req, res) => {
  try {
    const upstream = getServiceUrl(req);
    const suffix = req.path === '/refresh' ? '/refresh' : '/refresh-token';
    const url = `${upstream}/api/auth${suffix}`;
    console.log(`[REFRESH-TOKEN] Forwarding to: ${url}`);
    const r = await axios.post(url, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.id || '',
        'User-Agent': 'kelmah-api-gateway',
      },
      timeout: 60000, // 60s to survive Render cold starts (default proxy was 30s → 504)
      validateStatus: () => true,
    });
    console.log(`[REFRESH-TOKEN] Response: ${r.status}`);
    res.status(r.status).json(r.data);
  } catch (e) {
    console.error(`[REFRESH-TOKEN] Error:`, e.message);
    res.status(504).json({
      success: false,
      message: 'Authentication service temporarily unavailable. Please try again.'
    });
  }
};
router.post('/refresh', refreshTokenDirectHandler);
router.post('/refresh-token', refreshTokenDirectHandler);
// Verify auth (returns current user)
router.get('/verify', authenticate, protectedAuthProxy);
// Resend verification email
router.post('/resend-verification-email', publicAuthProxy);

// Protected routes
router.post('/logout', authenticate, protectedAuthProxy);
router.get('/me', authenticate, protectedAuthProxy);
// Both frontend and auth-service use POST for change-password
router.post('/change-password', authenticate, protectedAuthProxy);
router.post('/validate', authenticate, protectedAuthProxy);

// MFA routes — auth-service expects /mfa/setup, /mfa/verify, /mfa/disable
router.post('/mfa/setup', authenticate, protectedAuthProxy);
router.post('/mfa/verify', authenticate, protectedAuthProxy);
router.post('/mfa/disable', authenticate, protectedAuthProxy);
// Legacy aliases (setup-mfa, verify-mfa, disable-mfa)
router.post('/setup-mfa', authenticate, protectedAuthProxy);
router.post('/verify-mfa', authenticate, protectedAuthProxy);
router.post('/disable-mfa', authenticate, protectedAuthProxy);

// Session management routes
router.get('/sessions', authenticate, protectedAuthProxy);
router.delete('/sessions', authenticate, protectedAuthProxy);
router.delete('/sessions/:sessionId', authenticate, protectedAuthProxy);

// Account management routes
router.post('/account/deactivate', authenticate, protectedAuthProxy);
router.post('/account/reactivate', publicAuthProxy); // Public — reactivation doesn't require active auth

// Auth stats (admin)
router.get('/stats', authenticate, protectedAuthProxy);

module.exports = router;