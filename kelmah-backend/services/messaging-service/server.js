/**
 * Messaging Service Server
 * Real-time messaging with Socket.IO integration
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import components
const MessageSocketHandler = require('./socket/messageSocket');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const uploadRoutes = require('./routes/upload.routes');

// Import middleware
const authMiddleware = require('./middleware/auth');
const { createHttpLogger, createErrorLogger } = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

const PORT = process.env.MESSAGING_SERVICE_PORT || 3005;

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(createHttpLogger());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Initialize Socket.IO message handler
const messageSocketHandler = new MessageSocketHandler(io);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    service: 'messaging-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    websocket: {
      connected_users: messageSocketHandler.getOnlineUsersCount(),
      status: 'operational'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  res.status(200).json(healthStatus);
});

// API Routes with authentication
app.use('/api/conversations', authMiddleware, conversationRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);

// Socket.IO status endpoint
app.get('/api/socket/status', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userStatus = messageSocketHandler.getUserStatus(userId);
  
  res.json({
    success: true,
    data: {
      userId,
      status: userStatus,
      onlineUsers: messageSocketHandler.getOnlineUsersCount(),
      connected: userStatus !== 'offline'
    }
  });
});

// Send message to user via API (for system messages)
app.post('/api/socket/send-to-user', authMiddleware, (req, res) => {
  try {
    const { userId, event, data } = req.body;
    
    if (!userId || !event || !data) {
      return res.status(400).json({
        success: false,
        message: 'userId, event, and data are required'
      });
    }

    const sent = messageSocketHandler.sendToUser(userId, event, data);
    
    res.json({
      success: true,
      message: sent ? 'Message sent successfully' : 'User is offline',
      data: { delivered: sent }
    });

  } catch (error) {
    console.error('Send to user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Broadcast message to all users (admin only)
app.post('/api/socket/broadcast', authMiddleware, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({
        success: false,
        message: 'event and data are required'
      });
    }

    messageSocketHandler.broadcast(event, data);
    
    res.json({
      success: true,
      message: 'Broadcast sent successfully',
      data: { 
        recipients: messageSocketHandler.getOnlineUsersCount(),
        event,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast message'
    });
  }
});

// WebSocket metrics endpoint
app.get('/api/socket/metrics', authMiddleware, (req, res) => {
  try {
    // Only allow admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      connections: {
        total: messageSocketHandler.getOnlineUsersCount(),
        by_status: {
          online: 0,
          away: 0,
          busy: 0
        }
      },
      server: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        cpu: process.cpuUsage()
      },
      socket_io: {
        engine_version: require('socket.io/package.json').version,
        transport_types: ['websocket', 'polling'],
        ping_timeout: 60000,
        ping_interval: 25000
      }
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics'
    });
  }
});

// Error handling for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Messaging service endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    service: 'messaging-service'
  });
});

// Global error handler
app.use(createErrorLogger());

// Socket.IO error handling
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', {
    reason: err.reason,
    description: err.description,
    context: err.context,
    type: err.type
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close Socket.IO server
  io.close(() => {
    console.log('Socket.IO server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Messaging Service running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time messaging`);
  console.log(`💬 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Socket metrics: http://localhost:${PORT}/api/socket/metrics`);
  console.log(`🔗 CORS origins: ${process.env.ALLOWED_ORIGINS || 'localhost:5173, localhost:3000'}`);
});

// Export for testing
module.exports = { app, server, io, messageSocketHandler };