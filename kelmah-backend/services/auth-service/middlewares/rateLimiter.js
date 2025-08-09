const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

let redisClient;
function getRedisClient() {
  if (redisClient) return redisClient;
  redisClient = createClient({
    url: process.env.REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379',
    socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 1000) }
  });
  redisClient.on('error', (err) => console.error('Redis error:', err.message));
  redisClient.connect().catch((err) => console.error('Redis connect failed:', err.message));
  return redisClient;
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
  const store = useRedis
    ? new RedisStore({
        sendCommand: (...args) => getRedisClient().sendCommand(args),
        prefix: `kelmah:auth:ratelimit:${key}:`,
      })
    : undefined;

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
