/**
 * Error Handling Middleware
 * Processes errors and returns appropriate responses
 */
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'unauthenticated'
  });

  // Default error message
  let errorMessage = 'Internal server error';
  let statusCode = err.statusCode || 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = err.message || 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = err.message || 'Resource not found';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    errorMessage = 'Service unavailable';
  }

  // Return error response
  const response = {
    success: false,
    message: errorMessage
  };

  // Include error details in development mode
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: err.name,
      message: err.message,
      stack: err.stack
    };
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware; 