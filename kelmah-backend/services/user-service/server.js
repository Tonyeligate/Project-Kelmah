/**
 * User Service
 * Handles user profile management, settings, and user-related operations
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require("./utils/errorTypes");

// MongoDB connection 
const { connectDB, mongoose } = require("./config/db");

// CRITICAL FIX: DO NOT set bufferCommands = false at module load time
// Models created with bufferCommands=false will fail even after connection is ready
// Instead, use default bufferCommands=true and ensure connection is ready before server starts
const mongoose = require('mongoose');

// CRITICAL FIX: Import models AFTER this comment to avoid schema initialization issues
// Models will be imported after MongoDB connection is established
// This prevents "_hasEncryptedFields is not a function" error
let User, WorkerProfile;

// Models will be loaded after MongoDB connection in the startup sequence

// Note: Setting and Notification models need to be converted to Mongoose as well

// Import routes
const userRoutes = require("./routes/user.routes");
const profileRoutes = require("./routes/profile.routes");
const settingsRoutes = require("./routes/settings.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const availabilityRoutes = require("./routes/availability.routes");
const { ensureDbReadyMiddleware } = require('./middlewares/ensureDbReady');

// Initialize express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Create service logger
const logger = createLogger('user-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('user-service starting...', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

// Fail-fast for required secrets
if (process.env.NODE_ENV === 'production') {
  try {
    const { requireEnv } = require('./utils/envValidator');
    requireEnv(['JWT_SECRET', 'MONGODB_URI'], 'user-service');
  } catch {
    if (!process.env.JWT_SECRET) {
      console.error('User Service missing JWT_SECRET. Exiting.');
      process.exit(1);
    }
  }
}
// Warn if advanced worker SQL is enabled but SQL URL is not configured
if (process.env.ENABLE_WORKER_SQL === 'true') {
  if (!process.env.USER_SQL_URL && !process.env.DATABASE_URL) {
    console.warn('⚠️ ENABLE_WORKER_SQL=true but no USER_SQL_URL/DATABASE_URL configured. Advanced worker features will be degraded.');
  }
}

const app = express();
<<<<<<< Updated upstream
// Trust proxy headers (Render forwards X-Forwarded-For)
=======
>>>>>>> Stashed changes
app.set('trust proxy', 1);
// Optional tracing
try { require('./utils/tracing').initTracing('user-service'); } catch { }
try { const monitoring = require('./utils/monitoring'); monitoring.initErrorMonitoring('user-service'); monitoring.initTracing('user-service'); } catch { }

// Middleware

let isDatabaseReady = false;

mongoose.connection.on('connected', () => {
  isDatabaseReady = true;
  logger.info('✅ MongoDB connection ready');
});

mongoose.connection.on('disconnected', () => {
  isDatabaseReady = false;
  logger.warn('⚠️ MongoDB connection lost');
});

const warmupBypassPaths = new Set([
  '/',
  '/health',
  '/api/health',
  '/health/live',
  '/api/health/live',
  '/health/ready',
  '/api/health/ready'
]);

const requireDatabaseReady = (req, res, next) => {
  if (req.method === 'OPTIONS' || isDatabaseReady) {
    return next();
  }

  const path = req.path || '';
  if (warmupBypassPaths.has(path) || path.startsWith('/health') || path.startsWith('/api/health')) {
    return next();
  }

  logger.info('⏳ User service waiting for database connection', {
    path,
    method: req.method,
  });

  res.set('Retry-After', '5');
  return res.status(503).json({
    success: false,
    message: 'User service is initializing its database connection. Please retry shortly.',
  });
};

// Add HTTP request logging
app.use(createHttpLogger(logger));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
// Unified CORS: env-driven allowlist + Vercel previews
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
      /^https:\/\/kelmah-frontend.*\.vercel\.app$/
    ];

    if (!origin) return callback(null, true); // Allow no origin (mobile apps, etc.)
    if (allowedOrigins.includes(origin) || vercelPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }
    logger.info(`🚨 User Service CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", 'X-Requested-With', 'X-Request-ID'],
};

app.use(cors(corsOptions));

// Use shared JSON logger; remove morgan

// Ensure database connection is ready before handling API traffic (health endpoints bypassed)
app.use(ensureDbReadyMiddleware);

// Rate limiting (shared Redis-backed limiter with fallback)
try {
  const { createLimiter } = require('../../shared/middlewares/rateLimiter');
  app.use(createLimiter('default'));
} catch (err) {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
  app.use(limiter);
}

app.use(requireDatabaseReady);

// API routes
app.use("/api/users", userRoutes);
app.use("/api/availability", availabilityRoutes);

// Dashboard routes (direct mounting for compatibility)
const { getDashboardMetrics, getDashboardWorkers, getDashboardAnalytics } = require('./controllers/user.controller');
app.get("/dashboard/metrics", getDashboardMetrics);
app.get("/dashboard/workers", getDashboardWorkers);
app.get("/dashboard/analytics", getDashboardAnalytics);

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log('🌐 [USER-SERVICE] Incoming request:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    url: req.url,
    headers: {
      'x-authenticated-user': !!req.headers['x-authenticated-user'],
      'x-auth-source': req.headers['x-auth-source'] || 'none',
      authorization: req.headers.authorization ? 'Bearer ***' : 'none'
    }
  });
  next();
});

// Direct worker routes for public access (needed for frontend /api/workers calls)
// ✅ FIX: Handle both with and without trailing slash due to proxy forwarding
const WorkerController = require('./controllers/worker.controller');

// Worker list endpoint - handle both /api/workers and /api/workers/
app.get(['/api/workers', '/api/workers/'], (req, res) => {
  console.log('✅ [DIRECT] /api/workers route hit (with/without trailing slash)');
  WorkerController.getAllWorkers(req, res);
});

// Worker search endpoint - handle both variants
app.get(['/api/workers/search', '/api/workers/search/'], (req, res) => {
  console.log('✅ [DIRECT] /api/workers/search route hit');
  WorkerController.searchWorkers(req, res);
});

// Removed temporary profile/activity/statistics stub endpoints

// Removed temporary worker endpoints for applications and saved-jobs

// Fix: Add missing appointments endpoint
app.get('/api/appointments', (req, res) => {
  const appointments = [
    {
      id: 'apt_1',
      jobId: 'job_123',
      jobTitle: 'Kitchen Cabinet Installation',
      hirer: 'Sarah Johnson',
      hirerId: 'user_456',
      hirerAvatar: null,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: '09:00',
      endTime: '17:00',
      location: 'East Legon, Accra',
      appointmentType: 'in-person',
      status: 'confirmed',
      notes: 'Please bring measuring tools',
    },
    {
      id: 'apt_2',
      jobId: 'job_124',
      jobTitle: 'Plumbing Consultation',
      hirer: 'Michael Brown',
      hirerId: 'user_789',
      hirerAvatar: null,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Virtual Meeting',
      appointmentType: 'virtual',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      status: 'pending',
      notes: 'Initial consultation for bathroom renovation',
    },
  ];

  res.json({
    success: true,
    data: appointments,
  });
});
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/analytics", analyticsRoutes);
// alias under users for gateway consistency
app.use("/api/users/analytics", analyticsRoutes);

// Removed temporary contracts endpoint; job-service should serve contracts

// Health check endpoint
const healthResponse = (req, res) => {
  res.status(200).json({
    service: "User Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
};

app.get("/health", healthResponse);
app.get("/api/health", healthResponse); // API Gateway compatibility

app.get('/health/ready', (req, res) => {
  const ready = require('mongoose').connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (req, res) => {
  const ready = require('mongoose').connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// ITERATION 5: Detailed MongoDB connection status endpoint for debugging
app.get('/health/db', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection?.readyState || 0;
  
  const status = {
    service: 'User Service - MongoDB Connection Status',
    timestamp: new Date().toISOString(),
    mongodb: {
      readyState: readyState,
      readyStateText: states[readyState] || 'unknown',
      host: mongoose.connection?.host || 'N/A',
      name: mongoose.connection?.name || 'N/A',
      models: Object.keys(mongoose.models || {}).length,
      modelNames: Object.keys(mongoose.models || {}),
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasMongodbUri: !!process.env.MONGODB_URI,
      mongodbUriPreview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 30) + '...' : 'NOT SET'
    },
    healthCheck: readyState === 1 ? 'HEALTHY' : 'UNHEALTHY'
  };
  
  res.status(readyState === 1 ? 200 : 503).json(status);
});

app.get('/api/health/db', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection?.readyState || 0;
  
  const status = {
    service: 'User Service - MongoDB Connection Status',
    timestamp: new Date().toISOString(),
    mongodb: {
      readyState: readyState,
      readyStateText: states[readyState] || 'unknown',
      host: mongoose.connection?.host || 'N/A',
      name: mongoose.connection?.name || 'N/A',
      models: Object.keys(mongoose.models || {}).length,
      modelNames: Object.keys(mongoose.models || {}),
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasMongodbUri: !!process.env.MONGODB_URI,
      mongodbUriPreview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 30) + '...' : 'NOT SET'
    },
    healthCheck: readyState === 1 ? 'HEALTHY' : 'UNHEALTHY'
  };
  
  res.status(readyState === 1 ? 200 : 503).json(status);
});

// Root endpoint with API information and deployment verification (AFTER specific routes)
app.get("/", (req, res) => {
  const actualService = 'user-service';
  const expectedAtThisURL = process.env.SERVICE_NAME || 'unknown';
  const isCorrectDeployment = actualService === expectedAtThisURL;

  res.status(200).json({
    name: "User Service API",
    version: "1.0.0",
    description: "User management service for the Kelmah platform",
    health: "/health",
    endpoints: [
      "/api/users",
      "/api/profile",
      "/api/settings",
      "/api/jobs/contracts" // TEMP FIX for deployment mixup
    ],
    deployment: {
      actualService: actualService,
      expectedService: expectedAtThisURL,
      isCorrectDeployment: isCorrectDeployment,
      status: isCorrectDeployment ? "✅ CORRECT DEPLOYMENT" : "🚨 DEPLOYMENT MIXUP DETECTED",
      warning: isCorrectDeployment ? null : "This URL should serve a different microservice"
    },
    temporaryFix: {
      contractsEndpoint: "/api/jobs/contracts",
      reason: "job-service URL serving user-service code",
      solution: "Fix Render deployment configuration"
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
const PORT = process.env.USER_SERVICE_PORT || 5002;

// Only start the server if this file is run directly
if (require.main === module) {
  connectDB()
<<<<<<< Updated upstream
    .then(async () => {
=======
    .then(() => {
    isDatabaseReady = true;
>>>>>>> Stashed changes
      logger.info("✅ User Service connected to MongoDB");
      
      // CRITICAL: Wait for connection to be fully ready before starting server
      const mongoose = require('mongoose');
      
      logger.info(`🔍 Initial MongoDB readyState: ${mongoose.connection.readyState}`);
      
      if (mongoose.connection.readyState !== 1) {
        logger.info("⏳ Waiting for MongoDB connection to be fully ready...");
        
        const connectionReady = await new Promise((resolve, reject) => {
          const startTime = Date.now();
          const maxWaitTime = 30000; // 30 seconds timeout
          
          const checkReady = setInterval(() => {
            const currentState = mongoose.connection.readyState;
            const elapsed = Date.now() - startTime;
            
            if (currentState === 1) {
              clearInterval(checkReady);
              logger.info(`✅ MongoDB connection ready after ${elapsed}ms`);
              resolve(true);
            } else if (elapsed >= maxWaitTime) {
              clearInterval(checkReady);
              logger.error(`❌ MongoDB connection readyState check timed out after ${maxWaitTime}ms`);
              logger.error(`   Current readyState: ${currentState} (expected: 1)`);
              reject(new Error(`MongoDB connection not ready after ${maxWaitTime}ms. ReadyState: ${currentState}`));
            } else {
              // Log every 5 seconds
              if (elapsed % 5000 < 100) {
                logger.info(`   Still waiting... readyState: ${currentState}, elapsed: ${elapsed}ms`);
              }
            }
          }, 100);
        });
        
        if (!connectionReady) {
          throw new Error('MongoDB connection failed to reach ready state');
        }
      }
      
      logger.info(`✅ MongoDB connection fully ready (readyState: ${mongoose.connection.readyState})`);
      
      // CRITICAL: Wait for the connection to be fully operational
      // readyState === 1 doesn't mean the connection can handle queries yet
      logger.info("⏳ Waiting for connection to be fully operational...");
      await new Promise(resolve => {
        if (mongoose.connection.db) {
          // Connection has database object, test it
          mongoose.connection.db.admin().ping()
            .then(() => {
              logger.info("✅ MongoDB ping successful - connection operational");
              resolve();
            })
            .catch(err => {
              logger.warn(`⚠️ Ping failed, waiting 1s: ${err.message}`);
              setTimeout(resolve, 1000);
            });
        } else {
          // No db object yet, wait a bit
          logger.info("⏳ No db object yet, waiting 500ms...");
          setTimeout(resolve, 500);
        }
      });
      
      // CRITICAL: Load models AFTER MongoDB connection is ready
      logger.info("📦 Loading models after MongoDB connection... (v2.1)");
      const modelsModule = require("./models");
      modelsModule.loadModels(); // Populate the internal model variables
      logger.info("✅ Models loaded successfully");
      
      // The getters will now return the actual models
      User = modelsModule.User;
      WorkerProfile = modelsModule.WorkerProfile;
      
      // Verify models are registered
      if (mongoose.models.User) {
        logger.info("✅ User model verified in mongoose.models registry");
      } else {
        logger.error("❌ WARNING: User model still not in registry after import!");
      }
      
      logger.info(`📋 All registered models: ${Object.keys(mongoose.models).join(', ')}`);
      
      // Verify we can actually query the database using Mongoose models
      // Disable buffering timeout for this test - connection should be ready
      const originalTimeout = mongoose.get('bufferTimeoutMS');
      mongoose.set('bufferTimeoutMS', 20000); // Give more time for first query
      
      try {
        logger.info("🧪 Testing database with actual Mongoose model queries...");
        
        // Test with a simple query using the native driver first
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        logger.info(`✅ Native driver test passed - ${collections.length} collections found`);
        
        // Now test Mongoose model query
        const testCount = await User.countDocuments({ isActive: true });
        logger.info(`✅ Mongoose model query test successful! Found ${testCount} active users.`);
        
        // Restore buffer timeout
        mongoose.set('bufferTimeoutMS', originalTimeout || 10000);
        logger.info("✅ Database connection verified and ready!");
        
      } catch (testError) {
        logger.error("❌ Database test failed:", testError.message);
        logger.error("   Connection state:", {
          readyState: mongoose.connection.readyState,
          hasDb: !!mongoose.connection.db,
          host: mongoose.connection.host
        });
        throw new Error(`Database not ready: ${testError.message}`);
      }

      // Error logging middleware (must be last)
      app.use(createErrorLogger(logger));

      // Start the server after DB is ready
      app.listen(PORT, () => {
        logger.info(`🚀 User Service running on port ${PORT}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🗄️ Database: MongoDB (kelmah_platform)`);
        logger.info(`🎯 Server is ready to accept requests!`);
      });
    })
    .catch((err) => {
      logger.error("❌ User Service MongoDB connection error:", err);
      logger.error("🚨 Service cannot start without database connection");
      logger.error("🚨 Exiting in 5 seconds...");
      setTimeout(() => process.exit(1), 5000);
    });
}

module.exports = app;
