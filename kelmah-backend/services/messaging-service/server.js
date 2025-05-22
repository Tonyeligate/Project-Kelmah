/**
 * Messaging Service
 * Handles real-time messaging and conversation management
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const socketIo = require('socket.io');
const routes = require('./routes');
const sequelize = require('./config/database');
const socketHandler = require('./socket/socketHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set port
const PORT = process.env.MESSAGING_SERVICE_PORT || 5003;

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
app.use('/api/messaging', routes);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Setup Socket.io connection handlers
socketHandler.initialize(io);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { error: err });
  
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start the server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync models with database (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: process.env.DB_ALTER === 'true' });
      logger.info('Database models synchronized');
    }
    
    // Start listening
    server.listen(PORT, () => {
      logger.info(`Messaging service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start messaging service: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

// Start server
startServer(); 