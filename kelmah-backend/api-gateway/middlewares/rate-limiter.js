/**
 * Rate Limiter Middleware
 * Provides rate limiting functionality for API endpoints
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

// Redis client for distributed rate limiting
let redisClient = null;

/**
 * Initialize Redis client for distributed rate limiting
 * @param {string} redisUrl - Redis connection URL
 * @returns {Promise<Redis>} Redis client
 */
const initializeRedis = async (redisUrl = process.env.REDIS_URL) => {
  if (!redisClient && redisUrl) {
    try {
      redisClient = Redis.createClient({ url: redisUrl });
      await redisClient.connect();
      console.log('[Rate Limiter] Redis connected for distributed rate limiting');
    } catch (error) {
      console.warn('[Rate Limiter] Redis connection failed, falling back to memory store:', error.message);
      redisClient = null;
    }
  }
  return redisClient;
};

/**
 * Create a rate limiter with Redis store (if available) or memory store
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
    // Custom key generator
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    // Custom skip function
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  };

  const config = { ...defaultOptions, ...options };

  // Try to use Redis store if available
  if (redisClient) {
    config.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
  }

  return rateLimit(config);
};

/**
 * Create specialized rate limiters for different endpoints
 */
const rateLimiters = {
  // General API rate limiter
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: {
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: 900
    }
  }),

  // Strict rate limiter for authentication
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 900
    },
    skipSuccessfulRequests: true
  }),

  // Job creation rate limiter
  jobCreation: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 job creations per hour
    message: {
      error: 'Job creation rate limit exceeded',
      message: 'You can only create 10 jobs per hour. Please try again later.',
      retryAfter: 3600
    }
  }),

  // Job application rate limiter
  jobApplication: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 applications per hour
    message: {
      error: 'Job application rate limit exceeded',
      message: 'You can only apply to 50 jobs per hour. Please try again later.',
      retryAfter: 3600
    }
  }),

  // Search rate limiter
  search: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
      error: 'Search rate limit exceeded',
      message: 'Too many search requests. Please wait a moment before searching again.',
      retryAfter: 60
    }
  }),

  // Messaging rate limiter
  messaging: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute
    message: {
      error: 'Messaging rate limit exceeded',
      message: 'Too many messages sent. Please wait a moment before sending another message.',
      retryAfter: 60
    }
  }),

  // Payment rate limiter
  payment: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 payment attempts per 5 minutes
    message: {
      error: 'Payment rate limit exceeded',
      message: 'Too many payment attempts. Please wait before trying again.',
      retryAfter: 300
    }
  })
};

/**
 * Get rate limiter by name
 * @param {string} name - Rate limiter name
 * @returns {Function} Rate limiter middleware
 */
const getRateLimiter = (name) => {
  return rateLimiters[name] || rateLimiters.general;
};

/**
 * Create custom rate limiter
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
const createCustomRateLimiter = (options) => {
  return createRateLimiter(options);
};

/**
 * Initialize rate limiter system
 * @param {string} redisUrl - Redis URL for distributed rate limiting
 */
const initializeRateLimiters = async (redisUrl) => {
  await initializeRedis(redisUrl);
  console.log('[Rate Limiter] Rate limiting system initialized');
};

module.exports = {
  createRateLimiter,
  createCustomRateLimiter,
  getRateLimiter,
  rateLimiters,
  initializeRateLimiters,
  initializeRedis
};
