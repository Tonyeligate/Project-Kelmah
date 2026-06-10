/**
 * API Gateway Error Handling Middleware
 * Centralized error handling and response formatting
 */

/**
 * Create error handling middleware
 */
const createErrorHandler = (logger) => {
  return (err, req, res, next) => {
    // Log the error
    logger.error('Gateway error occurred', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
      userId: req.user?.id,
      ip: req.ip
    });
    
    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    
    // Handle specific error types
    if (err.code === 'ECONNREFUSED') {
      statusCode = 503;
      message = 'Service unavailable';
      code = 'SERVICE_UNAVAILABLE';
    } else if (err.code === 'ENOTFOUND') {
      statusCode = 503;
      message = 'Service not found';
      code = 'SERVICE_NOT_FOUND';
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
      statusCode = 504;
      message = 'Gateway timeout';
      code = 'GATEWAY_TIMEOUT';
    } else if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Request validation failed';
      code = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized access';
      code = 'UNAUTHORIZED';
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      message = 'Forbidden access';
      code = 'FORBIDDEN';
    } else if (err.statusCode) {
      statusCode = err.statusCode;
      message = err.message;
      code = err.code || 'HTTP_ERROR';
    }
    
    // Don't expose internal errors in production (default to production-safe)
    const isDevMode = process.env.NODE_ENV === 'development';
    if (!isDevMode && statusCode === 500) {
      message = 'An unexpected error occurred';
    }
    
    // Send error response — only include stack traces in explicit development mode
    res.status(statusCode).json({
      success: false,
      message,
      code,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      ...(isDevMode && {
        stack: err.stack,
        details: err.details
      })
    });
  };
};

module.exports = createErrorHandler;