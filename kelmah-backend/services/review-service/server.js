/**
 * Review Service Server
 * Clean MVC-structured server for the Kelmah review system
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { verifyGatewayRequest } = require('../../shared/middlewares/serviceTrust');

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Import controllers
const reviewController = require('./controllers/review.controller');
const ratingController = require('./controllers/rating.controller');
const analyticsController = require('./controllers/analytics.controller');

// Load environment variables
dotenv.config();

// Create service logger
const logger = createLogger('review-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('review-service starting...', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

const app = express();
const PORT = process.env.PORT || process.env.REVIEW_SERVICE_PORT || 5006;

// Initialize keep-alive to prevent Render spin-down
let keepAliveManager;
try {
  const { initKeepAlive } = require('../../shared/utils/keepAlive');
  keepAliveManager = initKeepAlive('review-service', { logger });
  logger.info('✅ Keep-alive manager initialized for review-service');
} catch (error) {
  logger.warn('⚠️ Keep-alive manager not available:', error.message);
}

// Optional tracing and error monitoring
try { const monitoring = require('../../shared/utils/monitoring'); monitoring.initErrorMonitoring('review-service'); monitoring.initTracing('review-service'); } catch { }

// Env validation (fail-fast in production)
try {
  const { requireEnv } = require('../../shared/utils/envValidator');
  if (process.env.NODE_ENV === 'production') {
    requireEnv(['JWT_SECRET', 'MONGODB_URI'], 'review-service');
  }
} catch { }

// Fail-fast for required secrets in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    logger.error('review-service missing JWT_SECRET in production');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    logger.error('review-service missing MONGODB_URI in production');
    process.exit(1);
  }
}

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, check against allowed origins
    // Include all production frontend URLs and local development
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://kelmah.com',
      'https://www.kelmah.com',
      'https://kelmah-frontend-cyan.vercel.app',
      'https://kelmah-frontend.vercel.app'
    ];
    const envOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
    const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

    if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }

    logger.info(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
};
app.use(cors(corsOptions));

// Add HTTP request logging
app.use(createHttpLogger(logger));

// Rate limiting (basic fallback - shared rate limiter has issues)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection with retry/backoff
async function connectDbWithRetry() {
  if (!process.env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set; review-service will run without DB');
    return;
  }
  const baseDelayMs = 5000;
  let attempt = 0;
  for (; ;) {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
      if (!mongoUri) {
        throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
      }

      console.log('🔗 Review Service connecting to MongoDB...');
      console.log('🔗 Connection string preview:', mongoUri.substring(0, 50) + '...');

      await mongoose.connect(mongoUri, {
        bufferCommands: true, // Enable buffering for connection establishment
        bufferTimeoutMS: 30000, // Increase timeout to 30 seconds
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority',
        family: 4, // Use IPv4, skip trying IPv6
        dbName: 'kelmah_platform' // Ensure using correct database
      });

      logger.info('✅ Review Service connected to MongoDB', {
        host: mongoose.connection.host,
        database: mongoose.connection.name
      });
      break;
    } catch (error) {
      attempt += 1;
      const delay = Math.min(baseDelayMs * attempt, 30000);

      console.error('='.repeat(80));
      console.error(`🚨 REVIEW SERVICE - MONGODB CONNECTION ATTEMPT ${attempt} FAILED`);
      console.error('='.repeat(80));
      console.error(`📛 Error Message: ${error.message}`);
      console.error(`📛 Error Name: ${error.name}`);
      console.error(`📛 Will retry in ${delay}ms...`);
      console.error('='.repeat(80));

      logger.warn(`MongoDB connection attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Initialize database connection
connectDbWithRetry();

const buildHealthStatus = () => {
  const mongoState = mongoose.connection.readyState;
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const healthy = mongoState === 1;

  return {
    status: healthy ? 'healthy' : 'degraded',
    service: 'review-service',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    database: {
      state: mongoStates[mongoState] || 'unknown',
      connected: healthy,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    uptime: process.uptime(),
  };
};

const healthHandler = (req, res) => {
  const payload = buildHealthStatus();
  const statusCode = payload.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(payload);
};

// ==================== ROUTES ====================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'review-service',
    message: 'Comprehensive Review & Rating Service',
    version: '2.0.0',
    endpoints: {
      'POST /api/reviews': 'Submit a review',
      'GET /api/reviews/worker/:id': 'Get worker reviews',
      'GET /api/reviews/:id': 'Get specific review',
      'PUT /api/reviews/:id/response': 'Add worker response',
      'GET /api/ratings/worker/:id': 'Get worker rating summary',
      'GET /api/reviews/analytics': 'Get review analytics'
    }
  });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Health readiness and liveness endpoints (required by docs)
app.get('/health/ready', (req, res) => {
  const mongoState = require('mongoose').connection.readyState;
  if (mongoState === 1) {
    res.json({ status: 'ready', database: 'connected' });
  } else {
    res.status(503).json({ status: 'not-ready', database: 'disconnected' });
  }
});
app.get('/api/health/ready', (req, res) => {
  const mongoState = require('mongoose').connection.readyState;
  if (mongoState === 1) {
    res.json({ status: 'ready', database: 'connected' });
  } else {
    res.status(503).json({ status: 'not-ready', database: 'disconnected' });
  }
});
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/api/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

// Keep-alive endpoints
if (keepAliveManager) {
  app.get('/health/keepalive', (req, res) => {
    res.json({ success: true, data: keepAliveManager.getStatus() });
  });

  app.post('/health/keepalive/trigger', async (req, res) => {
    try {
      const results = await keepAliveManager.triggerPing();
      res.json({ success: true, message: 'Keep-alive triggered', data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Review routes
// ⚠️ ROUTE ORDER: Specific paths before parameterized
const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin access required', code: 'FORBIDDEN' }
    });
  }
  return next();
};

app.post('/api/reviews', verifyGatewayRequest, reviewController.submitReview);
app.get('/api/reviews/worker/:workerId/eligibility', verifyGatewayRequest, reviewController.checkEligibility);
app.get('/api/reviews/worker/:workerId', reviewController.getWorkerReviews);
app.get('/api/reviews/job/:jobId', reviewController.getJobReviews);
app.get('/api/reviews/user/:userId', reviewController.getUserReviews);
app.get('/api/reviews/analytics', verifyGatewayRequest, requireAdmin, analyticsController.getReviewAnalytics);
app.get('/api/reviews/:reviewId', reviewController.getReview);
app.put('/api/reviews/:reviewId/response', verifyGatewayRequest, reviewController.addReviewResponse);
app.post('/api/reviews/:reviewId/helpful', verifyGatewayRequest, reviewController.voteHelpful);
app.post('/api/reviews/:reviewId/report', verifyGatewayRequest, reviewController.reportReview);

// Rating routes
app.get('/api/ratings/worker/:workerId', ratingController.getWorkerRating);
app.get('/api/ratings/worker/:workerId/signals', ratingController.getWorkerRankSignals);

// Analytics routes
app.put('/api/reviews/:reviewId/moderate', verifyGatewayRequest, requireAdmin, analyticsController.moderateReview);

// Admin routes (existing)
app.use('/api/admin', require('./routes/admin.routes'));

// Error logging middleware (must be last)
app.use(createErrorLogger(logger));

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('review-service server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    features: ['reviews', 'ratings', 'analytics', 'moderation', 'responses', 'reporting']
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down review-service...');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close();
  }
  process.exit(0);
});