/**
 * Service Proxy Utility
 * Creates proxy middleware for different services
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Create a proxy middleware for a service
 * @param {Object} options - Proxy options
 * @param {string} options.target - Target service URL
 * @param {string} options.pathPrefix - Path prefix to match
 * @param {Object} options.pathRewrite - Path rewrite rules
 * @param {boolean} options.requireAuth - Whether the route requires authentication
 * @returns {Function} Proxy middleware
 */
const createServiceProxy = (options) => {
  const {
    target,
    pathPrefix,
    pathRewrite = {},
    requireAuth = true,
  } = options;

  const proxyOptions = {
    target,
    changeOrigin: true,
    // Ensure nested routers keep their mount prefix by pre-pending pathPrefix
    // Example: Gateway mounts router at /api/auth and route is '/login'.
    // We rewrite '/login' -> '/api/auth/login' for the upstream service.
    pathRewrite: (path, req) => {
      let out = path || '';
      if (pathPrefix) {
        const needsPrefix = !out.startsWith(pathPrefix);
        if (needsPrefix) {
          out = `${pathPrefix}${out.startsWith('/') ? '' : '/'}${out}`;
        }
      }
      // Apply additional rewrite rules if provided (object of regex->replacement)
      if (pathRewrite && typeof pathRewrite === 'object') {
        try {
          for (const [from, to] of Object.entries(pathRewrite)) {
            out = out.replace(new RegExp(from), to);
          }
        } catch (_) {}
      }
      return out;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward user information to services
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
      
      // Forward the original token
      if (req.token) {
        proxyReq.setHeader('Authorization', `Bearer ${req.token}`);
      }
      
      // Add internal service identification
      const internalKey = process.env.INTERNAL_API_KEY || (process.env.NODE_ENV !== 'production' ? 'internal-request' : undefined);
      if (internalKey) {
        proxyReq.setHeader('X-Internal-Request', internalKey);
      }
      
      // Log the proxy request
      console.log(`Proxying ${req.method} ${req.originalUrl} to ${target}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log the proxy response
      console.log(`Proxy response from ${target}: ${proxyRes.statusCode}`);
      // Do not override CORS here; rely on gateway-level CORS
    },
    onError: (err, req, res) => {
      console.error(`Proxy error to ${target}:`, err);
      
      // Send appropriate error response
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        res.status(503).json({ message: 'Service unavailable' });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  };

  return createProxyMiddleware(proxyOptions);
};

/**
 * Create a proxy for WebSocket connections
 * @param {string} path - WebSocket path
 * @param {string} target - Target WebSocket server
 * @returns {Object} WebSocket proxy configuration
 */
const createWebSocketProxy = (path, target) => {
  return {
    path,
    target: target.replace('http', 'ws'),
    ws: true,
    changeOrigin: true
  };
};

module.exports = {
  createServiceProxy,
  createWebSocketProxy
}; 