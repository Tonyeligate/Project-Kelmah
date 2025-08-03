/**
 * API Gateway Server
 * Central entry point for all client requests
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const axios = require('axios');
const client = require('prom-client');

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 5000;

// Service URLs configuration
const serviceUrls = {
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  JOB_SERVICE: process.env.JOB_SERVICE_URL || 'http://localhost:5003',
  MESSAGING_SERVICE: process.env.MESSAGING_SERVICE_URL || 'http://localhost:5004',
  PAYMENT_SERVICE: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005',
  MONOLITH_SERVICE: process.env.MONOLITH_SERVICE_URL || 'http://localhost:5000'
};

// CORS middleware: whitelist frontend origins for cross-domain auth
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://kelmah-frontend-cyan.vercel.app', // Current production frontend
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://kelmah-frontend-mu.vercel.app', // Legacy URL for compatibility
      process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app'
    ].filter(Boolean);
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('dev'));

// Parse JSON requests - MUST be before any routes
app.use(express.json({ 
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
      console.log('Raw body:', req.rawBody);
    }
  }
}));

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && 
      (req.path.includes('/api/auth/login') || req.path.includes('/api/auth/register'))) {
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
  }
  next();
});

// Lightweight authentication middleware - validates tokens via auth-service
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Validate token with auth-service
    const response = await axios.post(`${serviceUrls.AUTH_SERVICE}/api/auth/validate`, 
      { token },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'X-Internal-Request': process.env.INTERNAL_API_KEY || 'internal-key'
        }
      }
    );

    if (!response.data || !response.data.valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user info from auth-service response
    req.user = response.data.user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle auth service being down
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'Authentication service unavailable'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API Gateway is running' });
});

// Proxy auth-service endpoints
app.all('/api/auth/*', async (req, res) => {
  try {
    const path = req.path.replace(/^\/api\/auth/, '');
    const url = `${serviceUrls.AUTH_SERVICE}/api/auth${path}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization })
      },
      params: req.query,
      data: req.body,
      withCredentials: true
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy user-service endpoints
app.all('/api/users/*', authenticate, async (req, res) => {
  try {
    const path = req.path.replace(/^\/api\/users/, '');
    const url = `${serviceUrls.USER_SERVICE}/api/users${path}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy worker endpoints to user-service
app.all('/api/workers*', authenticate, async (req, res) => {
  try {
    const url = `${serviceUrls.USER_SERVICE}${req.path}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy hirer endpoints to user-service
app.all('/api/hirers*', authenticate, async (req, res) => {
  try {
    const url = `${serviceUrls.USER_SERVICE}${req.path}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kelmah Platform API Gateway',
    services: ['auth', 'user', 'job', 'messaging'],
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development'
  });
});

// Proxy job endpoints to job-service
app.all('/api/jobs*', async (req, res) => {
  try {
    const url = `${serviceUrls.JOB_SERVICE}${req.path}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization })
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy messaging-service endpoints
app.all('/api/messages/*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/api\/messages/, '');
    const url = `${serviceUrls.MESSAGING_SERVICE}/api/messages${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/api/conversations/*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/api\/conversations/, '');
    const url = `${serviceUrls.MESSAGING_SERVICE}/api/conversations${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy payment-service endpoints
app.all('/api/payments/*', authenticate, async (req, res) => {
  try {
    // Strip the /api/payments prefix and map to specific payment-service routes
    const rawPath = req.path.replace(/^\/api\/payments/, '');
    const targetPath = rawPath.replace(/^\/methods/, '/payment-methods');
    const url = `${serviceUrls.PAYMENT_SERVICE}/api${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy monolithic backend for notifications, profiles, search, and settings
app.all('/notifications*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/notifications/, '');
    const url = `${serviceUrls.MONOLITH_SERVICE}/api/notifications${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/profile*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/profile/, '');
    const url = `${serviceUrls.MONOLITH_SERVICE}/api/profile${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/search*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/search/, '');
    const url = `${serviceUrls.MONOLITH_SERVICE}/api/search${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization })
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.all('/settings*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/settings/, '');
    const url = `${serviceUrls.MONOLITH_SERVICE}/api/settings${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Proxy monolithic backend for dashboard endpoints
app.all('/api/dashboard*', authenticate, async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\/api\/dashboard/, '');
    const url = `${serviceUrls.MONOLITH_SERVICE}/api/dashboard${targetPath}`;
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      params: req.query,
      data: req.body
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: 'Server error',
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
