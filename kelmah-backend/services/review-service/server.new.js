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

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

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
const PORT = process.env.REVIEW_SERVICE_PORT || 5006;

// Optional tracing and error monitoring
try { const monitoring = require('../../shared/utils/monitoring'); monitoring.initErrorMonitoring('review-service'); monitoring.initTracing('review-service'); } catch {}

// Env validation (fail-fast in production)
try {
  const { requireEnv } = require('../../shared/utils/envValidator');
  if (process.env.NODE_ENV === 'production') {
    requireEnv(['JWT_SECRET', 'MONGODB_URI'], 'review-service');
  }
} catch {}

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
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, check against allowed origins
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,https://kelmah.com').split(',');
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.info(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','X-Request-ID'],
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
  for (;;) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('Connected to MongoDB', { database: process.env.DB_NAME });
      break;
    } catch (error) {
      attempt += 1;
      const delay = Math.min(baseDelayMs * attempt, 30000);
      logger.warn(`MongoDB connection attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Initialize database connection
connectDbWithRetry();

// Import routes
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');

// Mount routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

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