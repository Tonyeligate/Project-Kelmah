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
    selfHandleResponse: false, // Let proxy handle response
    timeout: 30000, // 30 second timeout for Job Service responses
    proxyTimeout: 30000, // 30 second proxy timeout
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
      // Add user information if available (serviceTrust format)
      if (req.user) {
        proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
        proxyReq.setHeader('x-auth-source', 'api-gateway');
      }

      // Add request ID for tracing
      proxyReq.setHeader('X-Request-ID', req.id || Date.now().toString());

      console.log(`[Job Proxy] Proxying ${req.method} ${req.url} to ${targetUrl}`);

      // Re-stream JSON body payloads because express.json() consumes the stream
      const methodHasBody = !['GET', 'HEAD'].includes(req.method);
      const hasParsedBody = req.body && (Buffer.isBuffer(req.body) || Object.keys(req.body).length > 0);

      if (methodHasBody && hasParsedBody) {
        console.log(`[Job Proxy] Re-streaming body for ${req.method} ${req.url}`, {
          bodyType: Buffer.isBuffer(req.body) ? 'Buffer' : 'Object',
          bodySize: Buffer.isBuffer(req.body) ? req.body.length : JSON.stringify(req.body).length
        });

        let bodyBuffer;
        if (Buffer.isBuffer(req.body)) {
          bodyBuffer = req.body;
        } else {
          bodyBuffer = Buffer.from(JSON.stringify(req.body));
          if (!proxyReq.getHeader('Content-Type')) {
            proxyReq.setHeader('Content-Type', 'application/json');
          }
        }

        proxyReq.setHeader('Content-Length', bodyBuffer.length);

        try {
          proxyReq.write(bodyBuffer);
          // Don't call proxyReq.end() - let http-proxy-middleware handle it
          console.log(`[Job Proxy] Body written for ${req.method} ${req.url}`);
        } catch (writeErr) {
          console.error('[Job Proxy] Failed to forward request body', {
            method: req.method,
            url: req.originalUrl,
            message: writeErr.message
          });
          proxyReq.destroy(writeErr);
        }
      } else if (!methodHasBody) {
        // GET/HEAD requests don't need body handling
        console.log(`[Job Proxy] No body for ${req.method} ${req.url}`);
      }
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
  // Try preferred /api/health, fall back to legacy /health on 404
  const headers = {
    'User-Agent': 'API-Gateway-Health-Check',
    'ngrok-skip-browser-warning': 'true'
  };
  try {
    const response = await axios.get(`${targetUrl}/api/health`, { timeout: 5000, headers });
    return {
      healthy: true,
      status: response.status,
      data: response.data,
      endpoint: '/api/health',
      timestamp: new Date().toISOString()
    };
  } catch (primaryError) {
    // Only fall back on 404 (endpoint missing) or 501/405 (not implemented)
    const status = primaryError?.response?.status;
    console.warn('[Job Proxy] Primary health check failed', {
      targetUrl,
      endpoint: '/api/health',
      status,
      message: primaryError?.message
    });
    if (status === 404 || status === 405 || status === 501) {
      try {
        const response = await axios.get(`${targetUrl}/health`, { timeout: 5000, headers });
        return {
          healthy: true,
          status: response.status,
          data: response.data,
          endpoint: '/health',
          timestamp: new Date().toISOString()
        };
      } catch (fallbackError) {
        console.warn('[Job Proxy] Fallback health check failed', {
          targetUrl,
          endpoint: '/health',
          status: fallbackError?.response?.status,
          message: fallbackError?.message
        });
        return {
          healthy: false,
          error: fallbackError.message,
          code: fallbackError.code,
          status: fallbackError?.response?.status,
          tried: ['/api/health', '/health'],
          timestamp: new Date().toISOString()
        };
      }
    }
    return {
      healthy: false,
      error: primaryError.message,
      code: primaryError.code,
      status,
      tried: ['/api/health'],
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

  // Create proxy instance ONCE (not per-request) to avoid recreating event handlers
  const proxyMiddleware = createJobProxy(targetUrl, options);

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

    // Use the cached proxy middleware instance
    return proxyMiddleware(req, res, next);
  };
};

module.exports = {
  createJobProxy,
  createEnhancedJobProxy,
  checkJobServiceHealth
};
