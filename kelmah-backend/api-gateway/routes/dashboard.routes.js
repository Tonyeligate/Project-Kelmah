const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const auth = require('../middleware/auth');

// Dashboard proxy router
// Maps /api/dashboard/* -> user-service /api/users/dashboard/*
// We keep a dedicated router for future dashboard-specific auth / caching / rate limits.
const router = express.Router();

// Resolve user service URL from app context each request to remain dynamic
function getUserService(req) {
    const urls = req.app.get('serviceUrls') || {};
    return urls.USER_SERVICE || process.env.USER_SERVICE_URL || 'http://localhost:5002';
}

// Basic auth strategy: require authentication for all dashboard endpoints for now.
router.use(auth.authenticate);

router.use('/', (req, res, next) => {
    const target = getUserService(req);
    const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        // Preserve query string and method. Path rewrite adds /api/users prefix before /dashboard
        pathRewrite: (path, reqInner) => {
            // Original incoming path example: /api/dashboard/metrics
            // We strip the leading /api/dashboard and reattach to /api/users/dashboard
            const suffix = path.replace(/^\/api\/dashboard/, '');
            const rewritten = `/api/users/dashboard${suffix}`;
            return rewritten;
        },
        onProxyReq: (proxyReq, reqInner) => {
            // Forward user identity headers if present
            if (reqInner.user) {
                proxyReq.setHeader('X-User-ID', reqInner.user.id);
                proxyReq.setHeader('X-User-Role', reqInner.user.role);
            }
        },
        onError: (err, reqInner, resInner) => {
            console.error('Dashboard proxy error:', err.message);
            if (!resInner.headersSent) {
                resInner.status(502).json({ error: 'Dashboard service unavailable', details: err.message });
            }
        }
    });
    return proxy(req, res, next);
});

module.exports = router;
