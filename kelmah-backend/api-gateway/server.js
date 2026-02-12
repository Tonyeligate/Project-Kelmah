/**
 * Kelmah API Gateway Server
 * Centralized routing and authentication for all microservices
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { celebrate, Joi, errors: celebrateErrors, Segments } = require('celebrate');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const winston = require('winston');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { createKeepAliveManager } = require('./utils/serviceKeepAlive');

// Import middleware
const { authenticate, authorizeRoles, optionalAuth } = require('./middlewares/auth');
const loggingMiddleware = require('./middlewares/logging');
const errorHandler = require('./middlewares/error-handler');
const requestValidator = require('./middlewares/request-validator');

// Import intelligent service discovery
const {
  initializeServiceRegistry,
  getServiceUrlsForApp,
  detectEnvironment,
  getServiceUrl
} = require('./utils/serviceDiscovery');

/**
 * Dynamic Proxy Middleware Creator
 * Creates proxy middleware that resolves service URLs at runtime.
 * Caches proxy instances per service+options to avoid per-request allocation.
 */
const proxyCache = new Map();

const createDynamicProxy = (serviceName, options = {}) => {
  // Build a stable cache key from service name + serialized options
  const cacheKey = `${serviceName}:${JSON.stringify(options)}`;

  return (req, res, next) => {
    try {
      const targetUrl = services[serviceName] || getServiceUrl(serviceName);

      if (!targetUrl) {
        console.error(`❌ No URL found for service: ${serviceName}`);
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          service: serviceName
        });
      }

      const instanceKey = `${cacheKey}:${targetUrl}`;
      let proxy = proxyCache.get(instanceKey);
      if (!proxy) {
        proxy = createProxyMiddleware({
          target: targetUrl,
          changeOrigin: true,
          ...options
        });
        proxyCache.set(instanceKey, proxy);
      }

      return proxy(req, res, next);
    } catch (error) {
      console.error(`❌ Proxy error for ${serviceName}:`, error);
      return res.status(500).json({
        error: 'Proxy configuration error',
        service: serviceName
      });
    }
  };
};

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// ✅ FIXED: Configure Express to trust proxy headers (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/gateway.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Global service registry - will be populated by intelligent discovery
let services = {};
let socketIoProxyInstance = null;
const keepAliveManager = createKeepAliveManager({
  getServices: () => services,
  logger
});

// Initialize keep-alive system to prevent Render spin-down
let internalKeepAlive;
try {
  const { initKeepAlive, keepAliveMiddleware, keepAliveTriggerHandler } = require('../shared/utils/keepAlive');
  internalKeepAlive = initKeepAlive('api-gateway', { logger });
  logger.info('✅ Internal keep-alive system initialized for API Gateway');
} catch (error) {
  logger.warn('⚠️ Internal keep-alive system not available:', error.message);
}

// Initialize services on startup
const initializeServices = async () => {
  try {
    console.log('🔧 API Gateway starting service discovery...');
    services = await initializeServiceRegistry();

    // Reset cached Socket.IO proxy whenever service discovery refreshes targets
    socketIoProxyInstance = null;

    // Expose service URLs to route modules
    app.set('serviceUrls', getServiceUrlsForApp(services));

    console.log('✅ Service discovery completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Service discovery failed:', error);
    // Fallback to localhost URLs
    services = {
      auth: 'http://localhost:5001',
      user: 'http://localhost:5002',
      job: 'http://localhost:5003',
      payment: 'http://localhost:5004',
      messaging: 'http://localhost:5005',
      review: 'http://localhost:5006'
    };
    socketIoProxyInstance = null;
    app.set('serviceUrls', getServiceUrlsForApp(services));
    console.log('⚠️ Using fallback localhost URLs');
    return false;
  }
};

// Fail-fast: ensure critical environment variables are present
(() => {
  const requiredEnv = ['JWT_SECRET'];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error('API Gateway missing required environment variables', { missing });
    process.exit(1);
  }
  // In production, INTERNAL_API_KEY must be set for internal calls
  if (process.env.NODE_ENV === 'production' && !process.env.INTERNAL_API_KEY) {
    logger.error('API Gateway missing INTERNAL_API_KEY in production');
    process.exit(1);
  }
})();

// Global middleware
app.use(helmet());
app.use(compression());
// ✅ ENHANCED: Improved CORS with Vercel preview URL support and env allowlist
const corsOriginHandler = (origin, callback) => {
  const envAllow = (process.env.CORS_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://project-kelmah.vercel.app',
    'https://kelmah-frontend-cyan.vercel.app',
    ...envAllow,
  ];
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    logger.error('CORS_ALLOWLIST must not be empty in production');
    return callback(new Error('CORS not configured'));
  }

  // Allow Vercel preview URLs
  const vercelPatterns = [
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*-kelmahs-projects\.vercel\.app$/,
    /^https:\/\/project-kelmah.*\.vercel\.app$/,
    /^https:\/\/kelmah-frontend.*\.vercel\.app$/
  ];

  // Allow LocalTunnel domains
  const localtunnelPatterns = [
    /^https:\/\/.*\.loca\.lt$/,
    /^https:\/\/.*\.ngrok-free\.app$/
  ];

  if (!origin) return callback(null, true); // Allow no origin (mobile apps, etc.)

  if (allowedOrigins.includes(origin)) {
    logger.info(`✅ API Gateway CORS allowed exact match: ${origin}`);
    return callback(null, true);
  }

  const isVercelPreview = vercelPatterns.some(pattern => pattern.test(origin));
  if (isVercelPreview) {
    logger.info(`✅ API Gateway CORS allowed Vercel preview: ${origin}`);
    return callback(null, true);
  }

  const isLocalTunnel = localtunnelPatterns.some(pattern => pattern.test(origin));
  if (isLocalTunnel) {
    logger.info(`✅ API Gateway CORS allowed tunnel: ${origin}`);
    return callback(null, true);
  }

  logger.info('Allowed origins:', allowedOrigins);
  logger.warn(`🚨 API Gateway CORS blocked origin: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning',
    'x-requested-with',
    'x-frontend-health-probe',  // ✅ FIXED: Allow frontend health probe header
    'x-request-id'              // ✅ FIXED: Allow Axios request ID header
  ],
  exposedHeaders: ['ngrok-skip-browser-warning', 'x-request-id']
}));

// Request sanitization — strip XSS payloads from input
app.use(requestValidator.sanitizeRequest);

// ============================================================
// RAW WEBHOOK ROUTES — mounted BEFORE body parser
// Stripe & Paystack require the original raw request body for
// HMAC signature verification.  express.json() would parse the
// body into an object, destroying the bytes that the downstream
// services need for `stripe.webhooks.constructEvent()` and
// Paystack's `processWebhook()`.  By mounting these routes here
// the proxy streams the untouched raw body to the service.
// ============================================================

// Stripe webhooks → payment-service (public, no auth)
app.post('/api/webhooks/stripe', createDynamicProxy('payment', {
  pathRewrite: { '^/api/webhooks': '/api/webhooks' },
  onError: (err, req, res) => {
    console.error('[API Gateway] Stripe webhook proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: { message: 'Payment service unavailable', code: 'SERVICE_UNAVAILABLE' }
    });
  }
}));

// Paystack webhooks → payment-service (public, no auth)
app.post('/api/webhooks/paystack', createDynamicProxy('payment', {
  pathRewrite: { '^/api/webhooks': '/api/webhooks' },
  onError: (err, req, res) => {
    console.error('[API Gateway] Paystack webhook proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: { message: 'Payment service unavailable', code: 'SERVICE_UNAVAILABLE' }
    });
  }
}));

// QuickJobs Paystack webhook → job-service (public, no auth)
// The job-service QuickJob route mounts POST /payment/webhook
// BEFORE verifyGatewayRequest, so it is intentionally public.
app.post('/api/quick-jobs/payment/webhook', createDynamicProxy('job', {
  pathRewrite: { '^/api/quick-jobs': '/api/quick-jobs' },
  onError: (err, req, res) => {
    console.error('[API Gateway] QuickJobs webhook proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: { message: 'QuickJob service unavailable', code: 'SERVICE_UNAVAILABLE' }
    });
  }
}));

// ============================================================
// Body parsers — AFTER raw webhook routes
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggingMiddleware(logger));
// Correlate request ID across services
app.use((req, res, next) => {
  if (req.id) {
    res.setHeader('X-Request-ID', req.id);
  }
  next();
});

// Inject internal key for downstream services (defense-in-depth)
app.use((req, res, next) => {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey) {
    req.headers['x-internal-key'] = internalKey;
    req.headers['x-internal-request'] = internalKey;
  }
  next();
});

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' },
  // Do not throttle hirer dashboard critical endpoint (match against full originalUrl)
  skip: (req) => (req.originalUrl || '').startsWith('/api/jobs/my-jobs')
}));

// Root route - API welcome and information
app.get('/', (req, res) => {
  res.json({
    welcome: 'Welcome to Kelmah API Gateway',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health or /api/health',
      documentation: '/api/docs',
      authentication: '/api/auth/*',
      main_services: ['/api/users', '/api/jobs', '/api/payments', '/api/messages']
    },

    features: [
      'Microservices Architecture',
      'Authentication & Authorization',
      'CORS & Security',
      'Rate Limiting & Monitoring',
      'Real-time Messaging Support'
    ]
  });
});

// Health check endpoints (both /health and /api/health for compatibility)
const healthResponse = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services),
    version: '2.0.0',
    uptime: process.uptime(),
    keepAlive: internalKeepAlive ? internalKeepAlive.getStatus() : { enabled: false }
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Keep-alive status endpoint
if (internalKeepAlive) {
  app.get('/health/keepalive', (req, res) => {
    res.json({
      success: true,
      data: internalKeepAlive.getStatus()
    });
  });

  app.get('/api/health/keepalive', (req, res) => {
    res.json({
      success: true,
      data: internalKeepAlive.getStatus()
    });
  });

  // Manual trigger for keep-alive ping
  app.post('/health/keepalive/trigger', async (req, res) => {
    try {
      const results = await internalKeepAlive.triggerPing();
      res.json({
        success: true,
        message: 'Keep-alive ping triggered',
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger keep-alive',
        error: error.message
      });
    }
  });
}

// Aggregated health (services + providers) - Both /health/aggregate and /api/health/aggregate
const aggregatedHealthHandler = async (req, res) => {
  try {
    logger.info('Starting aggregated health check for /api/health/aggregate');
    const axios = require('axios');
    const token = req.headers.authorization;
    const headers = {
      ...(token ? { Authorization: token } : {}),
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'API-Gateway-Health-Check'
    };
    const baseTargets = [
      { name: 'auth', base: services.auth },
      { name: 'user', base: services.user },
      { name: 'job', base: services.job },
      { name: 'payment', base: services.payment },
      { name: 'messaging', base: services.messaging },
      { name: 'review', base: services.review },
    ];
    const results = await Promise.all(baseTargets.map(async (t) => {
      const tryGet = async (url) => axios.get(url, { timeout: 5000, headers });
      try {
        const r = await tryGet(`${t.base}/api/health`);
        return { service: t.name, ok: true, data: r.data, endpoint: '/api/health' };
      } catch (e) {
        const status = e?.response?.status;
        if (status === 404 || status === 405 || status === 501) {
          try {
            const r2 = await tryGet(`${t.base}/health`);
            return { service: t.name, ok: true, data: r2.data, endpoint: '/health' };
          } catch (e2) {
            return { service: t.name, ok: false, error: e2?.message, status: e2?.response?.status, tried: ['/api/health', '/health'] };
          }
        }
        return { service: t.name, ok: false, error: e?.message, status, tried: ['/api/health'] };
      }
    }));
    // Convert results array to object with service names as keys
    const servicesObj = {};
    results.forEach(result => {
      servicesObj[result.service] = {
        status: result.ok ? 'healthy' : 'unhealthy',
        data: result.data,
        error: result.error,
        endpoint: result.endpoint,
        tried: result.tried
      };
    });

    // Provider health from payment service
    let providers;
    try {
      const r = await axios.get(`${services.payment}/api/health/providers`, { timeout: 4000, headers });
      providers = r.data;
    } catch (e) {
      providers = { success: false, error: e?.message };
    }
    logger.info('Aggregated health check completed successfully');
    res.json({ success: true, services: servicesObj, providers });
  } catch (e) {
    logger.error('Aggregated health check failed', { error: e.message });
    res.status(500).json({ success: false, error: e?.message });
  }
};

// Mount aggregated health on both paths to support frontend expectations
app.get('/health/aggregate', aggregatedHealthHandler);
app.get('/api/health/aggregate', aggregatedHealthHandler);

// Authentication routes (public) — use dedicated router to support aliases like /refresh-token
const authRouter = require('./routes/auth.routes');
app.use('/api/auth', authRouter);

// User routes (protected) with validation
app.use(
  '/api/users',
  // Debug logging middleware
  (req, res, next) => {
    console.log('🔍 [API Gateway] /api/users route hit:', {
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      url: req.url,
      hasUser: !!req.user,
      headers: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'none'
      }
    });
    next();
  },
  // Allow-list public GET access for worker listings & details
  (req, res, next) => {
    if (req.method === 'GET') {
      const p = req.path || '';
      if (p === '/workers' || /^\/workers\//.test(p)) {
        console.log('✅ [API Gateway] Public worker route - skipping auth:', p);
        return next();
      }
    }
    return authenticate(req, res, next);
  },
  celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }).unknown(true),
  }),
  createDynamicProxy('user', {
    pathRewrite: (path, req) => {
      // Restore /api/users prefix that Express strips
      const newPath = `/api/users${path}`;
      console.log(`🔄 [Path Rewrite] ${path} → ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req) => {
      console.log('📤 [API Gateway] Proxying to user service:', {
        method: proxyReq.method,
        path: proxyReq.path,
        host: proxyReq.getHeader('host'),
        hasAuth: !!req.user
      });
      if (req.user) {
        proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
        proxyReq.setHeader('x-auth-source', 'api-gateway');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('📥 [API Gateway] Response from user service:', {
        statusCode: proxyRes.statusCode,
        path: req.originalUrl
      });
    },
    onError: (err, req, res) => {
      console.error('❌ [API Gateway] Proxy error:', {
        message: err.message,
        path: req.originalUrl,
        code: err.code
      });
      res.status(503).json({
        error: 'User service unavailable',
        message: err.message
      });
    }
  })
);

// 🔥 NEW: Workers route alias - frontend expects /api/workers
// Route to user service's /api/users/workers endpoint
app.use('/api/workers',
  // Debug logging middleware
  (req, res, next) => {
    console.log('🔍 [API Gateway] /api/workers route hit:', {
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      url: req.url,
      query: req.query,
      hasUser: !!req.user
    });
    next();
  },
  // Public GET access for worker listings - no auth required
  optionalAuth,
  celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }).unknown(true),
  }),
  createDynamicProxy('user', {
    pathRewrite: (path, req) => {
      // Rewrite /api/workers → /api/users/workers
      const newPath = path.replace(/^\//, '/api/users/workers/');
      console.log(`🔄 [Path Rewrite] /api/workers${path} → ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req) => {
      console.log('📤 [API Gateway] Proxying to user service:', {
        method: proxyReq.method,
        path: proxyReq.path,
        host: proxyReq.getHeader('host'),
        hasAuth: !!req.user
      });
      if (req.user) {
        proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
        proxyReq.setHeader('x-auth-source', 'api-gateway');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('📥 [API Gateway] Response from user service:', {
        statusCode: proxyRes.statusCode,
        path: req.originalUrl
      });
    },
    onError: (err, req, res) => {
      console.error('❌ [API Gateway] Proxy error:', {
        message: err.message,
        path: req.originalUrl,
        code: err.code
      });
      res.status(503).json({
        error: 'User service unavailable',
        message: err.message
      });
    }
  })
);

// 🔥 FIX: Availability route alias - frontend expects /api/availability/{userId}
// but actual route is /api/users/workers/{userId}/availability
app.use('/api/availability',
  authenticate,
  (req, res, next) => {
    // Rewrite /api/availability/{userId} to /api/users/workers/{userId}/availability
    const workerId = req.path.replace(/^\//, ''); // Remove leading slash
    req.url = `/api/users/workers/${workerId}/availability`;
    next();
  },
  createDynamicProxy('user', {
    // ✅ FIX: Keep the full path - don't strip anything
    pathRewrite: { '^/': '/' },
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
        proxyReq.setHeader('x-auth-source', 'api-gateway');
      }
    },
  })
);

// Profile routes → user-service
// Allow public GET access for portfolio reads; protect all other routes
app.use('/api/profile',
  (req, res, next) => {
    if (req.method === 'GET') {
      const p = req.path || '';
      const publicPatterns = [
        /^\/workers\/[^/]+\/portfolio$/, // worker portfolio list
        /^\/portfolio\/[^/]+$/,           // single portfolio item
        /^\/workers\/[^/]+\/portfolio\/stats$/ // portfolio stats
      ];
      if (publicPatterns.some((re) => re.test(p))) {
        return next();
      }
    }
    return authenticate(req, res, next);
  },
  createDynamicProxy('user', {
    pathRewrite: { '^/api/profile': '/api/profile' }
  })
);

// Profile upload & presign routes (protected) → user-service
app.use('/api/profile/uploads',
  authenticate,
  createDynamicProxy('user', {
    pathRewrite: { '^/api/profile/uploads': '/api/profile/uploads' }
  })
);

// Settings routes (protected) → user-service
app.use('/api/settings',
  authenticate,
  createDynamicProxy('user', {
    pathRewrite: { '^/api/settings': '/api/settings' }
  })
);

// Worker routes (public read, protected write) with validation
app.use(
  '/api/workers',
  (req, res, next) => {
    console.log('🌐 API Gateway: Worker route hit -', req.method, req.originalUrl);
    if (req.method === 'GET') return next();
    return authenticate(req, res, next);
  },
  (req, res, next) => {
    if (req.method !== 'GET') return next();
    return celebrate({
      [Segments.QUERY]: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        location: Joi.string().max(255).optional(),
        skills: Joi.string().optional(),
        rating: Joi.number().min(0).max(5).optional(),
        availability: Joi.string().valid('available', 'busy', 'unavailable', 'vacation').optional(),
        maxRate: Joi.number().min(0).optional(),
        verified: Joi.string().valid('true', 'false').optional(),
        search: Joi.string().max(255).optional(),
      }).unknown(true),
    })(req, res, next);
  },
  // Validate worker availability updates at gateway level as well
  (req, res, next) => {
    if (!(req.method === 'PUT' && /\/workers\/[^/]+\/availability$/.test(req.path))) {
      return next();
    }
    return celebrate({
      [Segments.BODY]: Joi.object({
        availabilityStatus: Joi.string().valid('available', 'busy', 'unavailable', 'vacation').optional(),
        pausedUntil: Joi.string().isoDate().optional(),
        availableHours: Joi.object()
          .pattern(
            Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
            Joi.object({
              available: Joi.boolean().required(),
              start: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).when('available', { is: true, then: Joi.required() }),
              end: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).when('available', { is: true, then: Joi.required() }),
            }).unknown(false)
          )
          .optional(),
      }).unknown(false),
    })(req, res, next);
  },
  createDynamicProxy('user', {
    // ✅ FIXED: User service mounts workers under /api/users/workers
    // Gateway receives /api/workers -> forward as /api/users/workers
    pathRewrite: {
      '^/$': '/api/users/workers',           // /api/workers -> /api/users/workers
      '^/search': '/api/users/workers/search', // /api/workers/search -> /api/users/workers/search
      '^/(.+)': '/api/users/workers/$1'      // /api/workers/* -> /api/users/workers/*
    },
    onProxyReq: (proxyReq, req) => {
      console.log('🔄 [API Gateway] Proxying worker request:', {
        originalUrl: req.originalUrl,
        strippedPath: req.url,
        targetPath: proxyReq.path
      });
    },
    onError: (err, req, res) => {
      console.error('❌ [API Gateway] Worker proxy error:', err.message);
      res.status(500).json({ error: 'Worker service unavailable', details: err.message });
    }
  })
);

// Job routes - Use direct axios forwarding like auth service (bypasses proxy body issues)
const { getRateLimiter } = require('./middlewares/rate-limiter');
const jobRouter = require('./routes/job.routes');
app.use('/api/jobs', jobRouter);

// Milestones routes — proxy to job-service /api/jobs/milestones/*
// Frontend calls /api/milestones/* which gateway rewrites to job-service
app.use('/api/milestones', authenticate, createDynamicProxy('job', {
  pathRewrite: { '^/api/milestones': '/api/jobs/milestones' },
  onError: (err, req, res) => {
    console.error('[API Gateway] Milestone service error:', err.message);
    res.status(503).json({
      success: false,
      error: { message: 'Milestone service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' }
    });
  }
}));

// Search routes (public) with rate limiting
app.use('/api/search', getRateLimiter('search'));
app.use('/api/search', createDynamicProxy('job', {
  pathRewrite: { '^/api/search': '/api/search' },
  onError: (err, req, res) => {
    console.error('[API Gateway] Search service error:', err.message);
    res.status(503).json({
      error: 'Search service temporarily unavailable',
      message: 'Please try again later',
      timestamp: new Date().toISOString()
    });
  }
}));

// Compatibility alias: some clients still call /api/jobs/search/*
// Route them to the same search proxy to avoid 404s
app.use('/api/jobs/search', getRateLimiter('search'));
app.use('/api/jobs/search', createDynamicProxy('job', {
  pathRewrite: { '^/api/jobs/search': '/api/search' },
  onError: (err, req, res) => {
    console.error('[API Gateway] Search alias error:', err.message);
    res.status(503).json({
      error: 'Search service temporarily unavailable',
      message: 'Please try again later',
      timestamp: new Date().toISOString()
    });
  }
}));

// QuickJob routes - Protected Quick-Hire System
// All quick-job operations require authentication
app.use('/api/quick-jobs', authenticate, (req, res, next) => {
  // Forward user info to job service
  if (req.user) {
    req.headers['x-authenticated-user'] = JSON.stringify(req.user);
    req.headers['x-auth-source'] = 'api-gateway';
  }
  next();
}, createDynamicProxy('job', {
  pathRewrite: { '^/api/quick-jobs': '/api/quick-jobs' },
  onError: (err, req, res) => {
    console.error('[API Gateway] QuickJob service error:', err.message);
    res.status(503).json({
      error: 'QuickJob service temporarily unavailable',
      message: 'Please try again later',
      timestamp: new Date().toISOString()
    });
  }
}));

// Payment routes (protected with validation) — use dedicated router to expose granular endpoints and aliases
const paymentRouter = require('./routes/payment.routes');
app.use('/api/payments',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  authenticate,
  requestValidator.enforceTierLimits(),
  requestValidator.validatePayment,
  paymentRouter
);

// Messaging routes (protected) — mount dedicated router to support aliases and granular endpoints
const messagingRouter = require('./routes/messaging.routes');
app.use('/api/messages', authenticate, messagingRouter);

// Messaging health alias for diagnostics → proxies to messaging-service /api/health
// IMPORTANT: Must be mounted BEFORE the catch-all /api/messaging router to avoid shadowing
app.use('/api/messaging/health', (req, res, next) => {
  if (!services.messaging || typeof services.messaging !== 'string' || services.messaging.length === 0) {
    return res.status(503).json({ error: 'Messaging service unavailable' });
  }
  const proxy = createProxyMiddleware({
    target: services.messaging,
    changeOrigin: true,
    pathRewrite: { '^/api/messaging/health': '/api/health' }
  });
  return proxy(req, res, next);
});

// IMPORTANT: Also mount at /api/messaging to match frontend API calls
// Frontend uses /api/messaging/conversations, /api/messaging/messages, etc.
app.use('/api/messaging', authenticate, messagingRouter);

// Upload routes for messaging (protected) → messaging-service
app.use('/api/uploads',
  authenticate,
  (req, res, next) => {
    if (!services.messaging || typeof services.messaging !== 'string' || services.messaging.length === 0) {
      return res.status(503).json({ error: 'Messaging service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.messaging,
      changeOrigin: true,
      pathRewrite: { '^/api/uploads': '/api/uploads' }
    });
    return proxy(req, res, next);
  }
);

// (Messaging health route moved above /api/messaging mount to prevent shadowing)

// Socket.IO WebSocket proxy to messaging-service
// IMPORTANT: Always mount on '/socket.io' path to avoid intercepting unrelated routes
// Dynamic proxy creation with health checking and fallback
const getSocketIoProxy = () => {
  if (socketIoProxyInstance) {
    return socketIoProxyInstance;
  }

  const target = services.messaging;
  if (!target || typeof target !== 'string' || target.length === 0) {
    console.error('❌ Missing messaging service URL for Socket.IO proxy:', target);
    return null;
  }

  try {
    console.log(`🔌 Initializing Socket.IO proxy to: ${target}`);
    socketIoProxyInstance = createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      timeout: 30000,
      proxyTimeout: 30000,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('🚨 Socket.IO proxy error:', err.message);
        if (res && !res.headersSent) {
          res.status(503).json({
            error: 'WebSocket service temporarily unavailable',
            code: 'WEBSOCKET_PROXY_ERROR',
            retry: true
          });
        }
      },
      onProxyReqWs: (proxyReq, req, socket) => {
        console.log('🔄 WebSocket proxying to messaging service:', req.url);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('📡 Socket.IO HTTP request:', req.method, req.url);
      }
    });
    return socketIoProxyInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO proxy:', error.message);
    socketIoProxyInstance = null;
    return null;
  }
};

// Create dynamic Socket.IO proxy handler
const socketIoProxyHandler = (req, res, next) => {
  const proxy = getSocketIoProxy();
  if (proxy) {
    // Express strips the mount path (/socket.io) from req.url when using app.use('/socket.io', ...)
    // Socket.IO on the messaging service expects the full /socket.io prefix, so restore it before proxying
    if (typeof req.originalUrl === 'string' && req.originalUrl.startsWith('/socket.io')) {
      req.url = req.originalUrl;
    }
    return proxy(req, res, next);
  } else {
    console.warn('⚠️ Socket.IO proxy unavailable, messaging service not ready');
    return res.status(503).json({
      error: 'WebSocket service unavailable',
      code: 'MESSAGING_SERVICE_DOWN',
      message: 'The messaging service is not available. Please try again later.',
      retry: true
    });
  }
};

// Mount the dynamic Socket.IO proxy
app.use('/socket.io', socketIoProxyHandler);

// Socket metrics passthrough (admin validated upstream)
app.use('/api/socket/metrics',
  authenticate,
  authorizeRoles('admin'),
  (req, res, next) => {
    if (!services.messaging || typeof services.messaging !== 'string' || services.messaging.length === 0) {
      return res.status(503).json({ error: 'Messaging service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.messaging,
      changeOrigin: true,
      pathRewrite: { '^/api/socket/metrics': '/api/socket/metrics' }
    });
    return proxy(req, res, next);
  }
);

// Notification routes (protected) → messaging-service (hosts notifications API)  
// NOTE: Using manual axios proxy instead of http-proxy-middleware
// because http-proxy-middleware was not reliably forwarding custom headers
app.use('/api/notifications', authenticate, async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No user information available'
      });
    }

    const messagingUrl = services.messaging || 'http://localhost:5005';
    const targetUrl = `${messagingUrl}/api/notifications${req.url}`;

    console.log('[NOTIFICATIONS MANUAL PROXY] Request:', {
      method: req.method,
      url: req.url,
      targetUrl,
      hasUser: !!req.user,
      userId: req.user.id
    });

    // Make request to messaging service with proper headers
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        'x-authenticated-user': JSON.stringify(req.user),
        'x-auth-source': 'api-gateway',
        'content-type': req.headers['content-type'] || 'application/json'
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && { data: req.body })
    };

    console.log('[NOTIFICATIONS MANUAL PROXY] Sending headers:', {
      'x-authenticated-user': !!axiosConfig.headers['x-authenticated-user'],
      'x-auth-source': axiosConfig.headers['x-auth-source'],
      userJsonLength: axiosConfig.headers['x-authenticated-user'].length
    });

    const response = await axios(axiosConfig);

    console.log('[NOTIFICATIONS MANUAL PROXY] Response:', {
      status: response.status,
      hasData: !!response.data
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[NOTIFICATIONS MANUAL PROXY] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      error: 'Proxy error',
      message: 'Failed to forward request to messaging service'
    });
  }
});

// Conversations routes (protected) → messaging-service
app.use('/api/conversations',
  authenticate,
  (req, res, next) => {
    if (!services.messaging || typeof services.messaging !== 'string' || services.messaging.length === 0) {
      return res.status(503).json({ error: 'Messaging service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.messaging,
      changeOrigin: true,
      pathRewrite: { '^/api/conversations': '/api/conversations' },
      onProxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
          proxyReq.setHeader('x-auth-source', 'api-gateway');
        }
      }
    });
    return proxy(req, res, next);
  }
);

// Admin review moderation (admin only) → route to review-service
app.use('/api/admin/reviews',
  authenticate,
  authorizeRoles('admin'),
  (req, res, next) => {
    if (!services.review || typeof services.review !== 'string' || services.review.length === 0) {
      return res.status(503).json({ error: 'Review service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.review,
      changeOrigin: true,
      pathRewrite: { '^/api/admin/reviews': '/api/admin/reviews' }
    });
    return proxy(req, res, next);
  }
);

// Review routes (mixed protection)
app.use('/api/reviews',
  (req, res, next) => {
    const isEligibilityRoute =
      req.method === 'GET' &&
      /^\/worker\/[^/]+\/eligibility$/.test(req.path);

    // Public routes: GET review collections (worker/user/job)
    if (
      req.method === 'GET' &&
      !isEligibilityRoute &&
      (
        req.path.includes('/worker/') ||
        req.path.includes('/user/') ||
        req.path.includes('/job/')
      )
    ) {
      return next();
    }
    // Protected routes: submit/respond/helpful/report/eligibility/analytics/moderation
    return authenticate(req, res, next);
  },
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }), // Review-specific rate limiting
  (req, res, next) => {
    if (!services.review || typeof services.review !== 'string' || services.review.length === 0) {
      return res.status(503).json({ error: 'Review service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.review,
      changeOrigin: true,
      pathRewrite: { '^/api/reviews': '/api/reviews' },
      onProxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
          proxyReq.setHeader('x-auth-source', 'api-gateway');
        }
      },
      onError: (err, req, res) => {
        logger.error('Review service error:', err);
        res.status(503).json({ error: 'Review service unavailable' });
      }
    });
    return proxy(req, res, next);
  }
);

// Rating routes (public)
app.use('/api/ratings',
  (req, res, next) => {
    if (!services.review || typeof services.review !== 'string' || services.review.length === 0) {
      return res.status(503).json({ error: 'Rating service unavailable' });
    }

    const proxy = createProxyMiddleware({
      target: services.review,
      changeOrigin: true,
      pathRewrite: (path, innerReq) => {
        const suffix = path.startsWith('/') ? path : `/${path}`;
        const base = innerReq.baseUrl || '/api/ratings';
        if (suffix.startsWith('/api/ratings')) {
          return suffix;
        }
        // Ensure downstream sees the full /api/ratings prefix even though Express stripped it
        return `${base}${suffix}`.replace(/\/\/{2,}/g, '/');
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
      },
      onError: (err, req, res) => {
        logger.error('Rating service error:', err);
        res.status(503).json({ error: 'Rating service unavailable' });
      }
    });

    return proxy(req, res, next);
  }
);

// Admin routes (admin only)
app.use('/api/admin',
  authenticate,
  authorizeRoles('admin'),
  (req, res, next) => {
    if (!services.user || typeof services.user !== 'string' || services.user.length === 0) {
      return res.status(503).json({ error: 'User service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.user,
      changeOrigin: true,
      pathRewrite: { '^/api/admin': '/api/admin' }
    });
    return proxy(req, res, next);
  }
);

// Webhook routes
app.use('/api/webhooks',
  requestValidator.validateWebhook,
  (req, res, next) => {
    if (!services.payment || typeof services.payment !== 'string' || services.payment.length === 0) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.payment,
      changeOrigin: true,
      pathRewrite: { '^/api/webhooks': '/api/webhooks' }
    });
    return proxy(req, res, next);
  }
);

// API documentation endpoints
app.get('/api/docs', (req, res) => {
  const path = require('path');
  const fs = require('fs');

  try {
    const openApiPath = path.join(__dirname, '../../kelmah-api-openapi.yaml');
    if (fs.existsSync(openApiPath)) {
      res.setHeader('Content-Type', 'application/yaml');
      res.sendFile(openApiPath);
    } else {
      // Fallback to JSON response if YAML file not found
      res.json({
        name: 'Kelmah API Gateway',
        description: 'Centralized API Gateway for Kelmah Platform - Enterprise Freelance Marketplace',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        openapi: '3.0.3',
        servers: [
          { url: 'https://shaggy-snake-43.loca.lt/api', description: 'LocalTunnel Development Server' },
          { url: 'http://localhost:5000/api', description: 'Local Development Server' }
        ],
        endpoints: {
          auth: '/api/auth/* - User authentication & registration',
          users: '/api/users/* - User profile management',
          jobs: '/api/jobs/* - Job posting, applications & management',
          messages: '/api/messages/* - Real-time messaging & conversations',
          payments: '/api/payments/* - Payment processing & escrow',
          reviews: '/api/reviews/* - Review & rating system'
        },
        documentation: 'See /api/docs.html for interactive API documentation',
        health: '/health - System health check',
        contact: 'Kelmah Development Team'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Documentation not available', details: error.message });
  }
});

// Interactive API documentation
app.get('/api/docs.html', (req, res) => {
  const path = require('path');
  const fs = require('fs');

  try {
    const htmlPath = path.join(__dirname, '../../api-docs.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).json({ error: 'Interactive documentation not available' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Documentation not available', details: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: '/api/docs'
  });
});

// Celebrate validation errors then general error handler
app.use(celebrateErrors());
app.use(errorHandler(logger));

// Start server with service discovery
const startServer = async () => {
  try {
    // Initialize service discovery first
    await initializeServices();
    keepAliveManager.start();

    // Job router already mounted above - no proxy middleware needed

    const server = app.listen(PORT, () => {
      const environment = detectEnvironment();
      logger.info(`🚀 Kelmah API Gateway running on port ${PORT} (${environment} mode)`);
      logger.info(`📋 Health: http://localhost:${PORT}/health`);
      logger.info(`📚 Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🔍 Service URLs:`, getServiceUrlsForApp(services));
    });

    // Enable WebSocket upgrade handling for Socket.IO proxy (dynamic)
    server.on('upgrade', (req, socket, head) => {
      try {
        const url = req?.url || '';
        if (url.startsWith('/socket.io')) {
          console.log('🔄 WebSocket upgrade request:', url);
          const proxy = getSocketIoProxy();
          if (proxy && typeof proxy.upgrade === 'function') {
            return proxy.upgrade(req, socket, head);
          } else {
            console.warn('⚠️ Socket.IO proxy not available for upgrade');
            socket.write('HTTP/1.1 503 Service Unavailable\r\n' +
              'Content-Type: text/plain\r\n' +
              'Connection: close\r\n\r\n' +
              'WebSocket service unavailable');
            socket.destroy();
          }
        }
        // For non-socket.io upgrades, do nothing (let other handlers manage or close)
      } catch (e) {
        console.error('🚨 Socket.IO upgrade handling error:', e?.message || e);
        try {
          socket.write('HTTP/1.1 500 Internal Server Error\r\n' +
            'Connection: close\r\n\r\n');
          socket.destroy();
        } catch (_) { }
      }
    });

    return server;
  } catch (error) {
    logger.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
};

// Connect to MongoDB, then start server
connectDB()
  .then(() => {
    logger.info('✅ API Gateway connected to MongoDB');
    startServer();
  })
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', err);
    if (process.env.ALLOW_START_WITHOUT_DB === 'true') {
      logger.warn('⚠️ Starting API Gateway without database (authentication will fail)');
      startServer();
    } else {
      logger.error('🚨 Cannot start API Gateway without database connection');
      process.exit(1);
    }
  });

module.exports = app;