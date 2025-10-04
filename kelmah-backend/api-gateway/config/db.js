/**
 * Database Configuration - MongoDB Only
 * API Gateway Database Connection for User Authentication
 */

const mongoose = require('mongoose');
// Fail fast on DB unavailability: do not buffer model operations when disconnected
try { mongoose.set('bufferCommands', false); } catch (_) {}
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection options
const options = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 15000,
  family: 4 // Use IPv4, skip trying IPv6
};

// Get MongoDB connection string from environment variables
const getConnectionString = () => {
  // Priority order for MongoDB URI
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  if (process.env.GATEWAY_MONGO_URI) {
    return process.env.GATEWAY_MONGO_URI;
  }
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb')) {
    return process.env.DATABASE_URL;
  }
  
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
    const connectionString = getConnectionString();
    
    // Connect to MongoDB with specific database name
    const conn = await mongoose.connect(connectionString, {
      ...options,
      dbName: 'kelmah_platform' // Ensure we're using the correct database
    });
    
    console.log(`✅ API Gateway connected to MongoDB: ${conn.connection.host}`);
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
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('🔍 Connection string check - ensure MONGODB_URI is set correctly');
    

    // In production, we normally exit if database connection fails.
    // Allow override via ALLOW_START_WITHOUT_DB=true to keep service alive for health checks and warmup.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_START_WITHOUT_DB !== 'true') {
      console.error('🚨 Production environment requires database connection');
      process.exit(1);
    }
    
    throw error;
  }
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
  mongoose 
};
