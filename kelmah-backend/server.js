/**
 * Kelmah API Gateway
 * Routes requests to the appropriate microservices
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));

// Direct mock endpoints for testing hirer functionality
app.get('/api/hirer/profile', (req, res) => {
  console.log('Direct mock hirer profile endpoint called');
  res.status(200).json({
    success: true,
    data: {
      id: 'ee650194-5336-4978-9441-046dae049dc9',
      firstName: 'Sam',
      lastName: 'Gemini',
      email: 'sammy@gmail.com',
      company: 'Gemini Enterprises',
      role: 'hirer',
      jobsPosted: 5,
      activeJobs: 2,
      completedJobs: 3,
      totalSpent: 12500,
      rating: 4.8,
      country: 'United States',
      city: 'San Francisco',
      joinedDate: '2022-08-15',
      lastActive: new Date().toISOString(),
      activeWorkers: [
        { id: 1, name: 'John Doe', jobTitle: 'Web Developer', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', startDate: '2023-01-15' },
        { id: 2, name: 'Jane Smith', jobTitle: 'UX Designer', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', startDate: '2023-02-20' },
      ],
      recentActivity: [
        { 
          title: 'Posted a new job', 
          description: 'Full Stack Developer needed', 
          date: '2023-03-01', 
          icon: 'work', 
          color: 'primary.main' 
        },
        { 
          title: 'Hired new talent', 
          description: 'Mark Johnson for UI/UX project', 
          date: '2023-02-28', 
          icon: 'person', 
          color: 'success.main' 
        }
      ]
    }
  });
});

app.get('/api/hirer/jobs', (req, res) => {
  console.log('Direct mock hirer jobs endpoint called with status:', req.query.status);
  const status = req.query.status || 'active';
  
  const jobsData = {
    active: [
      {
        id: 'job-001',
        title: 'Full Stack Developer',
        description: 'Looking for a skilled full stack developer for a 3-month project',
        skills: ['React', 'Node.js', 'MongoDB'],
        budget: 5000,
        postedDate: '2023-02-15',
        proposals: 12,
        status: 'active',
        duration: '3 months'
      },
      {
        id: 'job-002',
        title: 'UI/UX Designer',
        description: 'Need an experienced designer for a mobile app',
        skills: ['Figma', 'UI Design', 'Mobile Design'],
        budget: 3500,
        postedDate: '2023-02-28',
        proposals: 8,
        status: 'active',
        duration: '1 month'
      }
    ],
    completed: [
      {
        id: 'job-003',
        title: 'Backend Developer',
        description: 'Built a REST API for our e-commerce platform',
        skills: ['Java', 'Spring Boot', 'PostgreSQL'],
        budget: 4500,
        completedDate: '2023-01-20',
        status: 'completed',
        rating: 5,
        duration: '2 months'
      }
    ]
  };
  
  res.status(200).json({
    success: true,
    count: jobsData[status] ? jobsData[status].length : 0,
    data: jobsData[status] || []
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'API Gateway',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Also add a plain /health endpoint for direct checks
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'API Gateway',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Auth service proxy
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Auth service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

// Health check proxy for auth service
app.use('/api/services/auth/health', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  pathRewrite: {
    '^/api/services/auth/health': '/api/health'
  },
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Auth service health check error:', err);
    res.status(503).json({
      success: false,
      message: 'Auth service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

// User service proxy
app.use('/api/profiles', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: {
    '^/api/profiles': '/profiles'
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('User service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'User service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

app.use('/api/search', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: {
    '^/api/search': '/search'
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Search service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Search service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

app.use('/api/skills', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: {
    '^/api/skills': '/skills'
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Skills service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Skills service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

// Dashboard proxy
app.use('/api/dashboard', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: {
    '^/api/dashboard': '/dashboard'
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Dashboard proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Dashboard service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

// Job applications proxy
app.use('/api/job-applications', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: {
    '^/api/job-applications': '/job-applications'
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Job applications proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Job applications service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

// Worker profile proxy
app.use('/api/worker-profile', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: {
    '^/api/worker-profile': '/worker-profile'
  },
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Worker profile proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Worker profile service unavailable'
    });
  },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
}));

// Hirer service proxy - DISABLED: Using direct mock implementation instead
// app.use('/api/hirer', createProxyMiddleware({
//   target: USER_SERVICE_URL,
//   pathRewrite: {
//     '^/api/hirer': '/hirer'
//   },
//   changeOrigin: true,
//   onError: (err, req, res) => {
//     console.error('Hirer service proxy error:', err);
//     res.status(503).json({
//       success: false,
//       message: 'Hirer service unavailable'
//     });
//   },
//   onProxyRes: (proxyRes) => {
//     proxyRes.headers['Access-Control-Allow-Origin'] = process.env.FRONTEND_URL || 'http://localhost:5173';
//     proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
//   }
// }));

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
  console.error('Gateway error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Kelmah API Gateway running on port ${PORT}`);
});

module.exports = app; // For testing 