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
    // Give upstream a bit more time for cold starts (Render free tier: 30-60s)
    proxyTimeout: 60000,
    timeout: 60000,
    // Ensure forwarded path includes the intended service prefix even when mounted under a sub-router
    pathRewrite: (path, req) => {
      try {
        console.log(`[SERVICE PROXY] Input path: ${path}, baseUrl: ${req.baseUrl}`);
        let baseAppliedPath = ensureBasePrefix(path, req);
        console.log(`[SERVICE PROXY] After ensureBasePrefix: ${baseAppliedPath}`);

        // If caller supplied a function, use it directly (after base correction)
        if (typeof providedPathRewrite === 'function') {
          const rewritten = providedPathRewrite(baseAppliedPath, req);
          console.log(`[SERVICE PROXY] After custom rewrite function: ${rewritten}`);
          const normalized = normalizeSlashes(rewritten || baseAppliedPath);
          console.log(`[SERVICE PROXY] After normalizeSlashes: ${normalized}`);
          return normalized;
        }

        // Apply any explicit rewrite rules last (object form)
        const rewritten = applyObjectRewrite(baseAppliedPath);
        return normalizeSlashes(rewritten);
      } catch (error) {
        console.error(`[SERVICE PROXY] Error in pathRewrite:`, error);
        // Fallback to original
        return path;
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward user information to services (serviceTrust format).
      // IMPORTANT: use the exact string already set by authenticate() in req.headers so
      // that the x-gateway-signature HMAC stays consistent — never re-serialize req.user
      // here because a new JSON.stringify() call may produce a different string and cause
      // verifyGatewayRequest to reject with 401 "Invalid gateway signature".
      if (req.user) {
        const signedPayload = req.headers['x-authenticated-user'] || JSON.stringify(req.user);
        proxyReq.setHeader('x-authenticated-user', signedPayload);
        proxyReq.setHeader('x-auth-source', 'api-gateway');
        if (req.headers['x-gateway-signature']) {
          proxyReq.setHeader('x-gateway-signature', req.headers['x-gateway-signature']);
        }
      }
      
      // Forward Authorization header/token to upstream
      const incomingAuthHeader = req.headers && req.headers['authorization'];
      if (req.token) {
        proxyReq.setHeader('Authorization', `Bearer ${req.token}`);
      } else if (incomingAuthHeader) {
        proxyReq.setHeader('Authorization', incomingAuthHeader);
      }
      
      // CRIT-12 FIX: Generate a random internal API key at startup if not provided,
      // instead of using a predictable 'internal-request' string.
      if (!process.env.INTERNAL_API_KEY && !serviceProxy._devInternalKey) {
        serviceProxy._devInternalKey = require('crypto').randomBytes(32).toString('hex');
      }
      const internalKey = process.env.INTERNAL_API_KEY || serviceProxy._devInternalKey;
      if (internalKey) {
        proxyReq.setHeader('X-Internal-Request', internalKey);
      }

      // LOW-10 FIX: Handle both JSON and URL-encoded bodies parsed by Express
      try {
        const method = (req.method || '').toUpperCase();
        const contentType = (req.headers['content-type'] || '').toLowerCase();
        const hasBody = req.body && Object.keys(req.body).length > 0;
        if (method !== 'GET' && method !== 'HEAD' && hasBody) {
          let bodyData;
          if (contentType.includes('application/json')) {
            bodyData = JSON.stringify(req.body);
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            bodyData = new URLSearchParams(req.body).toString();
          }
          if (bodyData) {
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
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