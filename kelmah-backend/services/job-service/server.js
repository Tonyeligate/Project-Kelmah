/**
 * Job Service
 * Manages job postings, applications, contracts, and reviews
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { db } = require('./models/index');
const logger = require('./utils/logger');
const routes = require('./routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set port
const PORT = process.env.JOB_SERVICE_PORT || 5003;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/jobs', routes.jobRoutes);
app.use('/api/applications', routes.applicationRoutes);
app.use('/api/contracts', routes.contractRoutes);
app.use('/api/reviews', routes.reviewRoutes);
app.use('/api/contract-templates', routes.contractTemplateRoutes);
app.use('/api/contract-analytics', routes.contractAnalyticsRoutes);
app.use('/api/locations', routes.locationRoutes);
app.use('/api/milestones', routes.milestoneRoutes);
app.use('/api/locations', routes.locationSearchRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.healthCheck();
    
    res.status(200).json({
      status: 'success',
      message: 'Job service is healthy',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { error: err });
  
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();
    logger.info('Database connection established successfully');
    
    // Initialize TimescaleDB hypertables
    await db.initializeHypertables();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Job service running on port ${PORT}`);
    });
    
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    db.disconnect().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    }).catch(err => {
      logger.error(`Error closing database connection: ${err.message}`);
      process.exit(1);
    });
  });
  
  // Force close server after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer(); 