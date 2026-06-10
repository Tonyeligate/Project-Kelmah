/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const NODE_ENV = process.env.NODE_ENV;

// Generic error handler
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);
  
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for ${field} field`;
  }
  
  // Mongoose ObjectId casting error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Create error response
  const errorResponse = {
    success: false,
    message,
  };
  
  // Add stack trace in development environment
  if (NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * Create custom error with status code and message
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @returns {Error} - Custom error object
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle 404 errors (routes that don't exist)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Not found - ${req.originalUrl}`
  });
};

module.exports = { errorHandler, AppError, notFound }; 