/**
 * Payment Service for Kelmah Platform
 * Handles wallet operations, payment processing, and integrations with payment providers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

// Load environment variables
dotenv.config();

// Import routes
const routes = require('./routes');

// Initialize express app
const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 5003;

// Set up logging
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Import logger
const { logger } = require('./utils/logger');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Database connection
db.sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection established successfully.');
    return db.sequelize.sync({ force: false, alter: process.env.DB_SYNC_ALTER === 'true' });
  })
  .then(() => {
    logger.info('Database synchronized successfully.');
  })
  .catch((err) => {
    logger.error('Error connecting to database:', err);
  });

// Routes
app.use('/payment', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Payment Service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Payment service error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Payment service running on port ${PORT}`);
});

module.exports = app; // For testing 