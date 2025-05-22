/**
 * Configuration Index
 * Central configuration for the messaging service
 */

require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 5003,
  env: process.env.NODE_ENV || 'development',
  
  // Database configuration (if needed in multiple places)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'kelmah_messaging',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',')
  },
  
  // Socket.io configuration
  socket: {
    path: process.env.SOCKET_PATH || '/socket.io',
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || '*',
    // Optional redis adapter configuration
    redis: {
      enabled: process.env.REDIS_ENABLED === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || ''
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/messaging-service.log'
  },
  
  // Other services
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:5002'
  },
  
  // Message configuration
  messages: {
    maxAttachmentSize: parseInt(process.env.MAX_ATTACHMENT_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedAttachmentTypes: (process.env.ALLOWED_ATTACHMENT_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH, 10) || 2000,
    defaultPaginationLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT, 10) || 50,
    enableEncryption: process.env.ENABLE_MESSAGE_ENCRYPTION === 'true' || false
  }
}; 