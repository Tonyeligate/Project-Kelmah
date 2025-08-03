/**
 * Review-service Server
 * Kelmah Platform - REVIEW SERVICE
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('../../shared/logger');

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
const PORT = process.env.PORT || 5006;

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

// Add HTTP request logging
app.use(createHttpLogger(logger));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info('Connected to MongoDB', { database: process.env.DB_NAME });
    })
    .catch((error) => {
      logger.error('MongoDB connection failed', error);
      process.exit(1);
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'review-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.get('/', (req, res) => {
  res.json({
    service: 'review-service',
    message: 'Service is running',
    version: '1.0.0'
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
    environment: process.env.NODE_ENV || 'development' 
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
