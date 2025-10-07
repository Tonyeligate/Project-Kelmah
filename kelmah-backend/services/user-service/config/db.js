/**
 * User Service Database Configuration - MongoDB Only
 * Updated to use MongoDB as the primary database for Kelmah Platform
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let connectPromise = null;
const DEFAULT_READY_TIMEOUT_MS = Number(process.env.DB_READY_TIMEOUT_MS || 15000);

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
    
    console.log(`✅ User Service connected to MongoDB: ${conn.connection.host}`);
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
    
    return conn;
  } catch (error) {
    connectPromise = null;
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('🔍 Connection string check - ensure MONGODB_URI is set correctly');
    
    // In production, we should exit if database connection fails
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production environment requires database connection');
      process.exit(1);
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
}; 