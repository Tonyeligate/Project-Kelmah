/**
 * Authentication Service
 * Main server entry point
 */

// Load environment variables early
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');

// Import utilities
const logger = require('./utils/logger');
const sequelize = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');

// Initialize Express app
const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 5002;

// Add more detailed logging for CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

console.log('Setting CORS options:', corsOptions);

// Configure middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging
app.use(logger.logRequest); // Custom request logging

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(logger.logError);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await sequelize.testConnection();
    if (!dbConnected) {
      logger.warn('Starting server without database connection. Some features may not work.');
    } else {
      // Sync database models (don't force in production)
      const forceSync = process.env.NODE_ENV === 'development' && process.env.DB_FORCE_SYNC === 'true';
      await sequelize.syncDatabase(forceSync);
    }
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`Authentication service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start authentication service:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Close database connection and server
  process.exit(0);
});

// Start the server
startServer(); 