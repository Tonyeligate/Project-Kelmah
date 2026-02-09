/**
 * Response utility functions for consistent API responses
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 */
function successResponse(res, statusCode = 200, message = 'Success', data = null) {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {*} error - Error details (optional)
 */
function errorResponse(res, statusCode = 500, message = 'Internal Server Error', error = null) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (error !== null && process.env.NODE_ENV !== 'production') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array|String} errors - Validation errors
 */
function validationErrorResponse(res, errors) {
  const response = {
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  };

  return res.status(400).json(response);
}

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {String} message - Success message
 */
function paginatedResponse(res, data, pagination = {}, message = 'Success') {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      pages: pagination.pages || Math.ceil((pagination.total || 0) / (pagination.limit || 10))
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
}

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse
};

