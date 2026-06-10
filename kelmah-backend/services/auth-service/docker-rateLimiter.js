const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

let redisClient;
let redisConnected = false;
let redisInitialized = false;
let redisConnectionAttempts = 0;
const MAX_REDIS_ATTEMPTS = 3;

function getRedisClient() {
  if (redisClient && redisConnected) return redisClient;
  if (redisInitialized && redisConnectionAttempts >= MAX_REDIS_ATTEMPTS) {
    return null;
  }
  
  try {
    if (!redisInitialized) {
      redisClient = createClient({
        url: process.env.REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379',
        socket: { 
          reconnectStrategy: (retries) => {
            if (retries > MAX_REDIS_ATTEMPTS) return false;
            return Math.min(retries * 1000, 5000);
          },
          connectTimeout: 5000
        }
      });
      
      redisClient.on('error', (err) => {
        if (redisConnectionAttempts < MAX_REDIS_ATTEMPTS) {
          console.warn('Redis connection unavailable, using memory store for rate limiting');
          redisConnectionAttempts++;
        }
        redisConnected = false;
      });
      
      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully - using distributed rate limiting');
        redisConnected = true;
        redisConnectionAttempts = 0;
      });
      
      redisClient.on('disconnect', () => {
        if (redisConnected) {
          console.log('⚠️ Redis disconnected - falling back to memory store');
        }
        redisConnected = false;
      });
      
      redisInitialized = true;
    }
    
    if (!redisConnected && redisConnectionAttempts < MAX_REDIS_ATTEMPTS) {
      redisClient.connect().catch(() => {
        redisConnected = false;
        redisConnectionAttempts++;
      });
    }
    
    return redisConnected ? redisClient : null;
  } catch (error) {
    if (redisConnectionAttempts < MAX_REDIS_ATTEMPTS) {
      console.warn('Redis not available in production environment - using memory store');
      redisConnectionAttempts = MAX_REDIS_ATTEMPTS;
    }
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

function createLimiter(key = 'default') {
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
        store = undefined;
      }
    } catch (error) {
      console.error(`Failed to create Redis store for ${key}:`, error.message);
      store = undefined;
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
}

module.exports = { createLimiter };