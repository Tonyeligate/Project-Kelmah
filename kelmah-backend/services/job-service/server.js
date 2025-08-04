/**
 * Job Service
 * Handles job postings, applications, and job-related operations
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { notFound } = require('./utils/errorTypes');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import MongoDB models and connection
const { mongoose } = require("./models");

// Import routes
const jobRoutes = require("./routes/job.routes");

// Initialize express app

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('../../shared/utils/logger');

// Create service logger
const logger = createLogger('job-service');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('job-service starting...', { 
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
app.use("/api/jobs", jobRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "Job Service",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint with API information
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Job Service API",
    version: "1.0.2", // Fixed build dependencies
    description: "Job management service for the Kelmah platform",
    health: "/health",
    endpoints: ["/api/jobs", "/api/jobs/dashboard"],
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

// Only start the server if this file is run directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      logger.info('Job Service Postgres connection established');
      return sequelize.sync();
    })
    .then(() => {
      logger.info('Job Service models synced');
  
// Error logging middleware (must be last)
app.use(createErrorLogger(logger));

app.listen(PORT, () => {
    logger.info(`Job Service running on port ${PORT}`);
      });
    })
    .catch((err) => {
      logger.error('Job Service database connection error:', err);
      process.exit(1);
  });
}

module.exports = app;
