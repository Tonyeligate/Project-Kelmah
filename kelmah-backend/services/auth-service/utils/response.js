/**
 * Response Utilities
 * Standardized response formats for the API
 */

/**
 * Create a success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const successResponse = (
  res,
  statusCode = 200,
  message = "Success",
  data = null,
  meta = null,
) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create an error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Array} errors - Detailed error information
 */
const errorResponse = (
  res,
  statusCode = 500,
  message = "Server Error",
  errors = null,
) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a paginated response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Response data
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 */
const paginatedResponse = (
  res,
  statusCode = 200,
  message = "Success",
  data,
  page,
  limit,
  total,
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return successResponse(res, statusCode, message, data, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
