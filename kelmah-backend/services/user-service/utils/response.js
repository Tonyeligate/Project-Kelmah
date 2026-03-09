/**
 * Response utility functions aligned with the canonical service envelope.
 */

const buildMeta = (meta = {}) => {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const keys = Object.keys(meta);
  return keys.length > 0 ? meta : undefined;
};

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 */
function successResponse(res, statusCode = 200, message = 'Success', data = null, meta = undefined) {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  const normalizedMeta = buildMeta(meta);
  if (normalizedMeta) {
    response.meta = normalizedMeta;
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
function errorResponse(res, statusCode = 500, message = 'Internal Server Error', error = null, details = undefined) {
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (error !== null && process.env.NODE_ENV !== 'production') {
    response.error.details = error;
  } else if (details !== undefined) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array|String} errors - Validation errors
 */
function validationErrorResponse(res, errors) {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Validation failed',
      details: Array.isArray(errors) ? errors : [errors],
    },
  });
}

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {String} message - Success message
 */
function paginatedResponse(res, items, pagination = {}, message = 'Success', extraData = {}) {
  const normalizedPagination = {
    page: Number(pagination.page) || 1,
    limit: Number(pagination.limit) || 10,
    total: Number(pagination.total) || 0,
    pages:
      Number(pagination.pages) ||
      Math.ceil((Number(pagination.total) || 0) / (Number(pagination.limit) || 10)) ||
      1,
  };

  return successResponse(
    res,
    200,
    message,
    {
      ...extraData,
      items: Array.isArray(items) ? items : [],
      pagination: normalizedPagination,
    },
    { pagination: normalizedPagination },
  );
}

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse
};

