/**
 * Response Middleware
 * Provides consistent error handling across the application
 */

const { response } = require('../utils/response');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Global error:', err);
  
  // Default error status
  const statusCode = err.statusCode || 500;
  
  // Customize error response based on error type
  if (err.name === 'ValidationError') {
    return response.error(res, 400, 'Validation Error', err.errors);
  }
  
  if (err.name === 'JsonWebTokenError') {
    return response.error(res, 401, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return response.error(res, 401, 'Token expired');
  }
  
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = {};
    err.errors.forEach(error => {
      validationErrors[error.path] = error.message;
    });
    return response.error(res, 400, 'Database validation error', validationErrors);
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = Object.keys(err.fields).join(', ');
    return response.error(res, 409, `Duplicate entry for ${fields}`);
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return response.error(res, 400, 'Invalid reference to a related resource');
  }
  
  // Generic error response for all other errors
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message || 'Internal server error';
  
  return response.error(res, statusCode, message);
};

/**
 * Not found middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.notFound = (req, res) => {
  return response.error(res, 404, `Route not found: ${req.originalUrl}`);
};

/**
 * Rate limiter error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.rateLimitExceeded = (req, res) => {
  return response.error(res, 429, 'Too many requests, please try again later');
};

/**
 * Validation error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validationHandler = (req, res, next) => {
  const { validationErrors } = req;
  
  if (validationErrors && validationErrors.length > 0) {
    const formattedErrors = {};
    
    validationErrors.forEach(error => {
      formattedErrors[error.param] = error.msg;
    });
    
    return response.error(res, 400, 'Validation error', formattedErrors);
  }
  
  next();
}; 