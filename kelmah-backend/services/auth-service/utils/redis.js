/**
 * Redis Utility
 * Handles Redis operations
 */

const Redis = require('ioredis');
const { AppError } = require('./app-error');
const logger = require('./logger');
const config = require('../config');

class RedisUtil {
  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Handle Redis connection errors
    this.client.on('error', (error) => {
      logger.error(`Redis connection error: ${error.message}`);
    });

    // Handle Redis connection success
    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    // Handle Redis reconnection
    this.client.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });
  }

  /**
   * Set a key-value pair with optional expiry
   * @param {string} key - Redis key
   * @param {string|Object} value - Value to store
   * @param {number} [expiry] - Expiry time in seconds
   * @returns {Promise<void>}
   */
  async set(key, value, expiry) {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      if (expiry) {
        await this.client.set(key, stringValue, 'EX', expiry);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error(`Failed to set Redis key ${key}: ${error.message}`);
      throw new AppError('Failed to set Redis key', 500);
    }
  }

  /**
   * Get a value by key
   * @param {string} key - Redis key
   * @returns {Promise<string|Object|null>} Retrieved value
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error(`Failed to get Redis key ${key}: ${error.message}`);
      throw new AppError('Failed to get Redis key', 500);
    }
  }

  /**
   * Delete a key
   * @param {string} key - Redis key
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Failed to delete Redis key ${key}: ${error.message}`);
      throw new AppError('Failed to delete Redis key', 500);
    }
  }

  /**
   * Check if a key exists
   * @param {string} key - Redis key
   * @returns {Promise<boolean>} Whether key exists
   */
  async exists(key) {
    try {
      return await this.client.exists(key) === 1;
    } catch (error) {
      logger.error(`Failed to check Redis key ${key}: ${error.message}`);
      throw new AppError('Failed to check Redis key', 500);
    }
  }

  /**
   * Set a key's expiry time
   * @param {string} key - Redis key
   * @param {number} seconds - Expiry time in seconds
   * @returns {Promise<void>}
   */
  async expire(key, seconds) {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Failed to set expiry for Redis key ${key}: ${error.message}`);
      throw new AppError('Failed to set Redis key expiry', 500);
    }
  }

  /**
   * Get a key's remaining time to live
   * @param {string} key - Redis key
   * @returns {Promise<number>} Remaining time in seconds
   */
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Failed to get TTL for Redis key ${key}: ${error.message}`);
      throw new AppError('Failed to get Redis key TTL', 500);
    }
  }

  /**
   * Add a value to a set
   * @param {string} key - Redis key
   * @param {string} value - Value to add
   * @returns {Promise<void>}
   */
  async sadd(key, value) {
    try {
      await this.client.sadd(key, value);
    } catch (error) {
      logger.error(`Failed to add to Redis set ${key}: ${error.message}`);
      throw new AppError('Failed to add to Redis set', 500);
    }
  }

  /**
   * Remove a value from a set
   * @param {string} key - Redis key
   * @param {string} value - Value to remove
   * @returns {Promise<void>}
   */
  async srem(key, value) {
    try {
      await this.client.srem(key, value);
    } catch (error) {
      logger.error(`Failed to remove from Redis set ${key}: ${error.message}`);
      throw new AppError('Failed to remove from Redis set', 500);
    }
  }

  /**
   * Get all members of a set
   * @param {string} key - Redis key
   * @returns {Promise<string[]>} Set members
   */
  async smembers(key) {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error(`Failed to get Redis set members ${key}: ${error.message}`);
      throw new AppError('Failed to get Redis set members', 500);
    }
  }

  /**
   * Check if a value is a member of a set
   * @param {string} key - Redis key
   * @param {string} value - Value to check
   * @returns {Promise<boolean>} Whether value is a member
   */
  async sismember(key, value) {
    try {
      return await this.client.sismember(key, value) === 1;
    } catch (error) {
      logger.error(`Failed to check Redis set membership ${key}: ${error.message}`);
      throw new AppError('Failed to check Redis set membership', 500);
    }
  }

  /**
   * Get all keys matching a pattern
   * @param {string} pattern - Key pattern
   * @returns {Promise<string[]>} Matching keys
   */
  async keys(pattern) {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get Redis keys matching pattern ${pattern}: ${error.message}`);
      throw new AppError('Failed to get Redis keys', 500);
    }
  }

  /**
   * Increment a counter
   * @param {string} key - Redis key
   * @returns {Promise<number>} New counter value
   */
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Failed to increment Redis counter ${key}: ${error.message}`);
      throw new AppError('Failed to increment Redis counter', 500);
    }
  }

  /**
   * Decrement a counter
   * @param {string} key - Redis key
   * @returns {Promise<number>} New counter value
   */
  async decr(key) {
    try {
      return await this.client.decr(key);
    } catch (error) {
      logger.error(`Failed to decrement Redis counter ${key}: ${error.message}`);
      throw new AppError('Failed to decrement Redis counter', 500);
    }
  }

  /**
   * Get Redis info
   * @returns {Promise<Object>} Redis information
   */
  async info() {
    try {
      const info = await this.client.info();
      return this.parseInfo(info);
    } catch (error) {
      logger.error(`Failed to get Redis info: ${error.message}`);
      throw new AppError('Failed to get Redis info', 500);
    }
  }

  /**
   * Parse Redis info string
   * @param {string} info - Redis info string
   * @returns {Object} Parsed info
   */
  parseInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.client.quit();
      logger.info('Closed Redis connection');
    } catch (error) {
      logger.error(`Failed to close Redis connection: ${error.message}`);
      throw new AppError('Failed to close Redis connection', 500);
    }
  }
}

module.exports = new RedisUtil(); 