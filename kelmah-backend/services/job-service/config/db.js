/**
 * JOB Service Database Configuration - MongoDB Only
 * Updated to use MongoDB as the primary database for Kelmah Platform
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { ensureJobIndexes } = require('../utils/indexManager');

const connectionStateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

const emitLog = (logger, level, message, meta = {}) => {
  if (logger && typeof logger[level] === 'function') {
    logger[level](message, meta);
  }
};

const describeReadyState = (state) => connectionStateLabels[state] || 'unknown';

let connectPromise = null;
const DEFAULT_READY_TIMEOUT_MS = Number(process.env.DB_READY_TIMEOUT_MS || 15000);

// Disable Mongoose buffering completely - fail immediately if not connected
// This prevents misleading "buffering timed out" errors
mongoose.set('bufferCommands', false);
mongoose.set('autoCreate', false); // Don't auto-create collections
mongoose.set('autoIndex', false); // Don't auto-create indexes on startup

// MongoDB connection options
const options = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000, // Reduced from 10000 - fail faster if can't connect
  socketTimeoutMS: 20000, // Reduced from 45000 - faster timeout on socket issues
  connectTimeoutMS: 5000, // Added - limit initial connection time
  family: 4 // Use IPv4, skip trying IPv6
};

// Get MongoDB connection string from environment variables
const getConnectionString = () => {
  // Priority order for MongoDB URI
  if (process.env.MONGODB_URI) {
    console.log('🔗 Using MONGODB_URI from environment');
    console.log('🔗 Connection string preview:', process.env.MONGODB_URI.substring(0, 50) + '...');
    return process.env.MONGODB_URI;
  }
  if (process.env.USER_MONGO_URI) {
    console.log('🔗 Using USER_MONGO_URI from environment');
    return process.env.USER_MONGO_URI;
  }
  if (process.env.MONGO_URI) {
    console.log('🔗 Using MONGO_URI from environment');
    return process.env.MONGO_URI;
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb')) {
    console.log('🔗 Using DATABASE_URL from environment');
    return process.env.DATABASE_URL;
  }

  console.log('⚠️ No MongoDB URI environment variable found, using fallback construction');

  // Fallback to individual credentials (for local development)
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '27017';
  const dbName = process.env.DB_NAME || 'kelmah_platform';
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  let scheme = 'mongodb://';
  if (dbHost.includes('mongodb.net') || dbHost.includes('cloud.mongodb.com')) {
    scheme = 'mongodb+srv://';
  }

  if (dbUser && dbPassword) {
    return `${scheme}${dbUser}:${dbPassword}@${dbHost}/${dbName}?retryWrites=true&w=majority`;
  }

  return `${scheme}${dbHost}:${dbPort}/${dbName}`;
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (connectPromise) {
      return connectPromise;
    }

    const connectionString = getConnectionString();

    // Connect to MongoDB with specific database name
    connectPromise = mongoose.connect(connectionString, {
      ...options,
      dbName: 'kelmah_platform' // Ensure we're using the correct database
    });
    const conn = await connectPromise;

    connectPromise = null;

    console.log(`✅ JOB Service connected to MongoDB: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Ensure high-traffic indexes exist; fire-and-forget so connection isn't blocked
    ensureJobIndexes(conn).catch((indexError) => {
      console.warn('[JOB SERVICE] Failed to ensure indexes:', indexError.message);
    });

    return conn;
  } catch (error) {
    connectPromise = null;

    // COMPREHENSIVE ERROR LOGGING for debugging on Render
    console.error('=' * 80);
    console.error('🚨 MONGODB CONNECTION FAILURE - DETAILED ERROR INFO');
    console.error('='.repeat(80));
    console.error(`📛 Error Message: ${error.message}`);
    console.error(`� Error Name: ${error.name}`);
    console.error(`📛 Error Code: ${error.code || 'N/A'}`);

    if (error.reason) {
      console.error(`📛 Error Reason: ${JSON.stringify(error.reason, null, 2)}`);
    }

    console.error('\n🔍 Environment Check:');
    console.error(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.error(`  - MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
    if (process.env.MONGODB_URI) {
      const uri = process.env.MONGODB_URI;
      // Safely log connection string (hide password)
      const sanitized = uri.replace(/:[^@]+@/, ':****@');
      console.error(`  - Connection string (sanitized): ${sanitized}`);
    }

    console.error('\n🔍 Connection Options:');
    console.error(JSON.stringify(options, null, 2));

    console.error('\n🔍 Full Error Stack:');
    console.error(error.stack);

    console.error('='.repeat(80));
    console.error('END OF ERROR REPORT');
    console.error('='.repeat(80));

    // In production, we should exit if database connection fails
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production environment requires database connection');
      console.error('🚨 Service will exit in 5 seconds...');
      setTimeout(() => process.exit(1), 5000);
    }

    throw error;
  }
};

const waitForConnection = (timeoutMs = DEFAULT_READY_TIMEOUT_MS) => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  return new Promise((resolve, reject) => {
    const onConnected = () => {
      cleanup();
      resolve(mongoose.connection);
    };

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      mongoose.connection.off('connected', onConnected);
      mongoose.connection.off('error', onError);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for MongoDB connection'));
    }, timeoutMs);

    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('error', onError);
  });
};

const waitForDisconnect = (timeoutMs = DEFAULT_READY_TIMEOUT_MS) => {
  if (mongoose.connection.readyState === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onDisconnected = () => {
      cleanup();
      resolve();
    };

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      mongoose.connection.off('disconnected', onDisconnected);
      mongoose.connection.off('error', onError);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for MongoDB disconnect'));
    }, timeoutMs);

    mongoose.connection.once('disconnected', onDisconnected);
    mongoose.connection.once('error', onError);
  });
};

const ensureConnection = async ({ timeoutMs = DEFAULT_READY_TIMEOUT_MS } = {}) => {
  const state = mongoose.connection.readyState;

  if (state === 1) {
    return mongoose.connection;
  }

  if (state === 2) {
    return waitForConnection(timeoutMs);
  }

  if (state === 3) {
    await waitForDisconnect(timeoutMs);
  }

  await connectDB();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  return waitForConnection(timeoutMs);
};

const pingDatabase = async ({ timeoutMs = 3000 } = {}) => {
  const connection = mongoose.connection;
  if (!connection || !connection.db) {
    throw new Error('MongoDB database handle unavailable');
  }

  const admin = connection.db.admin && connection.db.admin();
  if (!admin || typeof admin.command !== 'function') {
    throw new Error('Mongo admin interface unavailable for ping');
  }

  let timeoutId;
  try {
    await Promise.race([
      admin.command({ ping: 1 }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Mongo ping timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  return true;
};

// Cache for last successful readiness check
let lastReadinessCheck = { timestamp: 0, successful: false };
const READINESS_CACHE_MS = 5000; // Cache readiness for 5 seconds

const ensureMongoReady = async ({
  timeoutMs = DEFAULT_READY_TIMEOUT_MS,
  logger = null,
  context = 'mongo.ensureReady',
  requestId,
  correlationId
} = {}) => {
  const startedAt = Date.now();
  const baseMeta = {
    context,
    requestId,
    correlationId,
    timeoutMs,
    readyState: describeReadyState(mongoose.connection.readyState)
  };

  // FAST PATH: If connection is ready and we verified it recently, skip all checks
  const timeSinceLastCheck = Date.now() - lastReadinessCheck.timestamp;
  if (mongoose.connection.readyState === 1 &&
    lastReadinessCheck.successful &&
    timeSinceLastCheck < READINESS_CACHE_MS) {
    emitLog(logger, 'info', 'mongo.ensureReady.cachedSuccess', {
      ...baseMeta,
      cacheAgeMs: timeSinceLastCheck,
      totalLatencyMs: Date.now() - startedAt
    });
    return mongoose.connection;
  }

  emitLog(logger, 'info', 'mongo.ensureReady.start', baseMeta);

  try {
    await ensureConnection({ timeoutMs });
  } catch (connectionError) {
    lastReadinessCheck = { timestamp: Date.now(), successful: false };
    emitLog(logger, 'warn', 'mongo.ensureReady.connectionFailed', {
      ...baseMeta,
      error: connectionError.message,
      readyState: describeReadyState(mongoose.connection.readyState)
    });
    throw connectionError;
  }

  if (mongoose.connection.readyState !== 1) {
    lastReadinessCheck = { timestamp: Date.now(), successful: false };
    const stateError = new Error('Database connection not ready');
    emitLog(logger, 'warn', 'mongo.ensureReady.invalidState', {
      ...baseMeta,
      readyState: describeReadyState(mongoose.connection.readyState)
    });
    throw stateError;
  }

  try {
    const pingStart = Date.now();
    const pingTimeout = Math.min(timeoutMs, 5000);
    await pingDatabase({ timeoutMs: pingTimeout });
    lastReadinessCheck = { timestamp: Date.now(), successful: true };
    emitLog(logger, 'info', 'mongo.ensureReady.pingSuccess', {
      ...baseMeta,
      pingLatencyMs: Date.now() - pingStart,
      readyState: describeReadyState(mongoose.connection.readyState)
    });
  } catch (pingError) {
    lastReadinessCheck = { timestamp: Date.now(), successful: false };
    emitLog(logger, 'warn', 'mongo.ensureReady.pingFailed', {
      ...baseMeta,
      error: pingError.message,
      readyState: describeReadyState(mongoose.connection.readyState)
    });
    throw pingError;
  }

  emitLog(logger, 'info', 'mongo.ensureReady.success', {
    ...baseMeta,
    readyState: describeReadyState(mongoose.connection.readyState),
    totalLatencyMs: Date.now() - startedAt
  });

  return mongoose.connection;
};

/**
 * Close MongoDB connection
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  closeDB,
  mongoose,
  ensureConnection,
  ensureMongoReady,
  pingDatabase,
}; 