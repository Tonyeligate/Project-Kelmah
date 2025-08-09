const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

let redisClient;
let redisConnected = false;

function getRedisClient() {
  if (redisClient && redisConnected) return redisClient;
  
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379',
      socket: { 
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
        connectTimeout: 10000
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      redisConnected = false;
    });
    
    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
      redisConnected = true;
    });
    
    redisClient.on('disconnect', () => {
      console.log('Redis disconnected');
      redisConnected = false;
    });
    
    redisClient.connect().catch((err) => {
      console.error('Redis connect failed:', err.message);
      redisConnected = false;
    });
    
    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error.message);
    redisConnected = false;
    return null;
  }
}

const LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 20 },
  register: { windowMs: 60 * 60 * 1000, max: 30 },
  emailVerification: { windowMs: 15 * 60 * 1000, max: 20 },
  default: { windowMs: 15 * 60 * 1000, max: 100 },
};

const createLimiter = (key = 'default') => {
  const cfg = LIMITS[key] || LIMITS.default;
  const useRedis = process.env.USE_REDIS_RATE_LIMIT !== 'false';
  
  let store;
  if (useRedis) {
    try {
      const client = getRedisClient();
      if (client && redisConnected) {
        store = new RedisStore({
          sendCommand: (...args) => client.sendCommand(args),
          prefix: `kelmah:auth:ratelimit:${key}:`,
        });
        console.log(`Rate limiter using Redis store for ${key}`);
      } else {
        console.warn(`Redis not available, using memory store for ${key} rate limiting`);
        store = undefined; // Will fallback to in-memory store
      }
    } catch (error) {
      console.error(`Failed to create Redis store for ${key}:`, error.message);
      store = undefined; // Fallback to in-memory store
    }
  } else {
    console.log(`Using memory store for ${key} rate limiting (Redis disabled)`);
  }

  return rateLimit({
    windowMs: cfg.windowMs,
    max: cfg.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    ...(store ? { store } : {}),
    keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  });
};

module.exports = { createLimiter };
