/**
 * AUTH Service Database Configuration - MongoDB Only
 * Updated to use MongoDB as the primary database for Kelmah Platform
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let connectPromise = null;
const DEFAULT_READY_TIMEOUT_MS = Number(process.env.DB_READY_TIMEOUT_MS || 15000);

const normalizeBlankPhones = async (User) => {
  const blankPhoneQueries = [
    { phone: null },
    { phone: '' },
    { phone: /^\s+$/ },
  ];

  const result = await User.collection.updateMany(
    { $or: blankPhoneQueries },
    { $unset: { phone: '' } },
  );

  if (result.modifiedCount > 0) {
    console.log(`🧼 Unset blank phone values on ${result.modifiedCount} user documents`);
  }
};

const reconcileAuthIndexes = async () => {
  try {
    const { User } = require('../models');

    await normalizeBlankPhones(User);

    let indexes = await User.collection.indexes();
    const stalePhoneIndexes = indexes.filter((index) => {
      const isPhoneOnlyIndex = index?.key?.phone === 1 && Object.keys(index.key || {}).length === 1;
      if (!isPhoneOnlyIndex) {
        return false;
      }

      return index.unique === true || index.sparse !== true;
    });

    for (const index of stalePhoneIndexes) {
      console.log(`🧹 Dropping stale phone index: ${index.name}`);
      await User.collection.dropIndex(index.name);
    }

    indexes = await User.collection.indexes();

    const hasSparsePhoneIndex = indexes.some(
      (index) =>
        index?.key?.phone === 1
        && Object.keys(index.key || {}).length === 1
        && index.sparse === true
        && index.unique !== true,
    );

    if (!hasSparsePhoneIndex) {
      console.log('🛠️ Ensuring non-unique sparse phone index exists');
      await User.collection.createIndex({ phone: 1 }, { sparse: true, name: 'phone_1' });
    }
  } catch (error) {
    console.error('⚠️ Auth index reconciliation skipped:', error.message);
  }
};

// MongoDB connection options
const options = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
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

    console.log(`✅ AUTH Service connected to MongoDB: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    await reconcileAuthIndexes();

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

    return conn;
  } catch (error) {
    connectPromise = null;

    // COMPREHENSIVE ERROR LOGGING for debugging on Render
    console.error('='.repeat(80));
    console.error('🚨 MONGODB CONNECTION FAILURE - DETAILED ERROR INFO');
    console.error('='.repeat(80));
    console.error(`📛 Error Message: ${error.message}`);
    console.error(`📛 Error Name: ${error.name}`);
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
  reconcileAuthIndexes,
}; 