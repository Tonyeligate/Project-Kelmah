/**
 * Authentication Service Routes
 * Proxy configuration for auth-service endpoints
 */

const express = require('express');
const router = express.Router();
const { createServiceProxy } = require('../proxy/serviceProxy');
const axios = require('axios');
const { rateLimiters } = require('../middlewares/rate-limiter');

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

const sendUpstreamResponse = (res, upstreamResponse) => {
  const safeHeaders = {};
  if (upstreamResponse.headers['content-type']) safeHeaders['content-type'] = upstreamResponse.headers['content-type'];
  if (upstreamResponse.headers['set-cookie']) safeHeaders['set-cookie'] = upstreamResponse.headers['set-cookie'];

  res.status(upstreamResponse.status).set(safeHeaders);
  if (typeof upstreamResponse.data === 'string') {
    return res.send(upstreamResponse.data);
  }
  return res.json(upstreamResponse.data);
};

const forwardPublicAuthDirect = async (req, res, authPath, {
  method = 'post',
  timeout = 60000,
  data = req.body,
} = {}) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/auth${authPath}`;
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.id || '',
        'User-Agent': 'kelmah-api-gateway',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout,
      validateStatus: () => true,
    });

    return sendUpstreamResponse(res, response);
  } catch (error) {
    const status = error.response?.status || 504;
    return res.status(status).json({
      success: false,
      message: error.message || 'Authentication service temporarily unavailable'
    });
  }
};

// Public routes
// Bypass the generic proxy for public auth mutations so Express body parsing
// cannot interfere with upstream request completion during cloud deployments.
router.post('/login', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/login', { timeout: 30000 }));
router.post('/register', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/register', { timeout: 60000 }));
router.post('/forgot-password', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/forgot-password', { timeout: 60000 }));
router.post('/reset-password', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/reset-password', { timeout: 60000 }));
router.get('/verify-email/:token', rateLimiters.general, (req, res) => {
  return forwardPublicAuthDirect(req, res, `/verify-email/${req.params.token}`, {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
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
router.post('/refresh', rateLimiters.auth, refreshTokenDirectHandler);
router.post('/refresh-token', rateLimiters.auth, refreshTokenDirectHandler);
// Verify auth (returns current user)
router.get('/verify', authenticate, protectedAuthProxy);
// Resend verification email
router.post('/resend-verification-email', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/resend-verification-email', { timeout: 60000 });
});

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