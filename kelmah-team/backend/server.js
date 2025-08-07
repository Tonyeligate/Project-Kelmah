const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./config/database');
const teamRoutes = require('./routes/teamRegistration');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://kelmah-team.vercel.app',
      'https://kelmah-team-nantwz8sj-kelmahs-projects.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    console.log('CORS Request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.some(allowedOrigin => origin.includes(allowedOrigin.replace('https://', '').replace('http://', '')))) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, true); // Allow all for debugging - REMOVE IN PRODUCTION
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/team', limiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Database initialization
const initializeDatabase = async () => {
  try {
    await initDatabase();
    console.log('🌟 Kelmah Team Recruitment API is ready!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/team', teamRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  
  try {
    const { pool } = require('./config/database');
    const result = await pool.query('SELECT 1');
    dbStatus = 'Connected';
  } catch (error) {
    console.error('Health check database error:', error);
    dbStatus = 'Error';
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Kelmah Team Recruitment API',
    version: '1.0.0',
    database: dbStatus
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Kelmah Team Recruitment API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/health',
      register: 'POST /api/team/register',
      applications: 'GET /api/team/applications'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Kelmah Team API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  // Initialize database
  await initializeDatabase();
});

module.exports = app;
