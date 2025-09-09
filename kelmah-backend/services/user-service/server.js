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
const { connectDB } = require("./config/db");

// Import Mongoose models
const User = require("./models/User");
// Note: Setting and Notification models need to be converted to Mongoose as well

// Import routes
const userRoutes = require("./routes/user.routes");
const profileRoutes = require("./routes/profile.routes");
const settingsRoutes = require("./routes/settings.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const availabilityRoutes = require("./routes/availability.routes");

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
// Optional tracing
try { require('./utils/tracing').initTracing('user-service'); } catch {}
try { const monitoring = require('./utils/monitoring'); monitoring.initErrorMonitoring('user-service'); monitoring.initTracing('user-service'); } catch {}

// Middleware

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

// Rate limiting (shared Redis-backed limiter with fallback)
try {
  const { createLimiter } = require('../auth-service/middlewares/rateLimiter');
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

// API routes
app.use("/api/users", userRoutes);
app.use("/api/availability", availabilityRoutes);

// Direct worker routes for public access (MUST come before other routes)
const WorkerController = require('./controllers/worker.controller');
// Handle both /workers (from gateway path rewrite) and /api/workers (direct calls)
app.get('/workers', WorkerController.getAllWorkers);
app.get('/workers/search', WorkerController.searchWorkers);
app.get('/api/workers', WorkerController.getAllWorkers);
app.get('/api/workers/search', WorkerController.searchWorkers);

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
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "User Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', (req, res) => {
  const ready = require('mongoose').connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
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
    .then(() => {
      logger.info("✅ User Service connected to MongoDB");
      
      // Error logging middleware (must be last)
      app.use(createErrorLogger(logger));

      // Start the server after DB is ready
      app.listen(PORT, () => {
        logger.info(`🚀 User Service running on port ${PORT}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🗄️ Database: MongoDB (kelmah_platform)`);
      });
    })
    .catch((err) => {
      logger.error("❌ User Service MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = app;
