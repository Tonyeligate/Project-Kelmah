/**
 * Auth Service
 * Handles authentication, authorization, and user identity management
 */

// Load environment variables FIRST, before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createOriginMatcher } = require('../../shared/utils/corsPolicy');
// removed morgan; using shared JSON logger
const cookieParser = require("cookie-parser");
const timingSafeCompare = require('./utils/timingSafeCompare');
const config = require("./config");
const { notFound } = require("./utils/errorTypes");
const { buildServiceErrorResponse } = require('./utils/errorResponse');
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth.routes");

// Initialize express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('./utils/logger');

// Create service logger
const logger = createLogger('auth-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('auth-service starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

const app = express();
// Optional tracing and error monitoring
try { const monitoring = require('./utils/monitoring'); monitoring.initErrorMonitoring('auth-service'); monitoring.initTracing('auth-service'); } catch {}

// Initialize keep-alive to prevent Render spin-down
let keepAliveManager;
try {
  const { initKeepAlive, keepAliveMiddleware, keepAliveTriggerHandler } = require('../../shared/utils/keepAlive');
  keepAliveManager = initKeepAlive('auth-service', { logger });
  logger.info('✅ Keep-alive manager initialized for auth-service');
} catch (error) {
  logger.warn('⚠️ Keep-alive manager not available:', error.message);
}

// Env validation (fail-fast in production)
try {
  const { requireEnv } = require('./utils/envValidator');
  if (process.env.NODE_ENV === 'production') {
    requireEnv(['JWT_SECRET', 'JWT_REFRESH_SECRET'], 'auth-service');
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      logger.error('auth-service missing MONGODB_URI/MONGO_URI in production');
      process.exit(1);
    }
  }
} catch {}

// Middleware

// Add HTTP request logging
app.use(createHttpLogger(logger));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());

// CORS configuration for production and development (env-driven with Vercel preview support)
const { isAllowedOrigin } = createOriginMatcher();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Client-Version'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Logging via createHttpLogger only

// Rate limiting (shared Redis-backed limiter with fallback)
try {
  const { createLimiter } = require('./middlewares/rateLimiter');
  app.use(createLimiter('default'));
} catch (err) {
  const rateLimit_fallback = require('express-rate-limit');
  const limiter = rateLimit_fallback({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
  app.use(limiter);
}

// Error logging middleware (must be BEFORE routes to catch errors)
app.use(createErrorLogger(logger));

// API routes
app.use("/api/auth", authRoutes);

// LOW-07: Static settings endpoints — these return hardcoded defaults.
// TODO: Replace with user-specific settings from database when settings feature is built.
app.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      theme: 'dark',
      language: 'en',
      notifications: true,
      emailUpdates: true,
      smsNotifications: false,
      twoFactorAuth: false,
      profileVisibility: 'public',
      dataSharing: false,
    },
  });
});

app.get('/settings/languages', (req, res) => {
  res.json({
    success: true,
    data: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'tw', name: 'Twi', flag: '🇬🇭' },
      { code: 'ha', name: 'Hausa', flag: '🇬🇭' },
    ],
  });
});

app.get('/settings/themes', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'light',
        name: 'Light Mode',
        description: 'Clean and bright interface',
        preview: '#ffffff',
      },
      {
        id: 'dark',
        name: 'Dark Mode',
        description: 'Easy on the eyes',
        preview: '#1a1a1a',
      },
      {
        id: 'auto',
        name: 'Auto',
        description: 'Follows system preference',
        preview: 'gradient',
      },
    ],
  });
});

// Admin routes for development/testing (guarded by INTERNAL_API_KEY)
const hasValidInternalAdminKey = (req) => {
  const internalKey = req.headers['x-internal-key'];
  return Boolean(
    process.env.INTERNAL_API_KEY &&
    internalKey &&
    timingSafeCompare(internalKey, process.env.INTERNAL_API_KEY),
  );
};

// Middleware: require both INTERNAL_API_KEY + valid JWT with admin role
const requireAdminRole = async (req, res, next) => {
  if (!hasValidInternalAdminKey(req)) {
    return res.status(403).json({ success: false, message: 'Forbidden: invalid internal key' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Admin JWT required' });
  }
  try {
    const jwtUtils = require('../../shared/utils/jwt');
    const decoded = await jwtUtils.verifyAccessToken(authHeader.substring(7));
    if (!decoded || !['admin', 'super_admin'].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Admin role required' });
    }
    req.adminUser = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
};

// ── Shared admin handler functions ──────────────────────────────────────────
const adminVerifyUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!hasValidInternalAdminKey(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const { User } = require("./models");
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    return res.json({ success: true, message: "User verified successfully", data: { email: user.email, isEmailVerified: user.isEmailVerified } });
  } catch (error) {
    logger.error('Admin verify user error:', error);
    return res.status(500).json({ success: false, message: "Error verifying user" });
  }
};

const adminVerifyUsersBatch = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!hasValidInternalAdminKey(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ success: false, message: "Emails array is required" });
    }
    const { User } = require("./models");
    const normalizedEmails = emails.map(e => (e || '').toLowerCase()).filter(Boolean);
    await User.bulkWrite(
      normalizedEmails.map(email => ({
        updateOne: {
          filter: { email },
          update: {
            $set: {
              isEmailVerified: true,
              emailVerificationToken: null,
              emailVerificationExpires: null,
            },
          },
        },
      }))
    );
    return res.json({ success: true, message: `Verified ${normalizedEmails.length} users` });
  } catch (error) {
    logger.error('Batch verify users error:', error);
    return res.status(500).json({ success: false, message: "Error verifying users" });
  }
};

const adminUnlockAccount = async (req, res) => {
  try {
    const { email } = req.body;
    if (!hasValidInternalAdminKey(req)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const { User } = require('./models');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.accountLockedUntil = undefined;
    await user.save();
    return res.json({ success: true, message: 'Account unlocked successfully', data: { email: user.email } });
  } catch (error) {
    logger.error('Admin unlock account error:', error);
    return res.status(500).json({ success: false, message: 'Error unlocking account' });
  }
};

// ── Canonical admin routes (auth-prefix — works behind API Gateway) ────────
app.post("/api/auth/admin/verify-user", requireAdminRole, adminVerifyUser);
app.post("/api/auth/admin/verify-users", requireAdminRole, adminVerifyUsersBatch);
app.post("/api/auth/admin/unlock-account", requireAdminRole, adminUnlockAccount);

// ── Legacy aliases (direct access — same handlers, will be deprecated) ─────
app.post("/api/admin/verify-user", requireAdminRole, adminVerifyUser);
app.post("/api/admin/verify-users-batch", requireAdminRole, adminVerifyUsersBatch);
app.post("/api/admin/unlock-account", requireAdminRole, adminUnlockAccount);

// Removed temporary job proxy routes; API Gateway should route to job-service

// Removed temporary user/dashboard endpoints; API Gateway should route to user-service

// Health check endpoint
const healthResponse = (req, res) => {
  res.status(200).json({
    service: "Auth Service",
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
      res.status(500).json({ success: false, error: 'Keep-alive trigger failed' });
    }
  });
}


// Readiness and liveness endpoints
app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (req, res) => {
  const ready = mongoose.connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// Root endpoint with API information
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Kelmah Auth Service",
    version: "1.0.0",
    description: "Authentication and authorization service for the Kelmah platform",
    health: "/health",
    endpoints: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login", 
      verify: "GET /api/auth/verify",
      "refresh-token": "POST /api/auth/refresh-token",
      logout: "POST /api/auth/logout"
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use((err, req, res, next) => {
  const { statusCode, body } = buildServiceErrorResponse(err, process.env.NODE_ENV);
  res.status(statusCode).json(body);
});

// Start server
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 5001;
// Alias environment variables to expected names
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;
process.env.MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Check for required environment variables
const requiredEnvVars = ["JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error("Error: Missing required environment variables:");
  missingEnvVars.forEach((envVar) => logger.error(`- ${envVar}`));
  if (require.main === module) {
    process.exit(1);
  }
}

// Connect to MongoDB but do not block server start if ALLOW_START_WITHOUT_DB=true
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`🚀 Auth Service running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🗄️ Database: MongoDB (kelmah_platform)`);
  });
};

if (require.main === module) {
  connectDB()
    .then(() => {
      logger.info("✅ Auth Service connected to MongoDB");
      startServer();
    })
    .catch((err) => {
      logger.error("❌ MongoDB connection error:", err);
      if (process.env.ALLOW_START_WITHOUT_DB === 'true') {
        logger.warn('Starting server without DB connection due to ALLOW_START_WITHOUT_DB=true');
        startServer();
      } else {
        process.exit(1);
      }
    });
}

module.exports = app;
