/**
 * Job Service
 * Handles job postings, applications, and job-related operations
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { randomUUID } = require("crypto");
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
const quickJobRoutes = require("./routes/quickJobRoutes");

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
// Disable strict routing to handle trailing slashes (treats /api/jobs and /api/jobs/ as same)
app.set('strict routing', false);
// Trust proxy headers (required for correct client IP when behind Render/API Gateway)
app.set('trust proxy', 1);

// Attach a request ID for tracing across logs and responses
app.use((req, res, next) => {
  const headerId = req.headers['x-request-id'] || req.headers['x-requestid'];
  const requestId = headerId || req.id || randomUUID();
  req.id = requestId;
  res.locals.requestId = requestId;
  next();
});

// Initialize keep-alive to prevent Render spin-down
let keepAliveManager;
try {
  const { initKeepAlive, keepAliveMiddleware, keepAliveTriggerHandler } = require('../../shared/utils/keepAlive');
  keepAliveManager = initKeepAlive('job-service', { logger });
  logger.info('✅ Keep-alive manager initialized for job-service');
} catch (error) {
  logger.warn('⚠️ Keep-alive manager not available:', error.message);
}

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
    keepAlive: keepAliveManager ? keepAliveManager.getStatus() : { enabled: false }
  });
};

app.get("/health", healthResponse);
app.get("/api/health", healthResponse); // API Gateway compatibility

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


// Readiness and liveness endpoints (also before limiter)
app.get('/health/ready', (req, res) => {
  const isDbConnected = !!(require('mongoose').connection?.readyState === 1);
  const bufferCommands = require('mongoose').get('bufferCommands');
  const bufferTimeoutMS = require('mongoose').get('bufferTimeoutMS');
  res.status(isDbConnected ? 200 : 503).json({
    ready: isDbConnected,
    readyState: require('mongoose').connection?.readyState,
    bufferCommands,
    bufferTimeoutMS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/ready', (req, res) => {
  const isDbConnected = !!(require('mongoose').connection?.readyState === 1);
  const bufferCommands = require('mongoose').get('bufferCommands');
  const bufferTimeoutMS = require('mongoose').get('bufferTimeoutMS');
  res.status(isDbConnected ? 200 : 503).json({
    ready: isDbConnected,
    readyState: require('mongoose').connection?.readyState,
    bufferCommands,
    bufferTimeoutMS,
    timestamp: new Date().toISOString()
  });
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

// Defer mounting API routes until DB is connected to avoid Mongoose buffering timeouts
let apiRoutesMounted = false;
const mountApiRoutes = () => {
  console.log('[ROUTE MOUNTING] mountApiRoutes() function called!');
  console.log('[ROUTE MOUNTING] apiRoutesMounted flag:', apiRoutesMounted);
  if (apiRoutesMounted) {
    console.log('[ROUTE MOUNTING] Routes already mounted, skipping');
    return;
  }
  // Mount routes under both /jobs and /api/jobs for backward compatibility
  // API Gateway forwards to /api/jobs, but some direct calls use /jobs
  console.log('[ROUTE MOUNTING] Mounting /jobs routes...');
  app.use("/jobs", jobRoutes);
  console.log('[ROUTE MOUNTING] Mounting /api/jobs routes (API Gateway compatibility)...');
  app.use("/api/jobs", jobRoutes);
  console.log('[ROUTE MOUNTING] Mounting /bids routes...');
  app.use("/bids", bidRoutes);
  console.log('[ROUTE MOUNTING] Mounting /api/bids routes (API Gateway compatibility)...');
  app.use("/api/bids", bidRoutes);
  console.log('[ROUTE MOUNTING] Mounting /user-performance routes...');
  app.use("/user-performance", userPerformanceRoutes);
  console.log('[ROUTE MOUNTING] Mounting /api/user-performance routes (API Gateway compatibility)...');
  app.use("/api/user-performance", userPerformanceRoutes);
  
  // QuickJob routes - Protected Quick-Hire System
  console.log('[ROUTE MOUNTING] Mounting /quick-jobs routes...');
  app.use("/quick-jobs", quickJobRoutes);
  console.log('[ROUTE MOUNTING] Mounting /api/quick-jobs routes (API Gateway compatibility)...');
  app.use("/api/quick-jobs", quickJobRoutes);
  
  apiRoutesMounted = true;
  console.log('[ROUTE MOUNTING] ✅ All API routes mounted successfully!');
  logger.info('✅ API routes mounted after DB connection');
};

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

// ⚠️ REMOVED 404 and error handlers from here!
// They must be registered AFTER routes are mounted
// Otherwise they catch requests before routes exist!

// Start server
const PORT = process.env.PORT || process.env.JOB_SERVICE_PORT || 5003;

let httpServerStarted = false;

async function startServerWithDbRetry() {
  const baseDelayMs = 5000;
  let attempt = 0;
  // Keep retrying DB connection with backoff to avoid ECS crash loops
  // Health endpoint /health stays up so the task remains healthy while we wait
  // for network allowlisting or DB availability.
  for (; ;) {
    try {
      console.log('[DB CONNECTION] Attempting MongoDB connection...');
      await connectDB();
      console.log('[DB CONNECTION] ✅ MongoDB connection successful!');
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
      // Mount API routes once DB connection is ready
      // Routes already mounted at startup (EMERGENCY FIX below), no need to re-mount here
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

// Add middleware to log ALL incoming requests BEFORE mounting routes
app.use((req, res, next) => {
  console.log('[REQUEST DEBUG] Incoming request:');
  console.log('  - Method:', req.method);
  console.log('  - Path (req.path):', req.path);
  console.log('  - URL (req.url):', req.url);
  console.log('  - Original URL:', req.originalUrl);
  console.log('  - Base URL:', req.baseUrl);
  console.log('  - Query:', JSON.stringify(req.query));
  next();
});

// EMERGENCY FIX: Mount routes IMMEDIATELY (don't wait for DB)
// Routes will work; only the DB queries inside controllers need DB
console.log('[EMERGENCY FIX] Mounting routes IMMEDIATELY at startup');
mountApiRoutes();
console.log('[EMERGENCY FIX] Routes mounted before DB connection');

// ✅ NOW register 404 and error handlers AFTER routes mounted
console.log('[MIDDLEWARE] Registering 404 handler after routes');
app.use(notFound);

console.log('[MIDDLEWARE] Registering error handler after routes');
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

// Only start the server if this file is run directly
if (require.main === module) {
  console.log('[SERVER START] Starting Job Service...');
  console.log('[SERVER START] Port:', PORT);
  console.log('[SERVER START] Environment:', process.env.NODE_ENV);
  // Start HTTP server immediately so /health is available while DB connects
  if (!httpServerStarted) {
    app.use(createErrorLogger(logger));
    app.listen(PORT, () => {
      httpServerStarted = true;
      console.log('[SERVER START] HTTP server listening on port', PORT);
      logger.info(`🚀 Job Service running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info('⏳ Waiting for MongoDB connection...');
    });
  }
  console.log('[SERVER START] Calling startServerWithDbRetry()...');
  startServerWithDbRetry();
}

module.exports = app;
