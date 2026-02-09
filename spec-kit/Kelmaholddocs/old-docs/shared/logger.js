/**
 * Centralized Winston Logger Configuration
 * Shared across all Kelmah microservices
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Create custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, userId, requestId, ...meta } = info;
    
    let logMessage = `${timestamp} [${service}] ${level}: ${message}`;
    
    // Add request/user context if available
    if (requestId) logMessage += ` [req:${requestId}]`;
    if (userId) logMessage += ` [user:${userId}]`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create logger instance for a service
 * @param {string} serviceName - Name of the service
 * @param {string} logLevel - Log level (default: info)
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(serviceName, logLevel = 'info') {
  const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
  
  // Create transports array
  const transports = [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      format: consoleFormat
    })
  ];
  
  // Add file transports for production
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    // Error log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, `${serviceName}-error-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
      })
    );
    
    // Combined log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, `${serviceName}-combined-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true
      })
    );
    
    // HTTP request log file
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, `${serviceName}-http-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '7d',
        zippedArchive: true
      })
    );
  }
  
  // Create logger
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || logLevel,
    levels,
    defaultMeta: { service: serviceName },
    transports,
    exitOnError: false
  });
  
  // Add request ID and user context methods
  logger.withContext = function(context) {
    return logger.child(context);
  };
  
  logger.request = function(req, message, meta = {}) {
    return logger.http(message, {
      requestId: req.id || req.headers['x-request-id'],
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      ...meta
    });
  };
  
  logger.error = function(message, error, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    
    return winston.Logger.prototype.error.call(this, message, errorMeta);
  };
  
  return logger;
}

/**
 * Express middleware for HTTP request logging
 * @param {winston.Logger} logger - Logger instance
 * @returns {Function} Express middleware
 */
function createHttpLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();
    
    // Generate request ID if not present
    req.id = req.headers['x-request-id'] || require('crypto').randomUUID();
    res.setHeader('X-Request-Id', req.id);
    
    // Log request
    logger.request(req, `${req.method} ${req.originalUrl} - Started`);
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - start;
      
      logger.request(req, `${req.method} ${req.originalUrl} - ${res.statusCode}`, {
        statusCode: res.statusCode,
        responseTime: duration,
        contentLength: res.get('Content-Length')
      });
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

/**
 * Express error logging middleware
 * @param {winston.Logger} logger - Logger instance
 * @returns {Function} Express error middleware
 */
function createErrorLogger(logger) {
  return (err, req, res, next) => {
    // Log the error
    logger.error(`Unhandled error in ${req.method} ${req.originalUrl}`, err, {
      requestId: req.id,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next(err);
  };
}

/**
 * Global exception handlers
 * @param {winston.Logger} logger - Logger instance
 */
function setupGlobalErrorHandlers(logger) {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, { promise });
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

module.exports = {
  createLogger,
  createHttpLogger,
  createErrorLogger,
  setupGlobalErrorHandlers
};