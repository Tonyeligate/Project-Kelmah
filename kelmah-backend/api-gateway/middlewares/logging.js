/**
 * API Gateway Logging Middleware
 * Structured request/response logging
 */

const { v4: uuidv4 } = require('uuid');

const getContentLength = (body) => {
  if (body === undefined || body === null) {
    return 0;
  }

  if (Buffer.isBuffer(body)) {
    return body.length;
  }

  if (typeof body === 'string') {
    return Buffer.byteLength(body);
  }

  if (typeof body === 'object') {
    try {
      return Buffer.byteLength(JSON.stringify(body));
    } catch (_) {
      return 0;
    }
  }

  return Buffer.byteLength(String(body));
};

/**
 * Create logging middleware
 */
const createLoggingMiddleware = (logger) => {
  return (req, res, next) => {
    // Generate unique request ID
    req.id = uuidv4();
    
    // Start timer
    const startTime = Date.now();
    
    // Log incoming request
    logger.info('Incoming request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      contentLength: req.headers['content-length']
    });
    
    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override response methods to log responses
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      
      logger.info('Response sent', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: getContentLength(body),
        userId: req.user?.id
      });
      
      return originalSend.call(this, body);
    };
    
    res.json = function(obj) {
      const responseTime = Date.now() - startTime;
      
      logger.info('JSON response sent', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        success: obj?.success,
        userId: req.user?.id
      });
      
      return originalJson.call(this, obj);
    };
    
    // Handle response finish
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      // Log slow requests
      if (responseTime > 1000) {
        logger.warn('Slow request detected', {
          requestId: req.id,
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime}ms`,
          statusCode: res.statusCode,
          userId: req.user?.id
        });
      }
      
      // Log error responses
      if (res.statusCode >= 400) {
        const logLevel = res.statusCode >= 500 ? 'error' : 'warn';
        
        logger[logLevel]('Error response', {
          requestId: req.id,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          userId: req.user?.id,
          ip: req.ip
        });
      }
    });
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    res.setHeader('X-Gateway', 'kelmah-api-gateway');
    
    next();
  };
};

module.exports = createLoggingMiddleware;