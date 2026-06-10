/**
 * Database Configuration
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
};

// Get connection string from environment variables
const getConnectionString = () => {
  // Use single connection URL if provided
  if (process.env.AUTH_MONGO_URI) {
    return process.env.AUTH_MONGO_URI;
  }
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  // Fallback to legacy individual credentials
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '27017';
  const dbName = process.env.DB_NAME || 'kelmah';
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  
  if (dbUser && dbPassword) {
    return `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }
  
  return `mongodb://${dbHost}:${dbPort}/${dbName}`;
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const connectionString = getConnectionString();
    const conn = await mongoose.connect(connectionString, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Continuing without MongoDB connection. Some features may not work.');
  }
};

module.exports = { connectDB }; 