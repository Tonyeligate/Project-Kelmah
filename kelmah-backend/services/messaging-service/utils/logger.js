/**
 * Self-contained Logger Utility for Messaging Service
 * Provides winston-based logging without external dependencies
 */

const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, level, message, service, userId, requestId, ...meta }) => {
      let logObject = {
        timestamp,
        level: level.toUpperCase(),
        message,
        service: service || "messaging-service",
      };

      if (userId) logObject.userId = userId;
      if (requestId) logObject.requestId = requestId;

      // Add any additional metadata
      if (Object.keys(meta).length > 0) {
        logObject.meta = meta;
      }

      return JSON.stringify(logObject);
    },
  ),
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "messaging-service",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    // File transports
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
} else {
  // Add console transport for production but without colors
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

/**
 * Create a child logger with service-specific metadata
 */
const createLogger = (serviceName = "messaging-service") => {
  return logger.child({ service: serviceName });
};

/**
 * Create HTTP request logger middleware
 */
const createHttpLogger = () => {
  return (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (...args) {
      const duration = Date.now() - start;

      logger.info("HTTP Response", {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });

      originalEnd.apply(this, args);
    };

    next();
  };
};

/**
 * Create error logger middleware
 */
const createErrorLogger = () => {
  return (err, req, res, next) => {
    logger.error("HTTP Error", {
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
    });

    next(err);
  };
};

/**
 * Setup global error handlers
 */
const setupGlobalErrorHandlers = (serviceLogger = logger) => {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    serviceLogger.error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
    });

    // Give time for logs to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    serviceLogger.error("Unhandled Promise Rejection", {
      reason: reason,
      promise: promise,
    });
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    serviceLogger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    serviceLogger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
  });
};

module.exports = {
  logger,
  createLogger,
  createHttpLogger,
  createErrorLogger,
  setupGlobalErrorHandlers,
};
