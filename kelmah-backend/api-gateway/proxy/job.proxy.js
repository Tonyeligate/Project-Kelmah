/**
 * Job Service Proxy
 * Handles routing and proxying requests to the job service
 */

const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

/**
 * Create job service proxy middleware
 * @param {string} targetUrl - Job service URL
 * @param {Object} options - Additional proxy options
 * @returns {Function} Express middleware
 */
const createJobProxy = (targetUrl, options = {}) => {
  const defaultOptions = {
    target: targetUrl,
    changeOrigin: true,
    // Ensure the upstream sees the full service prefix even when mounted under '/api/jobs'
    pathRewrite: (path, req) => {
      try {
        if (!path || path === '/') return '/api/jobs';
        return path.startsWith('/api/jobs') ? path : `/api/jobs${path.startsWith('/') ? '' : '/'}${path}`;
      } catch (_) {
        return path;
      }
    },
    onError: (err, req, res) => {
      console.error('Job proxy error:', err.message);
      res.status(503).json({ 
        error: 'Job service temporarily unavailable',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add user information if available
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
      
      // Add request ID for tracing
      proxyReq.setHeader('X-Request-ID', req.id || Date.now().toString());
      
      console.log(`[Job Proxy] Proxying ${req.method} ${req.url} to ${targetUrl}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Job Proxy] Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    }
  };

  return createProxyMiddleware({ ...defaultOptions, ...options });
};

/**
 * Health check for job service
 * @param {string} targetUrl - Job service URL
 * @returns {Promise<Object>} Health status
 */
const checkJobServiceHealth = async (targetUrl) => {
  try {
    const response = await axios.get(`${targetUrl}/health`, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'API-Gateway-Health-Check'
      }
    });
    
    return {
      healthy: true,
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Enhanced job proxy with health checking
 * @param {string} targetUrl - Job service URL
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
const createEnhancedJobProxy = (targetUrl, options = {}) => {
  let isHealthy = true;
  let lastHealthCheck = 0;
  const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  // Periodic health check
  const performHealthCheck = async () => {
    const now = Date.now();
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      lastHealthCheck = now;
      const health = await checkJobServiceHealth(targetUrl);
      isHealthy = health.healthy;
      
      if (!isHealthy) {
        console.warn('[Job Proxy] Service health check failed:', health.error);
      }
    }
  };

  return async (req, res, next) => {
    await performHealthCheck();
    
    if (!isHealthy) {
      return res.status(503).json({
        error: 'Job service is currently unavailable',
        message: 'Please try again later',
        timestamp: new Date().toISOString()
      });
    }

    // Use the standard proxy middleware
    const proxy = createJobProxy(targetUrl, options);
    return proxy(req, res, next);
  };
};

module.exports = {
  createJobProxy,
  createEnhancedJobProxy,
  checkJobServiceHealth
};
