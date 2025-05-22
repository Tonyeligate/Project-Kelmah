/**
 * User Service for Kelmah Platform
 * Handles user profiles, user management, and worker discovery
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const db = require('./config/database');
const logger = require('./utils/logger');
const routes = require('./routes');
// Load all models
const models = require('./models');
// Fraud detection scheduler
const { initFraudDetectionScheduler } = require('./schedulers/fraud-detection.scheduler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.USER_SERVICE_PORT || 5002;

// Ensure the logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for logging
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']
}));
app.use(helmet());
app.use(morgan('dev')); // Log to console
app.use(morgan('combined', { stream: accessLogStream })); // Log to file

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    
    if (dbHealth.status === 'healthy') {
      return res.status(200).json({
        status: 'healthy',
        message: 'User service is running',
        database: dbHealth
      });
    } else {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Service is running but database is not healthy',
        database: dbHealth
      });
    }
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Import routes
const profileRoutes = require('./routes/profile.routes');
const searchRoutes = require('./routes/search.routes');
const skillsRoutes = require('./routes/skills.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Import new worker-specific routes
const workerJobsRoutes = require('./routes/worker-jobs.routes');
const workerScheduleRoutes = require('./routes/worker-schedule.routes');
const workerVerificationRoutes = require('./routes/worker-verification.routes');

// Import hirer-specific routes
const hirerRoutes = require('./routes/hirer.routes');

// Use routes
app.use('/profiles', profileRoutes);
app.use('/search', searchRoutes);
app.use('/skills', skillsRoutes);
app.use('/dashboard', dashboardRoutes);

// Worker-specific routes
app.use('/worker/jobs', workerJobsRoutes);
app.use('/worker/schedule', workerScheduleRoutes);
app.use('/worker/verification', workerVerificationRoutes);

// Hirer-specific routes
app.use('/hirer', hirerRoutes);

// Direct routes for specific dashboard endpoints
app.use('/job-applications/worker', dashboardRoutes);
app.use('/worker-profile/skills', dashboardRoutes);
app.use('/worker-profile/assessments', dashboardRoutes);

// Direct debug endpoint for hirer to test if route is accessible
app.get('/hirer/debug', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hirer debug endpoint is accessible',
    timestamp: new Date().toISOString()
  });
});

// API Gateway compatibility - route requests based on the first part of the URL path
app.use('/', (req, res, next) => {
  const path = req.path.split('/')[1];

  if (path === 'profiles') {
    return profileRoutes(req, res, next);
  }
  if (path === 'search') {
    return searchRoutes(req, res, next);
  }
  if (path === 'skills') {
    return skillsRoutes(req, res, next);
  }
  if (path === 'dashboard') {
    return dashboardRoutes(req, res, next);
  }
  if (path === 'job-applications') {
    return dashboardRoutes(req, res, next);
  }
  if (path === 'worker-profile') {
    return dashboardRoutes(req, res, next);
  }
  
  // New worker-specific path routing
  if (path === 'worker') {
    const subPath = req.path.split('/')[2];
    
    if (subPath === 'jobs') {
      return workerJobsRoutes(req, res, next);
    }
    if (subPath === 'schedule') {
      return workerScheduleRoutes(req, res, next);
    }
    if (subPath === 'verification') {
      return workerVerificationRoutes(req, res, next);
    }
  }
  
  // Hirer-specific path routing
  if (path === 'hirer') {
    return hirerRoutes(req, res, next);
  }

  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Received shutdown signal');
  
  try {
    await db.disconnect();
    logger.info('Closed database connection');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await db.connect();
    logger.info('Database connection established');

    // Initialize fraud detection scheduler
    initFraudDetectionScheduler();
    logger.info('Fraud detection scheduler initialized');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`User service listening on port ${PORT}`);
      console.log(`Worker-specific routes available at:`);
      console.log(`  - /worker/jobs`);
      console.log(`  - /worker/schedule`);
      console.log(`  - /worker/verification`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app; // For testing 