/**
 * Database Ready Middleware
 * Ensures database is connected before processing requests
 */

const { ensureMongoReady, mongoose } = require('../config/db');
const { createLogger } = require('../utils/logger');

const READY_CHECK_CACHE_MS = Number(process.env.DB_READY_CACHE_MS || 3000);
const READY_TIMEOUT_MS = Number(process.env.DB_READY_TIMEOUT_MS || 15000);

const dbReadyLogger = createLogger('job-service-dbReady');

let lastHealthyCheckMs = 0;
let lastHealthyLatencyMs = 0;
let lastErrorSnapshot = null;

const respondUnavailable = (res, meta = {}) => {
  return res.status(503).json({
    success: false,
    error: {
      message: 'Database temporarily unavailable. Please retry in a moment.',
      code: 'DB_UNAVAILABLE',
      details: meta
    }
  });
};

const shouldReuseCachedStatus = () => {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }
  if (!lastHealthyCheckMs) {
    return false;
  }
  return Date.now() - lastHealthyCheckMs <= READY_CHECK_CACHE_MS;
};

const dbReady = async (req, res, next) => {
  const requestId = req.id || req.headers['x-request-id'];
  const correlationId = req.headers['x-correlation-id'];

  if (shouldReuseCachedStatus()) {
    req.mongoReady = {
      ok: true,
      cached: true,
      checkedAt: lastHealthyCheckMs,
      latencyMs: lastHealthyLatencyMs
    };
    return next();
  }

  const readyStart = Date.now();
  try {
    await ensureMongoReady({
      timeoutMs: READY_TIMEOUT_MS,
      logger: dbReadyLogger,
      context: 'middleware.dbReady',
      requestId,
      correlationId
    });

    lastHealthyCheckMs = Date.now();
    lastHealthyLatencyMs = lastHealthyCheckMs - readyStart;
    lastErrorSnapshot = null;

    dbReadyLogger.info('dbReady.pass', {
      requestId,
      correlationId,
      readyState: mongoose.connection.readyState,
      latencyMs: lastHealthyLatencyMs
    });

    req.mongoReady = {
      ok: true,
      cached: false,
      checkedAt: lastHealthyCheckMs,
      latencyMs: lastHealthyLatencyMs
    };

    return next();
  } catch (error) {
    lastErrorSnapshot = { message: error.message, name: error.name };

    dbReadyLogger.warn('dbReady.fail', {
      requestId,
      correlationId,
      readyState: mongoose.connection.readyState,
      error: error.message,
      errorName: error.name
    });

    return respondUnavailable(res, {
      reason: error.message,
      readyState: mongoose.connection.readyState,
      lastHealthyCheckMs,
      lastError: lastErrorSnapshot
    });
  }
};

module.exports = { dbReady };
