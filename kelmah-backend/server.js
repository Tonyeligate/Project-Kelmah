/**
 * Server Entry Point
 */

const http = require('http');
const socketIo = require('socket.io');
const app = require('./src/app');
const config = require('./src/config');

// Define allowed origins for Socket.IO CORS
const allowedOrigins = [
  config.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5173'
];

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io for real-time communication
const io = socketIo(server, {
  path: '/ws',
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Import WebSocket handlers
const setupMessageSocket = require('./src/services/messaging').setupSocket;
const setupNotificationSocket = require('./src/services/notification').setupSocket;
const setupDashboardSocket = require('./src/services/dashboard').setupSocket;

// Make io instance available to routes
app.set('io', io);

// Set up WebSocket handlers
setupMessageSocket(io);
const notificationSocketHandler = setupNotificationSocket(io);
app.set('notificationSocket', notificationSocketHandler);
const dashboardSocketHandler = setupDashboardSocket(io);
app.set('dashboardSocket', dashboardSocketHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Start server
const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
}); 