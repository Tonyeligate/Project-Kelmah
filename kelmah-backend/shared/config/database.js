const mongoose = require('mongoose');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ]
});

// MongoDB connection function with retry mechanism
const connectToDatabase = async (dbUri = process.env.MONGODB_URI, options = {}) => {
  const defaultOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  const dbOptions = { ...defaultOptions, ...options };
  
  try {
    // Check for mongodb uri
    if (!dbUri) {
      throw new Error('MongoDB connection string is required');
    }
    
    const connection = await mongoose.connect(dbUri, dbOptions);
    logger.info('MongoDB connected successfully');
    
    // Setup connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    
    // Implement exponential backoff for retries
    const retryDelay = options.retryDelay || 5000;
    if (options.shouldRetry !== false) {
      logger.info(`Retrying MongoDB connection in ${retryDelay}ms...`);
      setTimeout(() => {
        connectToDatabase(dbUri, {
          ...options,
          retryDelay: Math.min(retryDelay * 1.5, 60000), // Increase delay, max 1 minute
        });
      }, retryDelay);
    } else {
      throw error; // No retry, bubble up the error
    }
  }
};

// Close database connection
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

// Export connection status checker
const isConnected = () => mongoose.connection.readyState === 1;

module.exports = {
  connectToDatabase,
  closeDatabase,
  isConnected,
  logger
}; 