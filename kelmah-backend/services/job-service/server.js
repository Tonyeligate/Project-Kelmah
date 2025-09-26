/**
 * Job Service
 * Handles job postings, applications, and job-related operations
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
// removed morgan; using shared JSON logger
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require('./utils/errorTypes');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Import MongoDB connection
const { connectDB } = require("./config/db");

// Import MongoDB models
const { Job, Application, Bid, UserPerformance, Category } = require("./models");

// Import routes
const jobRoutes = require("./routes/job.routes");
const bidRoutes = require("./routes/bid.routes");
const userPerformanceRoutes = require("./routes/userPerformance.routes");

// Initialize express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Create service logger
const logger = createLogger('job-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('job-service starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

// Fail-fast for required secrets
if (!process.env.JWT_SECRET) {
  console.error('Job Service missing JWT_SECRET. Exiting.');
  process.exit(1);
}

const app = express();
// Optional tracing and error monitoring (disabled for containerized deployment)
// try { const monitoring = require('../../shared/utils/monitoring'); monitoring.initErrorMonitoring('job-service'); monitoring.initTracing('job-service'); } catch {}

// Env validation (fail-fast in production) 
// Disabled shared utils for containerized deployment
// try {
//   const { requireEnv } = require('../../shared/utils/envValidator');
//   if (process.env.NODE_ENV === 'production') {
//     requireEnv(['JWT_SECRET', 'MONGODB_URI'], 'job-service');
//   }
// } catch {}

// Middleware

// Add HTTP request logging
app.use(createHttpLogger(logger));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
// CORS configuration for production and development (env-driven + Vercel preview)
const corsOptions = {
  origin: function (origin, callback) {
    const envAllow = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      ...envAllow,
    ].filter(Boolean);

    const vercelPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*-kelmahs-projects\.vercel\.app$/,
      /^https:\/\/project-kelmah.*\.vercel\.app$/,
      /^https:\/\/kelmah-frontend.*\.vercel\.app$/,
    ];

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }
    logger.info(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Logging via createHttpLogger only

// Health endpoints MUST be mounted before any rate limiting
const healthResponse = (req, res) => {
  res.status(200).json({
    service: "Job Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
};

app.get("/health", healthResponse);
app.get("/api/health", healthResponse); // API Gateway compatibility

// Readiness and liveness endpoints (also before limiter)
app.get('/health/ready', (req, res) => {
  const isDbConnected = !!(require('mongoose').connection?.readyState === 1);
  res.status(isDbConnected ? 200 : 503).json({ ready: isDbConnected, timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (req, res) => {
  const isDbConnected = !!(require('mongoose').connection?.readyState === 1);
  res.status(isDbConnected ? 200 : 503).json({ ready: isDbConnected, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// Rate limiting (shared Redis-backed limiter with fallback) — create ONCE
try {
  const { createLimiter } = require('../../shared/middlewares/rateLimiter');
  const defaultLimiter = createLimiter('default');

  app.use((req, res, next) => {
    const p = req.path || '';
    if (p.startsWith('/health') || p.startsWith('/api/health')) return next();
    if (p.startsWith('/api/jobs/my-jobs')) return next();
    if (p === '/my-jobs' || p.startsWith('/my-jobs')) return next();
    return defaultLimiter(req, res, next);
  });
} catch (err) {
  const rateLimit = require('express-rate-limit');
  const defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' }
  });
  app.use((req, res, next) => {
    const p = req.path || '';
    if (p.startsWith('/health') || p.startsWith('/api/health')) return next();
    if (p.startsWith('/api/jobs/my-jobs')) return next();
    if (p === '/my-jobs' || p.startsWith('/my-jobs')) return next();
    return defaultLimiter(req, res, next);
  });
}

// API routes
app.use("/api/jobs", jobRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/user-performance", userPerformanceRoutes);

// Deployment verification
const { verifyDeployment } = require('./verify-deployment');

// Root endpoint with API information and deployment verification
app.get("/", (req, res) => {
  const verification = verifyDeployment();
  
  res.status(200).json({
    name: "Job Service API",
    version: "1.0.2", // Fixed build dependencies
    description: "Job management service for the Kelmah platform",
    health: "/health",
    endpoints: [
      "/api/jobs",
      "/api/jobs/contracts",
      "/api/jobs/dashboard"
    ],
    deployment: {
      service: verification.serviceName,
      correctService: verification.isCorrectService,
      contractsAvailable: verification.hasContracts,
      status: verification.isCorrectService ? "✅ CORRECT DEPLOYMENT" : "❌ WRONG DEPLOYMENT"
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    success: false,
    status,
    message: err.message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
const PORT = process.env.JOB_SERVICE_PORT || 5003;

let httpServerStarted = false;

async function startServerWithDbRetry() {
  const baseDelayMs = 5000;
  let attempt = 0;
  // Keep retrying DB connection with backoff to avoid ECS crash loops
  // Health endpoint /health stays up so the task remains healthy while we wait
  // for network allowlisting or DB availability.
  for (;;) {
    try {
      await connectDB();
      logger.info('✅ Job Service connected to MongoDB');

      // Error logging middleware (must be last)
      if (!httpServerStarted) {
        app.use(createErrorLogger(logger));
        app.listen(PORT, () => {
          httpServerStarted = true;
          logger.info(`🚀 Job Service running on port ${PORT}`);
          logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
          logger.info(`🗄️ Database: MongoDB (kelmah_platform)`);
        });
      }
      break;
    } catch (err) {
      attempt += 1;
      const delay = Math.min(baseDelayMs * attempt, 30000);
      logger.error('❌ Job Service MongoDB connection error:', err?.message || err);
      logger.info(`🔁 Retrying MongoDB connection in ${Math.floor(delay / 1000)}s (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  // Start HTTP server immediately so /health is available while DB connects
  if (!httpServerStarted) {
    app.use(createErrorLogger(logger));
    app.listen(PORT, () => {
      httpServerStarted = true;
      logger.info(`🚀 Job Service running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info('⏳ Waiting for MongoDB connection...');
    });
  }
  startServerWithDbRetry();
}

module.exports = app;
