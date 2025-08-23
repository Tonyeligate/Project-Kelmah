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
const authMiddleware = require('./middleware/auth');
const loggingMiddleware = require('./middleware/logging');
const errorHandler = require('./middleware/error-handler');
const requestValidator = require('./middleware/request-validator');

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

// Service registry
// Prefer AWS internal NLB endpoints when env points to Render
const INTERNAL_NLB = process.env.INTERNAL_NLB_DNS || 'http://localhost';
const preferAws = (envUrl, fallbackAwsUrl) => {
  if (typeof envUrl === 'string' && envUrl.length > 0 && !/onrender\.com/.test(envUrl)) {
    return envUrl;
  }
  return fallbackAwsUrl;
};

const services = {
  auth: preferAws(process.env.AUTH_SERVICE_URL, `${INTERNAL_NLB}:5001`),
  user: preferAws(process.env.USER_SERVICE_URL, `${INTERNAL_NLB}:5002`),
  job: preferAws(process.env.JOB_SERVICE_URL, `${INTERNAL_NLB}:5003`),
  payment: preferAws(process.env.PAYMENT_SERVICE_URL, `${INTERNAL_NLB}:5004`),
  messaging: preferAws(process.env.MESSAGING_SERVICE_URL, `${INTERNAL_NLB}:5005`),
  notification: preferAws(process.env.NOTIFICATION_SERVICE_URL, `${INTERNAL_NLB}:5006`),
  review: preferAws(process.env.REVIEW_SERVICE_URL, `${INTERNAL_NLB}:5007`)
};

// Expose service URLs to route modules
app.set('serviceUrls', {
  AUTH_SERVICE: services.auth,
  USER_SERVICE: services.user,
  JOB_SERVICE: services.job,
  PAYMENT_SERVICE: services.payment,
  MESSAGING_SERVICE: services.messaging,
  NOTIFICATION_SERVICE: services.notification,
  REVIEW_SERVICE: services.review,
});

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

  if (!origin) return callback(null, true); // Allow no origin (mobile apps, etc.)
  
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  const isVercelPreview = vercelPatterns.some(pattern => pattern.test(origin));
  if (isVercelPreview) {
    logger.info(`✅ API Gateway CORS allowed Vercel preview: ${origin}`);
    return callback(null, true);
  }
  
  logger.warn(`🚨 API Gateway CORS blocked origin: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

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
  message: { error: 'Too many requests' }
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
    version: '2.0.0',
    uptime: process.uptime()
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Aggregated health (services + providers)
app.get('/api/health/aggregate', async (req, res) => {
  try {
    const axios = require('axios');
    const token = req.headers.authorization;
    const headers = token ? { Authorization: token } : undefined;
    const baseTargets = [
      { name: 'auth', url: `${services.auth}/health` },
      { name: 'user', url: `${services.user}/health` },
      { name: 'job', url: `${services.job}/health` },
      { name: 'payment', url: `${services.payment}/health` },
      { name: 'messaging', url: `${services.messaging}/health` },
      { name: 'review', url: `${services.review}/health` },
    ];
    const results = await Promise.all(baseTargets.map(async (t) => {
      try {
        const r = await axios.get(t.url, { timeout: 5000, headers });
        return { service: t.name, ok: true, data: r.data };
      } catch (e) {
        return { service: t.name, ok: false, error: e?.message };
      }
    }));
    // Provider health from payment service
    let providers;
    try {
      const r = await axios.get(`${services.payment}/health/providers`, { timeout: 4000, headers });
      providers = r.data;
    } catch (e) {
      providers = { success: false, error: e?.message };
    }
    res.json({ success: true, services: results, providers });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message });
  }
});

// Authentication routes (public) — use dedicated router to support aliases like /refresh-token
const authRouter = require('./routes/auth.routes');
app.use('/api/auth', authRouter);

// User routes (protected) with validation
app.use(
  '/api/users',
  authMiddleware.authenticate,
  celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }).unknown(true),
  }),
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/api/users' },
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
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
    return authMiddleware.authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/profile': '/api/profile' }
  })
);

// Profile upload & presign routes (protected) → user-service
app.use('/api/profile/uploads',
  authMiddleware.authenticate,
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/profile/uploads': '/api/profile/uploads' }
  })
);

// Settings routes (protected) → user-service
app.use('/api/settings',
  authMiddleware.authenticate,
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/settings': '/api/settings' }
  })
);

// Worker routes (public read, protected write) with validation
app.use(
  '/api/workers',
  (req, res, next) => {
    if (req.method === 'GET') return next();
    return authMiddleware.authenticate(req, res, next);
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
        availabilityStatus: Joi.string().valid('available','busy','unavailable','vacation').optional(),
        pausedUntil: Joi.string().isoDate().optional(),
        availableHours: Joi.object()
          .pattern(
            Joi.string().valid('monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
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
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/workers': '/api/workers' },
  })
);

// Job routes (public listings, protected management)
app.use('/api/jobs',
  (req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('/applications')) {
      return next();
    }
    return authMiddleware.authenticate(req, res, next);
  },
  (req, res, next) => {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    if (!Number.isNaN(page) && page < 1) req.query.page = 1;
    if (!Number.isNaN(limit)) req.query.limit = Math.min(Math.max(limit, 1), 100);
    next();
  },
  createProxyMiddleware({
    target: services.job,
    changeOrigin: true,
    pathRewrite: { '^/api/jobs': '/api/jobs' }
  })
);

// Search routes (public)
app.use('/api/search', createProxyMiddleware({
  target: services.job,
  changeOrigin: true,
  pathRewrite: { '^/api/search': '/api/search' }
}));

// Payment routes (protected with validation) — use dedicated router to expose granular endpoints and aliases
const paymentRouter = require('./routes/payment.routes');
app.use('/api/payments',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  authMiddleware.authenticate,
  requestValidator.enforceTierLimits(),
  requestValidator.validatePayment,
  paymentRouter
);

// Messaging routes (protected) — mount dedicated router to support aliases and granular endpoints
const messagingRouter = require('./routes/messaging.routes');
app.use('/api', authMiddleware.authenticate, messagingRouter);

// Upload routes for messaging (protected) → messaging-service
app.use('/api/uploads',
  authMiddleware.authenticate,
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

// Socket.IO WebSocket proxy to messaging-service
let socketIoProxy;
try {
  if (services.messaging && typeof services.messaging === 'string' && services.messaging.length > 0) {
    socketIoProxy = createProxyMiddleware('/socket.io', {
      target: services.messaging,
      changeOrigin: true,
      ws: true
    });
  } else {
    console.warn('Messaging service URL not configured, WebSocket proxy disabled');
    socketIoProxy = (req, res, next) => {
      res.status(503).json({ error: 'WebSocket service unavailable' });
    };
    socketIoProxy.upgrade = () => {}; // No-op upgrade handler
  }
} catch (error) {
  console.error('Failed to create Socket.IO proxy:', error.message);
  socketIoProxy = (req, res, next) => {
    res.status(503).json({ error: 'WebSocket service configuration error' });
  };
  socketIoProxy.upgrade = () => {}; // No-op upgrade handler
}
app.use(socketIoProxy);

// Socket metrics passthrough (admin validated upstream)
app.use('/api/socket/metrics',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin'),
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
  authMiddleware.authenticate,
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

// Admin review moderation (admin only) → route to review-service
app.use('/api/admin/reviews',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin'),
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
    return authMiddleware.authenticate(req, res, next);
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
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
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
  authMiddleware.authenticate,
  authMiddleware.authorize('admin'),
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

// API documentation endpoint  
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Kelmah API Gateway',
    description: 'Centralized API Gateway for Kelmah Platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    
    // Essential endpoints
    system: {
      health: {
        endpoints: ['/health', '/api/health'],
        description: 'System health check',
        method: 'GET',
        authentication: 'None'
      },
      docs: {
        endpoint: '/api/docs',
        description: 'API documentation',
        method: 'GET',
        authentication: 'None'
      }
    },
    
    // Main API endpoints
    endpoints: {
      auth: {
        path: '/api/auth/*',
        description: 'User authentication & registration',
        methods: ['POST', 'GET'],
        authentication: 'None (for login/register)',
        examples: ['/api/auth/login', '/api/auth/register', '/api/auth/verify']
      },
      users: {
        path: '/api/users/*', 
        description: 'User management',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authentication: 'Required',
        examples: ['/api/users/profile', '/api/users/settings']
      },
      workers: {
        path: '/api/workers/*',
        description: 'Worker profiles & skills',
        methods: ['GET', 'POST', 'PUT'],
        authentication: 'GET: None, POST/PUT: Required',
        examples: ['/api/workers', '/api/workers/{id}']
      },
      jobs: {
        path: '/api/jobs/*',
        description: 'Job postings & applications',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authentication: 'GET: None, Others: Required', 
        examples: ['/api/jobs', '/api/jobs/{id}/apply']
      },
      search: {
        path: '/api/search/*',
        description: 'Search jobs & workers',
        methods: ['GET'],
        authentication: 'None',
        examples: ['/api/search/jobs?q=developer', '/api/search/workers?skills=js']
      },
      payments: {
        path: '/api/payments/*',
        description: 'Payment processing & escrow',
        methods: ['GET', 'POST'],
        authentication: 'Required',
        examples: ['/api/payments/create', '/api/payments/history']
      },
      messages: {
        path: '/api/messages/*',
        description: 'Real-time messaging',
        methods: ['GET', 'POST', 'DELETE'],
        authentication: 'Required',
        features: ['WebSocket Support', 'File Sharing']
      },
      reviews: {
        path: '/api/reviews/*',
        description: 'Review & rating system',
        methods: ['GET', 'POST', 'PUT'],
        authentication: 'GET: None, POST/PUT: Required',
        examples: ['/api/reviews/worker/{id}', '/api/reviews/submit']
      }
    },

    // Microservices status
    services: {
      total: Object.keys(services).length,
      configured: Object.keys(services),
      urls: services
    },
    
    // Platform features
    features: [
      'Microservices Architecture',
      'Authentication & Authorization',
      'User & Worker Management', 
      'Job Posting & Applications',
      'Payment Processing & Escrow',
      'Real-time Messaging & WebSocket',
      'Push Notifications',
      'Review & Rating System',
      'Advanced Search & Filtering',
      'Admin Dashboard & Moderation',
      'CORS & Security Headers',
      'Rate Limiting & DDoS Protection',
      'Request/Response Logging',
      'Error Handling & Monitoring'
    ],
    
    // Usage information
    usage: {
      cors: 'Configured for Vercel deployments and localhost',
      rateLimit: '1000 requests per 15 minutes (global)',
      headers: {
        'X-Request-ID': 'Unique request identifier', 
        'X-User-ID': 'User ID (for authenticated requests)',
        'X-User-Role': 'User role (for authorized requests)'
      }
    },
    
    contact: {
      platform: 'Kelmah - Professional Services Marketplace',
      support: 'For API support, contact the development team'
    }
  });
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

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Kelmah API Gateway running on port ${PORT}`);
  logger.info(`📋 Health: http://localhost:${PORT}/health`);
  logger.info(`📚 Docs: http://localhost:${PORT}/api/docs`);
});

// Enable WebSocket upgrade handling for Socket.IO proxy
if (socketIoProxy && typeof socketIoProxy.upgrade === 'function') {
  server.on('upgrade', socketIoProxy.upgrade);
} else {
  console.warn('Socket.IO proxy upgrade handler not available');
}

module.exports = app;