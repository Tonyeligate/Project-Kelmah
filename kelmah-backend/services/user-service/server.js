/**
 * User Service
 * Handles user profile management, settings, and user-related operations
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
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

const app = express();

// Middleware

// Add HTTP request logging
app.use(createHttpLogger(logger));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
// ✅ ENHANCED: CORS configuration with Vercel preview URL support
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://kelmah-frontend-cyan.vercel.app', // Current production frontend
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://kelmah-frontend-mu.vercel.app', // Legacy URL for compatibility
      process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app'
    ].filter(Boolean);
    
    // Allow all Vercel preview and deployment URLs
    const vercelPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*-kelmahs-projects\.vercel\.app$/,
      /^https:\/\/project-kelmah.*\.vercel\.app$/,
      /^https:\/\/kelmah-frontend.*\.vercel\.app$/
    ];
    
    if (!origin) return callback(null, true); // Allow no origin (mobile apps, etc.)
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // Check Vercel patterns
    const isVercelPreview = vercelPatterns.some(pattern => pattern.test(origin));
    if (isVercelPreview) {
      logger.info(`✅ User Service CORS allowed Vercel preview: ${origin}`);
      callback(null, true);
      return;
    }
    
    logger.info(`🚨 User Service CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// API routes
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);

// ✅ TEMPORARY FIX: Add contracts endpoint since job-service URL serves user-service
app.get("/api/jobs/contracts", (req, res) => {
  logger.info('📋 TEMP FIX: /api/jobs/contracts called on user-service (should be job-service)');
  
  // Enhanced mock contracts data matching job-service implementation
  const contracts = [
    {
      id: "contract-1",
      title: "Kitchen Renovation Contract",
      status: "active",
      client: "Sarah Mitchell",
      worker: "John Contractor", 
      amount: 5500,
      currency: "GHS",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      progress: 65,
      description: "Complete kitchen renovation including cabinets, countertops, and appliances",
      milestones: [
        {
          id: "milestone-1",
          title: "Demolition Complete",
          amount: 1500,
          status: "completed",
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
        },
        {
          id: "milestone-2", 
          title: "Cabinet Installation",
          amount: 2500,
          status: "in_progress", 
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
        }
      ]
    },
    {
      id: "contract-2",
      title: "Office Interior Design",
      status: "pending", 
      client: "Tech Solutions Ltd",
      worker: "Maria Designer",
      amount: 8000,
      currency: "GHS",
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28),
      progress: 0,
      description: "Modern office interior design with ergonomic workspace solutions",
      milestones: [
        {
          id: "milestone-3",
          title: "Design Approval", 
          amount: 2000,
          status: "pending",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
        }
      ]
    },
    {
      id: "contract-3",
      title: "Plumbing System Upgrade", 
      status: "completed",
      client: "Residential Complex Ltd",
      worker: "Expert Plumbers Co", 
      amount: 3200,
      currency: "GHS",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      progress: 100,
      description: "Complete plumbing system upgrade for 10-unit residential building",
      milestones: [
        {
          id: "milestone-4",
          title: "System Installation",
          amount: 3200,
          status: "completed", 
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        }
      ]
    }
  ];

  logger.info(`✅ Returning ${contracts.length} contracts from User Service (TEMP FIX)`);
  
  res.status(200).json({
    success: true,
    message: "Contracts retrieved successfully", 
    data: {
      contracts,
      meta: {
        total: contracts.length,
        service: 'user-service-temp-fix',
        actualService: 'should-be-job-service',
        timestamp: new Date().toISOString(),
        source: 'mock-data',
        note: 'DEPLOYMENT ISSUE: job-service URL serving user-service code'
      }
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "User Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint with API information and deployment verification
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
