/**
 * API Gateway Request Validation Middleware
 * Validates requests before forwarding to services
 */

const crypto = require('crypto');

/**
 * Validate payment requests
 */
const validatePayment = (req, res, next) => {
  // Skip validation for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  const { amount, currency, method } = req.body;
  
  // Validate required fields
  if (!amount || !currency) {
    return res.status(400).json({
      success: false,
      message: 'Amount and currency are required',
      code: 'PAYMENT_VALIDATION_ERROR'
    });
  }
  
  // Validate amount
  if (isNaN(amount) || amount <= 0 || amount > 1000000) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount',
      code: 'INVALID_AMOUNT'
    });
  }
  
  // Validate currency
  if (!['GHS', 'USD', 'EUR'].includes(currency)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported currency',
      code: 'UNSUPPORTED_CURRENCY'
    });
  }
  
  // Validate payment method if provided
  if (method && !['mobile_money', 'card', 'bank_transfer', 'wallet'].includes(method)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method',
      code: 'INVALID_PAYMENT_METHOD'
    });
  }
  
  next();
};

/**
 * Validate webhook requests
 *
 * NOTE: The primary Stripe / Paystack / QuickJobs webhook routes are now
 * mounted BEFORE the body parser in server.js so that raw bytes are
 * preserved for HMAC signature verification.  This middleware is kept as
 * a fallback validator for any other webhook traffic that still flows
 * through the generic /api/webhooks mount.
 */
const validateWebhook = (req, res, next) => {
  // Check provider-specific signature headers first, then generic ones
  const signature =
    req.headers['stripe-signature'] ||
    req.headers['x-paystack-signature'] ||
    req.headers['x-webhook-signature'] ||
    req.headers['x-signature'];
  const timestamp = req.headers['x-webhook-timestamp'] || req.headers['timestamp'];

  // Allow webhooks without signature in development
  if (process.env.NODE_ENV === 'development' && !signature) {
    return next();
  }

  if (!signature) {
    return res.status(401).json({
      success: false,
      message: 'Webhook signature required',
      code: 'MISSING_SIGNATURE'
    });
  }

  // Validate timestamp to prevent replay attacks (generic webhooks only;
  // Stripe and Paystack use their own timestamp mechanisms inside their SDKs)
  if (timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp);

    if (Math.abs(now - webhookTime) > 300) { // 5 minutes tolerance
      return res.status(401).json({
        success: false,
        message: 'Webhook timestamp too old',
        code: 'TIMESTAMP_TOO_OLD'
      });
    }
  }

  // NOTE: Do NOT set req.rawBody = JSON.stringify(req.body) here.
  // Re-serialising a parsed object produces different bytes than the
  // original payload, which breaks HMAC signature verification.
  // The raw-body routes mounted before the body parser handle this.

  next();
};

/**
 * Validate file upload requests
 */
const validateFileUpload = (req, res, next) => {
  const contentType = req.headers['content-type'];
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  // Check content type
  if (!contentType || !contentType.startsWith('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid content type for file upload',
      code: 'INVALID_CONTENT_TYPE'
    });
  }
  
  // Check file size (10MB limit)
  if (contentLength > 10 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      code: 'FILE_TOO_LARGE',
      maxSize: '10MB'
    });
  }
  
  next();
};

/**
 * Validate API version
 */
const validateApiVersion = (req, res, next) => {
  const apiVersion = req.headers['api-version'] || req.query.version || 'v1';
  const supportedVersions = ['v1', 'v2'];
  
  if (!supportedVersions.includes(apiVersion)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported API version',
      code: 'UNSUPPORTED_VERSION',
      supportedVersions
    });
  }
  
  req.apiVersion = apiVersion;
  next();
};

/**
 * Validate request rate based on user tier
 */
const validateUserTier = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  const userTier = req.user.tier || 'basic';
  const tierLimits = {
    basic: 100,
    premium: 500,
    enterprise: 1000
  };
  
  // This would integrate with a rate limiting service
  // For now, just add tier info to request
  req.userTier = userTier;
  req.tierLimit = tierLimits[userTier];
  
  next();
};

/**
 * Sanitize request data
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = value.trim().substring(0, 1000); // Limit length
      }
    }
  }
  
  // Sanitize body (basic)
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  next();
};

/**
 * Helper function to sanitize object recursively
 */
function sanitizeObject(obj, depth = 0) {
  if (depth > 10) return; // Prevent deep recursion
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      obj[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObject(value, depth + 1);
    }
  }
}

/**
 * CORS preflight handler
 */
const handleCors = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Per-user tier rate limiter shim – expects upstream Redis limiter for enforcement
 */
const enforceTierLimits = (limits = { basic: 100, premium: 500, enterprise: 1000 }) => {
  return (req, res, next) => {
    // When combined with Redis, this would check counters by req.user.id and tier
    // Here we just tag the request for downstream limiters/metrics
    if (req.user) {
      const userTier = req.user.tier || 'basic';
      req.userTier = userTier;
      req.tierLimit = limits[userTier] || limits.basic;
    }
    next();
  };
};

module.exports = {
  validatePayment,
  validateWebhook,
  validateFileUpload,
  validateApiVersion,
  validateUserTier,
  sanitizeRequest,
  handleCors,
  enforceTierLimits
};