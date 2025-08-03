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
const { connectDB, sequelize } = require("./config/db");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import routes
const authRoutes = require("./routes/auth.routes");

// Initialize express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('../../shared/logger');

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

// Admin routes for development/testing
app.post("/api/admin/verify-user", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user by email
    const User = require("./models").User;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Force verify the user
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
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
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        message: "Emails array is required"
      });
    }

    const User = require("./models").User;
    const results = [];

    for (const email of emails) {
      try {
        const user = await User.findOne({ where: { email } });
        
        if (user) {
          user.isEmailVerified = true;
          user.emailVerificationToken = null;
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

// Temporary job proxy routes until proper deployment is fixed
app.all("/api/jobs*", async (req, res) => {
  try {
    // Return mock job data for now
    if (req.method === 'GET' && req.path === '/api/jobs') {
      return res.json({
        success: true,
        message: "Jobs retrieved successfully",
        data: [
          {
            id: '1',
            title: 'Bathroom Renovation',
            description: 'Need a full bathroom renovation including new tiles, toilet, sink, and shower installation.',
            location: 'Accra, Ghana',
            budget: { min: 3500, max: 5000, currency: 'GHS' },
            postedDate: '2023-11-05',
            deadline: '2023-11-20',
            status: 'open',
            skills: ['Plumbing', 'Tiling', 'Electrical'],
            hirerRating: 4.7,
            distance: 3.2
          },
          {
            id: '2',
            title: 'Kitchen Cabinet Installation',
            description: 'Install new kitchen cabinets and countertops.',
            location: 'Kumasi, Ghana',
            budget: { min: 2000, max: 3000, currency: 'GHS' },
            postedDate: '2023-11-06',
            deadline: '2023-11-25',
            status: 'open',
            skills: ['Carpentry', 'Installation'],
            hirerRating: 4.5,
            distance: 5.1
          }
        ],
        meta: {
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            itemsPerPage: 10
          }
        }
      });
    }
    
    // For other job endpoints, return appropriate responses
    res.json({
      success: true,
      message: "Endpoint temporarily available with mock data - job service deployment in progress",
      data: null
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// User/Dashboard endpoints
app.all("/api/users*", async (req, res) => {
  try {
    // Dashboard metrics
    if (req.method === 'GET' && req.path === '/api/users/dashboard/metrics') {
      return res.json({
        success: true,
        data: {
          totalJobs: 156,
          activeWorkers: 89,
          completedProjects: 67,
          totalRevenue: 45000,
          avgRating: 4.7,
          responseTime: '2.3 hours'
        }
      });
    }
    
    // Dashboard workers
    if (req.method === 'GET' && req.path === '/api/users/dashboard/workers') {
      return res.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'Kwame Asante',
            skill: 'Plumbing',
            rating: 4.8,
            status: 'available',
            location: 'Accra'
          },
          {
            id: '2',
            name: 'Akosua Mensah',
            skill: 'Electrical',
            rating: 4.9,
            status: 'busy',
            location: 'Kumasi'
          }
        ]
      });
    }
    
    // Dashboard analytics  
    if (req.method === 'GET' && req.path === '/api/users/dashboard/analytics') {
      return res.json({
        success: true,
        data: {
          jobsThisMonth: 23,
          revenueGrowth: 15.6,
          workerGrowth: 8.2,
          customerSatisfaction: 4.7
        }
      });
    }
    
    // User credentials
    if (req.method === 'GET' && req.path === '/api/users/me/credentials') {
      return res.json({
        success: true,
        data: {
          skills: [
            { id: '1', name: 'Plumbing', level: 'Expert', verified: true },
            { id: '2', name: 'Electrical', level: 'Intermediate', verified: false }
          ],
          licenses: [
            { id: '1', name: 'Ghana Plumbing License', issuer: 'Ghana Standards Authority', verified: true }
          ]
        }
      });
    }
    
    // User availability
    if (req.method === 'GET' && req.path === '/api/users/me/availability') {
      return res.json({
        success: true,
        data: {
          availability: {
            status: 'available',
            workingHours: {
              monday: { start: '08:00', end: '17:00' },
              tuesday: { start: '08:00', end: '17:00' },
              wednesday: { start: '08:00', end: '17:00' },
              thursday: { start: '08:00', end: '17:00' },
              friday: { start: '08:00', end: '17:00' },
              saturday: { start: '09:00', end: '15:00' },
              sunday: { start: null, end: null }
            }
          }
        }
      });
    }
    
    // User profile GET
    if (req.method === 'GET' && req.path === '/api/users/profile' || req.path === '/api/users/me/profile') {
      return res.json({
        success: true,
        data: {
          id: 'temp-user-123',
          firstName: 'Test',
          lastName: 'User', 
          email: 'test@example.com',
          phone: '+233123456789',
          role: 'worker',
          bio: 'Experienced professional with multiple skills',
          profilePicture: null,
          skills: ['Plumbing', 'Electrical', 'Carpentry'],
          city: 'Accra',
          country: 'Ghana',
          rating: 4.5,
          completedProjects: 15,
          isEmailVerified: true
        }
      });
    }
    
    // User profile UPDATE
    if (req.method === 'PUT' && (req.path === '/api/users/profile' || req.path === '/api/users/me/profile')) {
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...req.body,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    // For other user endpoints, return appropriate responses
    res.json({
      success: true,
      message: "Endpoint temporarily available with mock data - user service deployment in progress",
      data: null
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

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
const requiredEnvVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error("Error: Missing required environment variables:");
  missingEnvVars.forEach((envVar) => logger.error(`- ${envVar}`));
  process.exit(1);
}

// Connect to databases (MongoDB + SQL)
Promise.all([
  connectDB(), // Mongoose MongoDB
  sequelize.authenticate(), // Sequelize SQL
])
  .then(() => {
    logger.info("MongoDB and Sequelize connections established");
    return sequelize.sync(); // Ensure SQL models are synced
  })
  .then(() => {
    logger.info("Sequelize models synced");
    // Start the server after DBs are ready
    
// Error logging middleware (must be last)
app.use(createErrorLogger(logger));

app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Database connection or sync error:", err);
    process.exit(1);
  });

module.exports = app;
