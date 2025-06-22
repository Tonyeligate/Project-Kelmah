/**
 * Response Formatter Utility
 * Provides standardized response formatting for the API
 */

/**
 * Format success response
 * @param {string} message - Success message
 * @param {Object|Array} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
exports.successResponse = (message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    statusCode
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted error response
 */
exports.errorResponse = (message, errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    statusCode
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return response;
};

/**
 * Format validation error response
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message
 * @returns {Object} Formatted validation error response
 */
exports.validationErrorResponse = (errors, message = 'Validation error') => {
  return exports.errorResponse(message, errors, 400);
};

/**
 * Format paginated response
 * @param {Array} data - Response data
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
exports.paginatedResponse = (data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return exports.successResponse(message, {
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  });
};
