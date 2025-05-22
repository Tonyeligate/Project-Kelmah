/**
 * Job Service Database Configuration
 * Configures Sequelize ORM for PostgreSQL/TimescaleDB connection
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.sequelize = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  getConfig() {
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';

    // Use TimescaleDB connection URL from environment
    const dbUrl = process.env.TIMESCALE_DB_URL;
    if (!dbUrl) {
      throw new Error('TIMESCALE_DB_URL environment variable is required');
    }

    return {
      url: dbUrl,
      dialect: 'postgres',
      logging: (msg) => logger.debug(msg),
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        min: parseInt(process.env.DB_POOL_MIN || '5'),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000')
      },
      retry: {
        match: [
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
        ],
        max: this.maxRetries
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        keepAlive: true
      },
      benchmark: true,
      hooks: {
        beforeConnect: async (config) => {
          logger.info('Attempting TimescaleDB connection...');
        },
        afterConnect: async (connection) => {
          logger.info('TimescaleDB connected successfully');
          this.retryCount = 0;
        }
      }
    };
  }

  async connect() {
    try {
      if (this.sequelize) {
        return this.sequelize;
      }

      const config = this.getConfig();
      this.sequelize = new Sequelize(config.url, config);

      await this.testConnection();
      return this.sequelize;
    } catch (error) {
      return this.handleConnectionError(error);
    }
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      logger.info('TimescaleDB connection established successfully');
      return true;
    } catch (error) {
      throw error;
    }
  }

  async handleConnectionError(error) {
    logger.error(`TimescaleDB connection error: ${error.message}`);

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info(`Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay/1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.connect();
    }

    logger.error('Max connection retries reached. Unable to connect to TimescaleDB.');
    throw new Error('Database connection failed after maximum retries');
  }

  async disconnect() {
    if (this.sequelize) {
      try {
        await this.sequelize.close();
        this.sequelize = null;
        logger.info('TimescaleDB connection closed successfully');
      } catch (error) {
        logger.error(`Error closing TimescaleDB connection: ${error.message}`);
        throw error;
      }
    }
  }

  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.sequelize;
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.sequelize) {
        return {
          status: 'error',
          message: 'Database not initialized'
        };
      }

      await this.testConnection();
      
      const poolStats = this.sequelize.connectionManager.pool.stats();
      
      return {
        status: 'healthy',
        message: 'TimescaleDB connection is healthy',
        pool: {
          total: poolStats.total,
          idle: poolStats.idle,
          used: poolStats.used
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `TimescaleDB health check failed: ${error.message}`
      };
    }
  }
  
  // Initialize hypertables for time-series data
  async initializeHypertables() {
    try {
      const sequelize = this.getSequelize();
      
      // Create hypertable for job metrics (if needed)
      await sequelize.query(`
        SELECT create_hypertable('job_metrics', 'timestamp', 
          if_not_exists => TRUE, 
          create_default_indexes => TRUE,
          chunk_time_interval => INTERVAL '1 day'
        );
      `).catch(err => {
        // Ignore if table doesn't exist yet - will be created in migrations
        if (!err.message.includes('relation "job_metrics" does not exist')) {
          throw err;
        }
      });
      
      // Create hypertable for contract activity
      await sequelize.query(`
        SELECT create_hypertable('contract_activities', 'timestamp', 
          if_not_exists => TRUE, 
          create_default_indexes => TRUE,
          chunk_time_interval => INTERVAL '1 day'
        );
      `).catch(err => {
        // Ignore if table doesn't exist yet
        if (!err.message.includes('relation "contract_activities" does not exist')) {
          throw err;
        }
      });
      
      logger.info('TimescaleDB hypertables initialized successfully');
    } catch (error) {
      logger.error(`Error initializing hypertables: ${error.message}`);
      // Don't throw here - non-blocking
    }
  }
}

// Create and export a singleton instance
const database = new Database();
module.exports = database; 