/**
 * Main Express Application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./config/db');
const { AppError, notFound } = require('./utils/errorTypes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const config = require('./config');
const { sequelize } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/job.routes');
const contractRoutes = require('./routes/contracts');
const reviewRoutes = require('./routes/reviews');
const disputeRoutes = require('./routes/disputes');
const messagingRoutes = require('./routes/messaging');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const settingsRoutes = require('./routes/settings');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payments');
const appointmentRoutes = require('./routes/appointments');
const dashboardRoutes = require('./routes/dashboard');
const transactionRoutes = require('./routes/transactions');
const subscriptionRoutes = require('./routes/subscriptions');
const planRoutes = require('./routes/plans');
const escrowRoutes = require('./routes/escrows');
const walletRoutes = require('./routes/wallets');

// Import application controller and auth middleware
const applicationController = require('./controllers/application.controller');
const { authenticateUser, authorizeRoles } = require('./middlewares/auth');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Connect to SQL database (PostgreSQL) via Sequelize
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected successfully'))
  .then(() => sequelize.sync())
  .catch((error) => {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
// Configure CORS to allow multiple dev origins
const allowedOrigins = [
  config.FRONTEND_URL || 'http://localhost:3000',
  'https://kelmah-frontend-cyan.vercel.app',
  'http://localhost:5173'
];

// Enable CORS for allowed origins with dynamic reflection
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/escrows', escrowRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/docs', express.static(path.join(__dirname, '../docs')));

// Application endpoints
app.post('/api/jobs/:id/apply', authenticateUser, applicationController.applyToJob);
app.get('/api/jobs/:id/applications', authenticateUser, authorizeRoles(['hirer']), applicationController.getJobApplications);
app.get('/api/applications', authenticateUser, applicationController.getMyApplications);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'Kelmah API',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Kelmah API',
    version: '1.0.0',
    description: 'API for the Kelmah platform',
    documentation: '/api/docs',
    health: '/api/health'
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
    stack: config.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app; 