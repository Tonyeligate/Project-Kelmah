/**
 * MongoDB Models Index for Job Service
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Export models
module.exports = {
  Job: require('./Job'),
  Application: require('./Application'),
  Category: require('./Category'),
  Contract: require('./Contract'),
  ContractDispute: require('./ContractDispute'),
  ContractTemplate: require('./ContractTemplate'),
  SavedJob: require('./SavedJob'),
  User: require('./User'),
  mongoose
};
