const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Service locations
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const JOB_SERVICE = process.env.JOB_SERVICE_URL || 'http://localhost:5003';
const MESSAGING_SERVICE = process.env.MESSAGING_SERVICE_URL || 'http://localhost:5004';
const REVIEW_SERVICE = process.env.REVIEW_SERVICE_URL || 'http://localhost:5005';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';

// Proxy middleware options
const proxyOptions = {
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/',
    '^/api/users': '/',
    '^/api/jobs': '/',
    '^/api/messages': '/',
    '^/api/reviews': '/',
    '^/api/notifications': '/',
  },
};

// Proxy routes
app.use('/api/auth', createProxyMiddleware({ ...proxyOptions, target: AUTH_SERVICE }));
app.use('/api/users', createProxyMiddleware({ ...proxyOptions, target: USER_SERVICE }));
app.use('/api/jobs', createProxyMiddleware({ ...proxyOptions, target: JOB_SERVICE }));
app.use('/api/messages', createProxyMiddleware({ ...proxyOptions, target: MESSAGING_SERVICE }));
app.use('/api/reviews', createProxyMiddleware({ ...proxyOptions, target: REVIEW_SERVICE }));
app.use('/api/notifications', createProxyMiddleware({ ...proxyOptions, target: NOTIFICATION_SERVICE }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app; 