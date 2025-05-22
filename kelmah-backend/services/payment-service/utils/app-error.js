/**
 * AppError Class
 * Custom error class for handling operational errors
 */

class AppError extends Error {
  /**
   * AppError constructor
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether the error is operational or programming
   * @param {string} errorCode - Optional error code for client reference
   */
  constructor(message, statusCode, isOperational = true, errorCode = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    
    // Add stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory method to create a validation error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @returns {AppError} - AppError instance
   */
  static validationError(message, errorCode = 'VALIDATION_ERROR') {
    return new AppError(message, 400, true, errorCode);
  }

  /**
   * Factory method to create an unauthorized error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @returns {AppError} - AppError instance
   */
  static unauthorizedError(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, true, errorCode);
  }

  /**
   * Factory method to create a forbidden error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @returns {AppError} - AppError instance
   */
  static forbiddenError(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, true, errorCode);
  }

  /**
   * Factory method to create a not found error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @returns {AppError} - AppError instance
   */
  static notFoundError(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, true, errorCode);
  }

  /**
   * Factory method to create a conflict error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @returns {AppError} - AppError instance
   */
  static conflictError(message, errorCode = 'CONFLICT') {
    return new AppError(message, 409, true, errorCode);
  }

  /**
   * Factory method to create a rate limit error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @returns {AppError} - AppError instance
   */
  static rateLimitError(message = 'Too many requests', errorCode = 'RATE_LIMIT_EXCEEDED') {
    return new AppError(message, 429, true, errorCode);
  }

  /**
   * Factory method to create a server error
   * @param {string} message - Error message
   * @param {string} errorCode - Optional error code
   * @param {boolean} isOperational - Whether the error is operational
   * @returns {AppError} - AppError instance
   */
  static serverError(message = 'Internal server error', errorCode = 'SERVER_ERROR', isOperational = false) {
    return new AppError(message, 500, isOperational, errorCode);
  }

  /**
   * Factory method to create a payment error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Payment-specific error code
   * @returns {AppError} - AppError instance
   */
  static paymentError(message, statusCode = 400, errorCode = 'PAYMENT_ERROR') {
    return new AppError(message, statusCode, true, errorCode);
  }

  /**
   * Convert error to a JSON-friendly format
   * @returns {Object} - JSON representation of error
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
      errorCode: this.errorCode,
      isOperational: this.isOperational,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

module.exports = AppError; 