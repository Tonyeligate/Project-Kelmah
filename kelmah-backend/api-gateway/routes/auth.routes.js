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
const { authenticate, invalidateUserCache } = require('../middlewares/auth');

const buildForwardHeaders = (req, { includeGatewayHeaders = false } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': req.id || '',
    'User-Agent': 'kelmah-api-gateway',
  };

  if (!includeGatewayHeaders) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  if (includeGatewayHeaders) {
    if (req.headers['x-authenticated-user']) {
      headers['x-authenticated-user'] = req.headers['x-authenticated-user'];
    }
    if (req.headers['x-auth-source']) {
      headers['x-auth-source'] = req.headers['x-auth-source'];
    }
    if (req.headers['x-gateway-signature']) {
      headers['x-gateway-signature'] = req.headers['x-gateway-signature'];
    }
  }

  return headers;
};

const sendUpstreamResponse = (res, upstreamResponse) => {
  const safeHeaders = {};
  if (upstreamResponse.headers['content-type']) safeHeaders['content-type'] = upstreamResponse.headers['content-type'];
  if (upstreamResponse.headers['set-cookie']) safeHeaders['set-cookie'] = upstreamResponse.headers['set-cookie'];
  if (upstreamResponse.headers.location) safeHeaders.location = upstreamResponse.headers.location;

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
  params = req.query,
} = {}) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/auth${authPath}`;
    const response = await axios({
      method,
      url,
      data,
      params,
      headers: buildForwardHeaders(req),
      maxRedirects: 0,
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

const forwardProtectedAuthDirect = async (req, res, authPath, {
  method = 'post',
  timeout = 60000,
  data = req.body,
  params = req.query,
  onSuccess = null,
} = {}) => {
  try {
    const upstream = getServiceUrl(req);
    const url = `${upstream}/api/auth${authPath}`;
    const response = await axios({
      method,
      url,
      data,
      params,
      headers: buildForwardHeaders(req, { includeGatewayHeaders: true }),
      maxRedirects: 0,
      timeout,
      validateStatus: () => true,
    });

    if (
      typeof onSuccess === 'function' &&
      response.status >= 200 &&
      response.status < 300
    ) {
      try {
        await onSuccess(response);
      } catch (cacheError) {
        console.warn('Post-auth mutation hook failed:', cacheError?.message || cacheError);
      }
    }

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
router.post('/login', rateLimiters.login, (req, res) => forwardPublicAuthDirect(req, res, '/login', { timeout: 30000 }));
router.post('/register', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/register', { timeout: 60000 }));
router.post('/forgot-password', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/forgot-password', { timeout: 60000 }));
router.post('/reset-password', rateLimiters.auth, (req, res) => forwardPublicAuthDirect(req, res, '/reset-password', { timeout: 60000 }));
router.get('/verify-email/:token', rateLimiters.verificationToken, (req, res) => {
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
router.post('/oauth/exchange', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/oauth/exchange', { timeout: 60000 });
});
router.get('/google', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/google', {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
router.get('/google/callback', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/google/callback', {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
router.get('/facebook', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/facebook', {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
router.get('/facebook/callback', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/facebook/callback', {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
router.get('/linkedin', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/linkedin', {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
router.get('/linkedin/callback', rateLimiters.auth, (req, res) => {
  return forwardPublicAuthDirect(req, res, '/linkedin/callback', {
    method: 'get',
    timeout: 60000,
    data: undefined,
  });
});
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
router.post('/change-password', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/change-password', {
    timeout: 60000,
    onSuccess: () => invalidateUserCache(req.user?.id),
  });
});
router.post('/validate', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/validate', { timeout: 60000 });
});

// MFA routes — auth-service expects /mfa/setup, /mfa/verify, /mfa/disable
router.post('/mfa/setup', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/mfa/setup', { timeout: 60000 });
});
router.post('/mfa/verify', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/mfa/verify', { timeout: 60000 });
});
router.post('/mfa/disable', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/mfa/disable', { timeout: 60000 });
});
// Legacy aliases (setup-mfa, verify-mfa, disable-mfa)
router.post('/setup-mfa', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/setup-mfa', { timeout: 60000 });
});
router.post('/verify-mfa', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/verify-mfa', { timeout: 60000 });
});
router.post('/disable-mfa', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/disable-mfa', { timeout: 60000 });
});

// Session management routes
router.get('/sessions', authenticate, protectedAuthProxy);
router.delete('/sessions', authenticate, protectedAuthProxy);
router.delete('/sessions/:sessionId', authenticate, protectedAuthProxy);

// Account management routes
router.post('/account/deactivate', authenticate, (req, res) => {
  return forwardProtectedAuthDirect(req, res, '/account/deactivate', {
    timeout: 60000,
    onSuccess: () => invalidateUserCache(req.user?.id),
  });
});
router.post('/account/reactivate', publicAuthProxy); // Public — reactivation doesn't require active auth

// Auth stats (admin)
router.get('/stats', authenticate, protectedAuthProxy);

module.exports = router;