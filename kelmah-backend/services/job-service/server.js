/**
 * Job Service
 * Handles job postings, applications, and job-related operations
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('../../src/config');
const { notFound } = require('../../src/utils/errorTypes');

// Import routes
const jobRoutes = require('./routes/job.routes');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Job Service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Job Service API',
    version: '1.0.0',
    description: 'Job management service for the Kelmah platform',
    health: '/health'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  res.status(statusCode).json({
    success: false,
    status,
    message: err.message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.JOB_SERVICE_PORT || 5003;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Job Service running on port ${PORT}`);
  });
}

module.exports = app;
