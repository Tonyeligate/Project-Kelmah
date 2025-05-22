// Import routes
const authRoutes = require('./services/auth-service/routes/auth.routes');
const userRoutes = require('./services/user-service/routes/user.routes');
const jobRoutes = require('./services/job-service/routes/job.routes');
const proposalRoutes = require('./services/proposal-service/routes/proposal.routes');
const contractRoutes = require('./services/contract-service/routes/contract.routes');
const reviewRoutes = require('./services/review-service/routes/review.routes');
const messagingRoutes = require('./services/messaging-service/routes');
const paymentRoutes = require('./services/payment-service/routes/payment.routes');
const escrowRoutes = require('./services/payment-service/routes/escrow.routes');
const skillAssessmentRoutes = require('./services/skill-assessment-service/routes/skill-assessment.routes');
const notificationRoutes = require('./services/notification-service/routes/notification.routes');

// Import WebSocket handlers
const setupMessageSocket = require('./services/messaging-service/socket/messageSocket');
const setupNotificationSocket = require('./services/user-service/socket/notificationSocket');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/skill-assessments', skillAssessmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Set up Socket.io for real-time communication
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
  path: '/ws',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io instance available to routes
app.set('io', io);

// Set up WebSocket handlers
setupMessageSocket(io);
const notificationSocketHandler = setupNotificationSocket(io);

// Make the notification socket handler available to other modules
app.set('notificationSocket', notificationSocketHandler);

// Use server.listen instead of app.listen for socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 