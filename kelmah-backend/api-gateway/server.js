/**
 * Kelmah API Gateway Server
 * Centralized routing and authentication for all microservices
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const winston = require('winston');

// Import middleware
const authMiddleware = require('./middleware/auth');
const loggingMiddleware = require('./middleware/logging');
const errorHandler = require('./middleware/error-handler');
const requestValidator = require('./middleware/request-validator');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

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

// Service registry - Production URLs from Render deployment
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'https://kelmah-auth-service.onrender.com',
  user: process.env.USER_SERVICE_URL || 'https://kelmah-user-service.onrender.com',
  job: process.env.JOB_SERVICE_URL || 'https://kelmah-job-service.onrender.com',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://kelmah-payment-service.onrender.com',
  messaging: process.env.MESSAGING_SERVICE_URL || 'https://kelmah-messaging-service.onrender.com',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'https://kelmah-notification-service.onrender.com'
};

// Global middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://project-kelmah.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggingMiddleware(logger));

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Authentication routes (public)
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' },
  onError: (err, req, res) => {
    logger.error('Auth service error:', err);
    res.status(503).json({ error: 'Authentication service unavailable' });
  }
}));

// User routes (protected)
app.use('/api/users', 
  authMiddleware.authenticate,
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/api/users' },
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    }
  })
);

// Worker routes (public read, protected write)
app.use('/api/workers',
  (req, res, next) => {
    if (req.method === 'GET') return next();
    return authMiddleware.authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/workers': '/api/workers' }
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

// Payment routes (protected with validation)
app.use('/api/payments',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }),
  authMiddleware.authenticate,
  requestValidator.validatePayment,
  createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '/api/payments' },
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-Payment-Source', 'api-gateway');
      }
    }
  })
);

// Messaging routes (protected)
app.use('/api/messages',
  authMiddleware.authenticate,
  createProxyMiddleware({
    target: services.messaging,
    changeOrigin: true,
    pathRewrite: { '^/api/messages': '/api/messages' }
  })
);

// Notification routes (protected)
app.use('/api/notifications',
  authMiddleware.authenticate,
  createProxyMiddleware({
    target: services.notification,
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/api/notifications' }
  })
);

// Admin routes (admin only)
app.use('/api/admin',
  authMiddleware.authenticate,
  authMiddleware.authorize('admin'),
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: { '^/api/admin': '/api/admin' }
  })
);

// Webhook routes
app.use('/api/webhooks',
  requestValidator.validateWebhook,
  createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: { '^/api/webhooks': '/api/webhooks' }
  })
);

// API docs
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Kelmah API Gateway',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      workers: '/api/workers/*',
      jobs: '/api/jobs/*',
      search: '/api/search/*',
      payments: '/api/payments/*',
      messages: '/api/messages/*',
      notifications: '/api/notifications/*',
      admin: '/api/admin/*',
      webhooks: '/api/webhooks/*'
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

// Error handler
app.use(errorHandler(logger));

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Kelmah API Gateway running on port ${PORT}`);
  logger.info(`📋 Health: http://localhost:${PORT}/health`);
  logger.info(`📚 Docs: http://localhost:${PORT}/api/docs`);
});

module.exports = app;