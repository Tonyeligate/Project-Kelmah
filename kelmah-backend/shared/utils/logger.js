/**
 * Centralized Logger Utility
 * Structured logging for Kelmah platform
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, userId, requestId, ...meta }) => {
    let logObject = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: service || 'kelmah-backend'
    };
    
    if (userId) logObject.userId = userId;
    if (requestId) logObject.requestId = requestId;
    
    // Add any additional metadata
    if (Object.keys(meta).length > 0) {
      logObject.meta = meta;
    }
    
    return JSON.stringify(logObject);
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'kelmah-backend',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Security log file
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 20,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, userId, ipAddress, userAgent, action, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level: level.toUpperCase(),
            message,
            userId,
            ipAddress,
            userAgent,
            action,
            ...meta
          });
        })
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        let output = `${timestamp} [${service}] ${level}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          output += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return output;
      })
    )
  }));
}

// Enhanced logger with additional methods
class EnhancedLogger {
  constructor(winstonLogger) {
    this.winston = winstonLogger;
  }
  
  // Standard logging methods
  error(message, meta = {}) {
    this.winston.error(message, meta);
  }
  
  warn(message, meta = {}) {
    this.winston.warn(message, meta);
  }
  
  info(message, meta = {}) {
    this.winston.info(message, meta);
  }
  
  debug(message, meta = {}) {
    this.winston.debug(message, meta);
  }
  
  verbose(message, meta = {}) {
    this.winston.verbose(message, meta);
  }
  
  // Security-specific logging
  security(message, meta = {}) {
    this.winston.warn(message, {
      ...meta,
      category: 'security'
    });
  }
  
  // Authentication logging
  auth(action, userId, meta = {}) {
    this.winston.info(`Auth: ${action}`, {
      ...meta,
      userId,
      category: 'authentication',
      action
    });
  }
  
  // API request logging
  request(method, url, statusCode, responseTime, meta = {}) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.winston[level](`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      ...meta,
      category: 'request',
      method,
      url,
      statusCode,
      responseTime
    });
  }
  
  // Database operation logging
  database(operation, table, meta = {}) {
    this.winston.debug(`DB: ${operation} on ${table}`, {
      ...meta,
      category: 'database',
      operation,
      table
    });
  }
  
  // Payment logging (sensitive data handling)
  payment(action, amount, currency, meta = {}) {
    // Remove sensitive payment info
    const safeMeta = { ...meta };
    delete safeMeta.cardNumber;
    delete safeMeta.cvv;
    delete safeMeta.pin;
    
    this.winston.info(`Payment: ${action} ${amount} ${currency}`, {
      ...safeMeta,
      category: 'payment',
      action,
      amount,
      currency
    });
  }
  
  // Performance logging
  performance(operation, duration, meta = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    
    this.winston[level](`Performance: ${operation} took ${duration}ms`, {
      ...meta,
      category: 'performance',
      operation,
      duration
    });
  }
  
  // Business logic logging
  business(event, meta = {}) {
    this.winston.info(`Business: ${event}`, {
      ...meta,
      category: 'business',
      event
    });
  }
  
  // Error with context
  errorWithContext(error, context = {}) {
    this.winston.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
      category: 'error'
    });
  }
  
  // Structured logging for specific domains
  
  // User activity logging
  userActivity(userId, action, details = {}) {
    this.winston.info(`User activity: ${action}`, {
      ...details,
      userId,
      action,
      category: 'user-activity'
    });
  }
  
  // System health logging
  health(component, status, metrics = {}) {
    const level = status === 'healthy' ? 'info' : status === 'warning' ? 'warn' : 'error';
    
    this.winston[level](`Health: ${component} is ${status}`, {
      ...metrics,
      component,
      status,
      category: 'health'
    });
  }
  
  // Job processing logging
  job(jobType, status, meta = {}) {
    this.winston.info(`Job: ${jobType} ${status}`, {
      ...meta,
      jobType,
      status,
      category: 'job-processing'
    });
  }
  
  // External service logging
  external(service, action, status, meta = {}) {
    const level = status === 'success' ? 'info' : status === 'timeout' ? 'warn' : 'error';
    
    this.winston[level](`External: ${service} ${action} ${status}`, {
      ...meta,
      service,
      action,
      status,
      category: 'external-service'
    });
  }
  
  // Create child logger with additional context
  child(defaultMeta = {}) {
    return new EnhancedLogger(this.winston.child(defaultMeta));
  }
  
  // Timer utility
  startTimer(label) {
    const start = Date.now();
    return {
      end: (meta = {}) => {
        const duration = Date.now() - start;
        this.performance(label, duration, meta);
        return duration;
      }
    };
  }
  
  // Batch logging for high-frequency events
  batch(events) {
    events.forEach(event => {
      const { level, message, meta } = event;
      this.winston[level](message, meta);
    });
  }
  
  // Log level checking
  isLevelEnabled(level) {
    return this.winston.isLevelEnabled(level);
  }
  
  // Profiling
  profile(id) {
    this.winston.profile(id);
  }
  
  // Query logging with sanitization
  query(sql, params = [], duration = 0, meta = {}) {
    // Sanitize sensitive data from SQL and params
    const sanitizedSql = this.sanitizeSql(sql);
    const sanitizedParams = this.sanitizeParams(params);
    
    this.winston.debug('Database query executed', {
      ...meta,
      sql: sanitizedSql,
      params: sanitizedParams,
      duration,
      category: 'database-query'
    });
  }
  
  // Helper methods
  sanitizeSql(sql) {
    // Remove or mask potentially sensitive data in SQL
    return sql
      .replace(/password\s*=\s*'[^']*'/gi, "password = '***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token = '***'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret = '***'");
  }
  
  sanitizeParams(params) {
    if (!Array.isArray(params)) return params;
    
    return params.map(param => {
      if (typeof param === 'string') {
        // Mask potential passwords, tokens, etc.
        if (param.length > 20 && /^[A-Za-z0-9+/]+=*$/.test(param)) {
          return '***';
        }
      }
      return param;
    });
  }
  
  // Emergency logging (always logs regardless of level)
  emergency(message, meta = {}) {
    // Force log to console and file
    console.error(`EMERGENCY: ${message}`, meta);
    this.winston.error(`EMERGENCY: ${message}`, {
      ...meta,
      emergency: true,
      category: 'emergency'
    });
  }
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger(logger);

// Export both winston instance and enhanced logger
module.exports = enhancedLogger;
module.exports.winston = logger;