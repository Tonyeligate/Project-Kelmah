/**
 * Standardized API response utilities
 * Provides consistent response format across all microservices
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
exports.success = (res, statusCode = 200, data = null, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Detailed errors (optional)
 * @returns {Object} Response object
 */
exports.error = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

/**
 * Send a paginated response for lists of items
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Array} data - Array of items
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
exports.paginated = (res, statusCode = 200, data = [], total = 0, page = 1, limit = 10, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
};

/**
 * Format validation errors from express-validator
 * @param {Array} errors - Array of express-validator errors
 * @returns {Object} Formatted errors
 */
exports.formatValidationErrors = (errors) => {
  return errors.reduce((acc, error) => {
    acc[error.param] = error.msg;
    return acc;
  }, {});
}; 