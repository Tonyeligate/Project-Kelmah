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
const winston = require('winston');

// Import middleware
const { authenticate, authorizeRoles, optionalAuth } = require('./middlewares/auth');
const loggingMiddleware = require('./middlewares/logging');
const errorHandler = require('./middlewares/error-handler');
const requestValidator = require('./middlewares/request-validator');

// Import intelligent service discovery
const {
  initializeServiceRegistry,
  getServiceUrlsForApp,
  detectEnvironment
} = require('./utils/serviceDiscovery');

/**
 * Dynamic Proxy Middleware Creator
 * Creates proxy middleware that resolves service URLs at runtime
 */
const createDynamicProxy = (serviceName, options = {}) => {
  return (req, res, next) => {
    try {
      const targetUrl = services[serviceName] || getServiceUrl(serviceName);

      if (!targetUrl) {
        console.warn(`⚠️ Service ${serviceName} is not available`);
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          service: serviceName,
          message: 'This service is not currently deployed or accessible'
        });
      }

      const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        ...options
      });

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

// Initialize services on startup
const initializeServices = async () => {
  try {
    console.log('🔧 API Gateway starting service discovery...');
    services = await initializeServiceRegistry();

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

  logger.warn(`🚨 API Gateway CORS blocked origin: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'x-requested-with'],
  exposedHeaders: ['ngrok-skip-browser-warning']
}));

// Add ngrok-skip-browser-warning header to all responses
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

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
    services: {
      total: Object.keys(services).length,
      available: Object.keys(services)
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
    serviceUrls: services,
    version: '2.0.0',
    uptime: process.uptime()
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Aggregated health (services + providers) - Both /health/aggregate and /api/health/aggregate
const aggregatedHealthHandler = async (req, res) => {
  try {
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
    res.json({ success: true, services: servicesObj, providers });
  } catch (e) {
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
  // Allow-list public GET access for worker listings & details
  (req, res, next) => {
    if (req.method === 'GET') {
      const p = req.path || '';
      if (p === '/workers' || /^\/workers\//.test(p)) {
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
    pathRewrite: { '^/api/users': '/api/users' },
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
    // Rewrite paths: / -> /workers, /search -> /workers/search, etc.
    pathRewrite: {
      '^/$': '/workers',  // Root path to /workers
      '^/(.*)': '/workers/$1'  // Sub-paths like /search to /workers/search
    },
    onProxyReq: (proxyReq, req) => {
      console.log('🔄 API Gateway: Proxying worker request to user service -', req.originalUrl, '→', proxyReq.path);
    },
    onError: (err, req, res) => {
      console.error('❌ API Gateway: Worker proxy error -', err.message);
      res.status(500).json({ error: 'Worker service unavailable', details: err.message });
    }
  })
);

// Import job proxy and rate limiter
const { createEnhancedJobProxy } = require('./proxy/job.proxy');
const { getRateLimiter } = require('./middlewares/rate-limiter');

// Job routes (public listings, protected management)
// Apply rate limiting based on endpoint type
app.use('/api/jobs', (req, res, next) => {
  // Apply different rate limits based on the operation
  // Bypass limiter for my-jobs dashboard endpoint
  if (req.method === 'GET' && (req.path.startsWith('/my-jobs') || (req.originalUrl || '').startsWith('/api/jobs/my-jobs'))) {
    return next();
  }
  if (req.method === 'POST') {
    // Job creation - stricter rate limit
    return getRateLimiter('jobCreation')(req, res, next);
  } else if (req.url.includes('/apply') && req.method === 'POST') {
    // Job application - moderate rate limit
    return getRateLimiter('jobApplication')(req, res, next);
  } else {
    // General job operations - standard rate limit
    return getRateLimiter('general')(req, res, next);
  }
});

// Apply enhanced job proxy with health checking
// Note: Do NOT pass pathRewrite here; the proxy already ensures '/api/jobs' prefix is preserved
app.use('/api/jobs', createEnhancedJobProxy(services.job, {
  onError: (err, req, res) => {
    console.error('[API Gateway] Job service error:', err.message);
    res.status(503).json({
      error: 'Job service temporarily unavailable',
      message: 'Please try again later',
      timestamp: new Date().toISOString()
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

// Messaging health alias for diagnostics → proxies to messaging-service /api/health
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

// Socket.IO WebSocket proxy to messaging-service
// IMPORTANT: Always mount on '/socket.io' path to avoid intercepting unrelated routes
// Dynamic proxy creation with health checking and fallback
const createSocketIoProxy = () => {
  if (services.messaging && typeof services.messaging === 'string' && services.messaging.length > 0) {
    try {
      console.log(`🔌 Creating Socket.IO proxy to: ${services.messaging}`);
      return createProxyMiddleware({
        target: services.messaging,  // This should be http://localhost:5005
        changeOrigin: true,
        ws: true,
        timeout: 30000,
        proxyTimeout: 30000,
        logLevel: 'debug',
        // Enhanced error handling
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
    } catch (error) {
      console.error('❌ Failed to create Socket.IO proxy:', error.message);
      return null;
    }
  } else {
    console.error('❌ Missing messaging service URL for Socket.IO proxy:', services.messaging);
    return null;
  }
};

// Create dynamic Socket.IO proxy handler
const socketIoProxyHandler = (req, res, next) => {
  const proxy = createSocketIoProxy();
  if (proxy) {
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
app.use('/api/notifications',
  authenticate,
  (req, res, next) => {
    if (!services.messaging || typeof services.messaging !== 'string' || services.messaging.length === 0) {
      return res.status(503).json({ error: 'Messaging service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.messaging,
      changeOrigin: true,
      pathRewrite: { '^/api/notifications': '/api/notifications' }
    });
    return proxy(req, res, next);
  }
);

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
      pathRewrite: { '^/api/conversations': '/api/conversations' }
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
    // Public routes: GET reviews for workers and public analytics/user profiles
    if (
      req.method === 'GET' && (
        req.path.includes('/worker/') ||
        req.path.includes('/analytics') ||
        req.path.includes('/user/')
      )
    ) {
      return next();
    }
    // Protected routes: Submit, respond, helpful/report, can-review (requires identity)
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
      pathRewrite: { '^/api/ratings': '/api/ratings' },
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
          const proxy = createSocketIoProxy();
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

// Start the server
startServer();

module.exports = app;