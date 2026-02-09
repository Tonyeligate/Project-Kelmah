/**
 * Messaging Service Server
 * Real-time messaging with Socket.IO integration
 */

// Load environment variables FIRST, before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Import components
const MessageSocketHandler = require('./socket/messageSocket');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
// const uploadRoutes = require('./routes/upload.routes'); // Check if exists

// Import middleware
const { verifyGatewayRequest } = require('../../shared/middlewares/serviceTrust');
const { createHttpLogger, createErrorLogger } = require('./utils/logger');
const { authenticate } = require('./middlewares/auth.middleware');
const authMiddleware = authenticate; // Alias for consistency

const app = express();
// Optional tracing
try { require('./utils/tracing').initTracing('messaging-service'); } catch { }
try { const monitoring = require('./utils/monitoring'); monitoring.initErrorMonitoring('messaging-service'); monitoring.initTracing('messaging-service'); } catch { }
const server = http.createServer(app);

// ✅ ADDED: Trust proxy for production deployment (Render, Heroku, etc.)
// This fixes the "X-Forwarded-For header is set but trust proxy is false" error
app.set('trust proxy', true);

// CORS configuration (env-driven allowlist + Vercel previews + LocalTunnel)
const envAllow = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  ...envAllow,
  // Allow all LocalTunnel URLs for development
  /^https:\/\/.*\.loca\.lt$/,
  // Allow specific LocalTunnel URL if set
  process.env.LOCALTUNNEL_URL,
].filter(Boolean);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
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

// Fail-fast for required secrets
try {
  const { requireEnv } = require('../../shared/utils/envValidator');
  if (process.env.NODE_ENV === 'production') {
    requireEnv(['JWT_SECRET', 'MONGODB_URI'], 'messaging-service');
  } else if (!process.env.JWT_SECRET) {
    console.error('Messaging Service missing JWT_SECRET. Exiting.');
    process.exit(1);
  }
} catch { }

const PORT = process.env.PORT || process.env.MESSAGING_SERVICE_PORT || 5005;

// MongoDB Connection Setup
const connectDB = async () => {
  try {
    const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah-messaging';

    const conn = await mongoose.connect(mongoUri, {
      bufferCommands: false,
      // Fix: Enhanced MongoDB connection settings to prevent buffering timeouts
      serverSelectionTimeoutMS: 60000, // Increased to 60 seconds for Render cold starts
      socketTimeoutMS: 120000, // Increased to 2 minutes
      connectTimeoutMS: 60000, // 1 minute connection timeout
      maxPoolSize: 15, // Increased pool size
      minPoolSize: 3, // Higher minimum pool
      maxIdleTimeMS: 60000, // Longer idle time
      waitQueueTimeoutMS: 30000, // Increased wait time
      retryWrites: true,
      w: 'majority',
      // Fix: Additional settings to improve connection stability
      heartbeatFrequencyMS: 10000, // More frequent heartbeat
      maxStalenessSeconds: 90, // Allow slightly stale reads
      readPreference: 'secondaryPreferred', // Distribute read load
    });

    console.info('MongoDB connected', { host: conn.connection.host, name: conn.connection.name, state: conn.connection.readyState });

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed', { message: error.message, mongoUriSet: !!process.env.DATABASE_URL, nodeEnv: process.env.NODE_ENV, service: 'messaging-service' });

    // In production, exit on connection failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    throw error;
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error', { message: err.message });
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.info('MongoDB reconnected');
});

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
  origin: function (origin, callback) {
    const vercelPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*-kelmahs-projects\.vercel\.app$/,
      /^https:\/\/project-kelmah.*\.vercel\.app$/,
      /^https:\/\/kelmah-frontend.*\.vercel\.app$/,
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || vercelPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Static serving for uploads (Note: replace with S3 in production)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware (service-scoped)
app.use(createHttpLogger(require('./utils/logger').createLogger('messaging-service')));

// Rate limiting (prefer Redis store if available via shared limiter)
try {
  const { createLimiter } = require('../../shared/middlewares/rateLimiter');
  app.use(createLimiter('default'));
} catch (_) {
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window (was 15 minutes)
    max: 100, // 100 requests per minute per IP (reasonable for messaging)
    message: { success: false, message: 'Too many requests from this IP, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

// Initialize Socket.IO message handler
const messageSocketHandler = new MessageSocketHandler(io);

// Health check endpoint
const healthCheck = (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const healthStatus = {
    status: mongoState === 1 ? 'healthy' : 'degraded',
    service: 'messaging-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    database: {
      status: mongoStates[mongoState] || 'unknown',
      connected: mongoState === 1,
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected'
    },
    websocket: {
      connected_users: messageSocketHandler.getOnlineUsersCount(),
      status: 'operational'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  const statusCode = mongoState === 1 ? 200 : 503;
  res.status(statusCode).json(healthStatus);
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck); // API Gateway compatibility

// Readiness and liveness
app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// API Routes with authentication  
app.use('/api/conversations', verifyGatewayRequest, conversationRoutes);

// Removed temporary conversation stubs; proper routes/controllers should handle these

app.use('/api/messages', verifyGatewayRequest, messageRoutes);
app.use('/api/notifications', verifyGatewayRequest, notificationRoutes);
try {
  const attachmentsRoutes = require('./routes/attachments.routes');
  app.use('/', attachmentsRoutes);
} catch (_) { }

// Socket.IO status endpoint
app.get('/api/socket/status', authenticate, (req, res) => {
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
app.post('/api/socket/send-to-user', authenticate, (req, res) => {
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
app.post('/api/socket/broadcast', authenticate, (req, res) => {
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
app.get('/api/socket/metrics', authenticate, (req, res) => {
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

// Initialize MongoDB connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    console.log('📦 MongoDB connection established');

    // Start the server after successful DB connection
    server.listen(PORT, () => {
      console.log(`🚀 Messaging Service running on port ${PORT}`);
      console.log(`📡 Socket.IO enabled for real-time messaging`);
      console.log(`💬 WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Socket metrics: http://localhost:${PORT}/api/socket/metrics`);
      console.log(`🔗 CORS origins: ${process.env.ALLOWED_ORIGINS || 'localhost:5173, localhost:3000'}`);
      console.log(`✅ Messaging Service fully initialized and ready!`);
    });

  } catch (error) {
    console.error('💥 Failed to start Messaging Service:', error);

    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Exiting due to startup failure in production');
      process.exit(1);
    } else {
      console.warn('⚠️ Starting server without MongoDB in development mode');
      server.listen(PORT, () => {
        console.log(`🚀 Messaging Service running on port ${PORT} (MongoDB connection failed)`);
        console.log(`⚠️ Some features may not work without database connection`);
      });
    }
  }
};

// Start the server
startServer();

// Export for testing
module.exports = { app, server, io, messageSocketHandler };