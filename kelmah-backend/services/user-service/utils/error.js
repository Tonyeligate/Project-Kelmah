/**
 * Error handling utilities
 */

/**
 * Custom application error class
 * Extends the built-in Error class with additional properties
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler to catch errors in async route handlers
 * Eliminates the need for try/catch blocks in every route handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function that catches errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  catchAsync
}; 