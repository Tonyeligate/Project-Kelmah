/**
 * Notification Service
 * Standalone server for testing notification service
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const routes = require('./routes');
const notificationSocket = require('./socket/notificationSocket');
const logger = console;

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set port
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/notifications', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Notification service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io instance available globally
global.io = io;
app.set('io', io);

// Set up Socket.io connection handlers
notificationSocket.initialize(io);

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
server.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});