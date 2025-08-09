/**
 * Auth Service
 * Handles authentication, authorization, and user identity management
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require("./utils/errorTypes");
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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

// Middleware

// Add HTTP request logging
app.use(createHttpLogger(logger));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());

// CORS configuration for production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://kelmah-frontend-cyan.vercel.app', // Current production frontend
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://kelmah-frontend.onrender.com',
      'https://project-kelmah.onrender.com',
      'https://kelmah-frontend-ecru.vercel.app',
      'https://kelmah-frontend-mu.vercel.app', // Legacy URL for backward compatibility
      process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app' // Dynamic with fallback
    ].filter(Boolean); // Remove any undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.info(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-ID", "X-Client-Version"],
  optionsSuccessStatus: 200 // for legacy browser support
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// API routes
app.use("/api/auth", authRoutes);

// Fix: Add missing settings endpoints
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
app.post("/api/admin/verify-user", async (req, res) => {
  try {
    const { email } = req.body;
    const internalKey = req.headers['x-internal-key'] || req.query.key;
    if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    // Find user by email (Mongoose)
    const User = require("./models/User");
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Force verify the user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "User verified successfully",
      data: {
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    logger.error('Admin verify user error:', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying user",
      error: error.message
    });
  }
});

// Batch verify multiple users
app.post("/api/admin/verify-users-batch", async (req, res) => {
  try {
    const { emails } = req.body;
    const internalKey = req.headers['x-internal-key'] || req.query.key;
    if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        message: "Emails array is required"
      });
    }
    const User = require("./models/User");
    const results = [];

    for (const email of emails) {
      try {
        const user = await User.findOne({ email: (email || '').toLowerCase() });
        
        if (user) {
          user.isEmailVerified = true;
          user.emailVerificationToken = undefined;
          user.emailVerificationExpires = undefined;
          await user.save();
          
          results.push({
            email,
            status: 'verified',
            success: true
          });
        } else {
          results.push({
            email,
            status: 'not_found',
            success: false
          });
        }
      } catch (error) {
        results.push({
          email,
          status: 'error',
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.json({
      success: true,
      message: `Verified ${successCount}/${emails.length} users`,
      data: results
    });

  } catch (error) {
    logger.error('Batch verify users error:', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying users",
      error: error.message
    });
  }
});

// Admin routes (auth-prefix) to work behind API Gateway
app.post("/api/auth/admin/verify-user", async (req, res) => {
  try {
    const { email } = req.body;
    const internalKey = req.headers['x-internal-key'] || req.query.key;
    if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const User = require("./models/User");
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
    logger.error('Auth-prefixed Admin verify user error:', error);
    return res.status(500).json({ success: false, message: "Error verifying user", error: error.message });
  }
});

app.post("/api/auth/admin/verify-users", async (req, res) => {
  try {
    const { emails } = req.body;
    const internalKey = req.headers['x-internal-key'] || req.query.key;
    if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ success: false, message: "Emails array is required" });
    }

    const User = require("./models/User");
    const results = [];
    for (const email of emails) {
      try {
        const user = await User.findOne({ email: (email || '').toLowerCase() });
        if (user) {
          user.isEmailVerified = true;
          user.emailVerificationToken = undefined;
          user.emailVerificationExpires = undefined;
          await user.save();
          results.push({ email, status: 'verified', success: true });
        } else {
          results.push({ email, status: 'not_found', success: false });
        }
      } catch (error) {
        results.push({ email, status: 'error', success: false, error: error.message });
      }
    }
    const successCount = results.filter(r => r.success).length;
    return res.json({ success: true, message: `Verified ${successCount}/${emails.length} users`, data: results });
  } catch (error) {
    logger.error('Auth-prefixed Batch verify users error:', error);
    return res.status(500).json({ success: false, message: "Error verifying users", error: error.message });
  }
});

// Admin route: unlock account and reset failed logins
app.post('/api/admin/unlock-account', async (req, res) => {
  try {
    const { email } = req.body;
    const internalKey = req.headers['x-internal-key'] || req.query.key;
    if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const User = require('./models/User');
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
    return res.status(500).json({ success: false, message: 'Error unlocking account', error: error.message });
  }
});

// Removed temporary job proxy routes; API Gateway should route to job-service

// Removed temporary user/dashboard endpoints; API Gateway should route to user-service

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "Auth Service",
    status: "OK",
    timestamp: new Date().toISOString(),
    endpoints: {
      login: "/api/auth/login",
      register: "/api/auth/register",
      verify: "/api/auth/verify"
    }
  });
});

// Readiness and liveness endpoints
app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection?.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
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

// Backward compatibility: also mount auth routes at `/auth`
app.use("/auth", authRoutes);

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
  process.exit(1);
}

// Connect to MongoDB only
connectDB()
  .then(() => {
    logger.info("✅ Auth Service connected to MongoDB");
    
    // Error logging middleware (must be last)
    app.use(createErrorLogger(logger));

    // Start the server after DB is ready
    app.listen(PORT, () => {
      logger.info(`🚀 Auth Service running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🗄️ Database: MongoDB (kelmah_platform)`);
    });
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
