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
    pathRewrite: providedPathRewrite = {},
    requireAuth = true,
  } = options;

  // Build a safe pathRewrite that preserves nested router base paths
  // and applies any explicit rewrite rules provided by callers.
  const applyObjectRewrite = (incomingPath) => {
    if (!providedPathRewrite || typeof providedPathRewrite !== 'object') return incomingPath;
    let rewritten = incomingPath;
    try {
      for (const [pattern, replacement] of Object.entries(providedPathRewrite)) {
        const regex = new RegExp(pattern);
        if (regex.test(rewritten)) {
          rewritten = rewritten.replace(regex, replacement);
        }
      }
    } catch (_) {
      // On any parsing error, fall back to the original path
      return incomingPath;
    }
    return rewritten;
  };

  const normalizeSlashes = (value) => {
    if (!value) return '/';
    return value.replace(/\/{2,}/g, '/');
  };

  const resolveBasePrefix = (req) => {
    if (typeof pathPrefix === 'string' && pathPrefix.length > 0) {
      return pathPrefix;
    }
    if (req && typeof req.baseUrl === 'string' && req.baseUrl.length > 0) {
      return req.baseUrl;
    }
    return '';
  };

  const ensureBasePrefix = (incomingPath, req) => {
    let normalizedPath = normalizeSlashes(incomingPath || '/');
    const base = resolveBasePrefix(req);

    if (!base) {
      return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    }

    const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedBase = trimmedBase.startsWith('/') ? trimmedBase : `/${trimmedBase}`;

    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }

    if (!normalizedPath.startsWith(normalizedBase)) {
      const baseSegments = normalizedBase.split('/').filter(Boolean);
      const trailingSegment = baseSegments[baseSegments.length - 1];

      if (trailingSegment && normalizedPath.startsWith(`/${trailingSegment}`)) {
        const remainder = normalizedPath.slice(trailingSegment.length + 1);
        normalizedPath = normalizeSlashes(`${normalizedBase}${remainder}`);
      } else {
        normalizedPath = normalizeSlashes(`${normalizedBase}${normalizedPath}`);
      }
    }

    const duplicatePrefix = `${normalizedBase}${normalizedBase}`;
    while (normalizedPath.startsWith(duplicatePrefix)) {
      normalizedPath = normalizedPath.replace(normalizedBase, '');
    }

    if (!normalizedPath.startsWith(normalizedBase)) {
      normalizedPath = normalizeSlashes(`${normalizedBase}${normalizedPath}`);
    }

    return normalizedPath;
  };

  const proxyOptions = {
    target,
    changeOrigin: true,
    // Give upstream a bit more time for cold starts
    proxyTimeout: 30000,
    timeout: 30000,
    // Ensure forwarded path includes the intended service prefix even when mounted under a sub-router
    pathRewrite: (path, req) => {
      try {
        let baseAppliedPath = ensureBasePrefix(path, req);

        // If caller supplied a function, use it directly (after base correction)
        if (typeof providedPathRewrite === 'function') {
          const rewritten = providedPathRewrite(baseAppliedPath, req);
          return normalizeSlashes(rewritten || baseAppliedPath);
        }

        // Apply any explicit rewrite rules last (object form)
        const rewritten = applyObjectRewrite(baseAppliedPath);
        return normalizeSlashes(rewritten);
      } catch (_) {
        // Fallback to original
        return path;
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward user information to services (serviceTrust format)
      if (req.user) {
        proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
        proxyReq.setHeader('x-auth-source', 'api-gateway');
      }
      
      // Forward Authorization header/token to upstream
      const incomingAuthHeader = req.headers && req.headers['authorization'];
      if (req.token) {
        proxyReq.setHeader('Authorization', `Bearer ${req.token}`);
      } else if (incomingAuthHeader) {
        proxyReq.setHeader('Authorization', incomingAuthHeader);
      }
      
      // Add internal service identification
      const internalKey = process.env.INTERNAL_API_KEY || (process.env.NODE_ENV !== 'production' ? 'internal-request' : undefined);
      if (internalKey) {
        proxyReq.setHeader('X-Internal-Request', internalKey);
      }

      // If body was already parsed by Express (application/json), re-send it to the upstream
      try {
        const method = (req.method || '').toUpperCase();
        const contentType = (req.headers['content-type'] || '').toLowerCase();
        const isJson = contentType.includes('application/json');
        const hasBody = req.body && Object.keys(req.body).length > 0;
        if (method !== 'GET' && method !== 'HEAD' && isJson && hasBody) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      } catch (_) {}
      
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