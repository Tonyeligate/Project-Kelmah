/**
 * Database Configuration
 */

const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
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
  
  let scheme = 'mongodb://';
  if (dbHost.includes('mongodb.net') || dbHost.includes('cloud.mongodb.com')) {
    scheme = 'mongodb+srv://';
  }
  
  if (dbUser && dbPassword) {
    return `${scheme}${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }
  
  return `${scheme}${dbHost}:${dbPort}/${dbName}`;
};

// DEBUG: Log MongoDB connection string
const mongoConnString = getConnectionString();
console.log('DEBUG: MongoDB will connect with:', mongoConnString);

// Sequelize (SQL) database setup
const sqlDialect = process.env.SQL_DIALECT || 'postgres';
const sqlHost = process.env.SQL_DB_HOST || 'localhost';
const sqlPort = process.env.SQL_DB_PORT || '5432';
const sqlDbName = process.env.SQL_DB_NAME || 'kelmah';
const sqlUser = process.env.SQL_DB_USER || '';
const sqlPassword = process.env.SQL_DB_PASSWORD || '';
const getSQLConnectionString = () => {
  // Use single connection URL if provided
  if (process.env.SQL_URL) {
    return process.env.SQL_URL;
  }
  // Service-specific URLs
  if (process.env.AUTH_SQL_URL) {
    return process.env.AUTH_SQL_URL;
  }
  if (process.env.JOB_SQL_URL) {
    return process.env.JOB_SQL_URL;
  }
  if (process.env.USER_SQL_URL) {
    return process.env.USER_SQL_URL;
  }
  // Fallback to legacy individual credentials
  if (sqlUser && sqlPassword) {
    return `${sqlDialect}://${sqlUser}:${sqlPassword}@${sqlHost}:${sqlPort}/${sqlDbName}`;
  }
  return `${sqlDialect}://${sqlHost}:${sqlPort}/${sqlDbName}`;
};
// DEBUG: Log SQL connection string
const sqlConnString = getSQLConnectionString();
console.log('DEBUG: SQL will connect with:', sqlConnString);
const sequelize = new Sequelize(getSQLConnectionString(), {
  dialect: sqlDialect,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false  // For self-signed certs on Render
    }
  }
});

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

module.exports = { connectDB, sequelize }; 