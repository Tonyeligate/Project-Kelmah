/**
 * Database configuration for the authentication service
 * Uses Sequelize ORM with PostgreSQL/TimescaleDB
 */

const { Sequelize } = require('sequelize');

// Get database URL from environment variables
const dbUrl = process.env.TIMESCALE_DB_URL || 'postgres://postgres:postgres@localhost:5432/kelmah_auth';

// Create database connection
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_MODE === 'cloud' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection success status
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

/**
 * Sync database models
 * @param {boolean} force - Whether to force sync (drop tables first)
 * @returns {Promise<void>}
 */
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`Database synced${force ? ' (forced)' : ''}`);
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

// Export the sequelize instance and helper functions
module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.syncDatabase = syncDatabase; 