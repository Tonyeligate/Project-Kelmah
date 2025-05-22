/**
 * Response utility functions for standardized API responses
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @returns {Object} Response object
 */
const success = (res, statusCode = 200, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Detailed error information
 * @returns {Object} Response object
 */
const error = (res, statusCode = 500, message = 'Internal server error', errors = null) => {
  const responseBody = {
    success: false,
    message
  };

  if (errors) {
    responseBody.errors = errors;
  }

  return res.status(statusCode).json(responseBody);
};

/**
 * Send a paginated success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Array} data - Paginated data array
 * @param {Number} total - Total number of records
 * @param {Number} page - Current page number
 * @param {Number} limit - Page size
 * @param {String} message - Success message
 * @returns {Object} Response object
 */
const paginated = (
  res,
  statusCode = 200,
  data = [],
  total = 0,
  page = 1,
  limit = 10,
  message = 'Success'
) => {
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
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Format validation errors from express-validator
 * @param {Array} errors - Express-validator errors array
 * @returns {Object} Formatted errors object
 */
const formatValidationErrors = (errors) => {
  return errors.reduce((acc, curr) => {
    const field = curr.param;
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(curr.msg);
    return acc;
  }, {});
};

module.exports = {
  success,
  error,
  paginated,
  formatValidationErrors
}; 