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
    pathRewrite: {
      [`^${pathPrefix}`]: '',
      ...pathRewrite
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
      proxyReq.setHeader('X-Internal-Request', process.env.INTERNAL_API_KEY || 'internal-request');
      
      // Log the proxy request
      console.log(`Proxying ${req.method} ${req.originalUrl} to ${target}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log the proxy response
      console.log(`Proxy response from ${target}: ${proxyRes.statusCode}`);
      
      // Add CORS headers if needed
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
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