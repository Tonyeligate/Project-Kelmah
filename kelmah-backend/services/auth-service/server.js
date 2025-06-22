/**
 * Auth Service
 * Handles authentication, authorization, and user identity management
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('../../src/config');
const { notFound } = require('./utils/errorTypes');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth.routes');

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
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Auth Service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Auth Service API',
    version: '1.0.0',
    description: 'Authentication service for the Kelmah platform',
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
const PORT = process.env.AUTH_SERVICE_PORT || 5001;

// Check for required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`- ${envVar}`));
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
