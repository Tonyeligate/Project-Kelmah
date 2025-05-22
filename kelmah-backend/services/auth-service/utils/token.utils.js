/**
 * Token Utilities
 * Enhanced JWT token management for auth service
 */

const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

/**
 * Create a JWT access token
 * @param {Object} payload - User data to include in token
 * @param {String} expiresIn - Token expiration (default from env or 1 day)
 * @returns {String} JWT token
 */
const createAccessToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      {
        expiresIn: process.env.JWT_EXPIRATION || '1d',
      }
    );
  } catch (error) {
    logger.error('Error creating access token:', error);
    throw new Error('Failed to create access token');
  }
};

/**
 * Create a refresh token
 * @param {Object} payload - Minimal user data (typically just ID)
 * @returns {String} JWT refresh token
 */
const createRefreshToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'your_refresh_jwt_secret_key_here',
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
      }
    );
  } catch (error) {
    logger.error('Error creating refresh token:', error);
    throw new Error('Failed to create refresh token');
  }
};

/**
 * Verify a JWT token
 * @param {String} token - Token to verify
 * @param {String} secret - Secret key for verification
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret || 'your_jwt_secret_key_here');
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Verify a refresh token
 * @param {String} token - Refresh token to verify
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyRefreshToken = (token) => {
  return verifyToken(
    token, 
    process.env.JWT_REFRESH_SECRET || 'your_refresh_jwt_secret_key_here'
  );
};

/**
 * Extract token from authorization header
 * @param {String} authHeader - Authorization header
 * @returns {String|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

/**
 * Generate a temporary token (for email verification, password reset, etc.)
 * @param {Object} payload - Data to include in token
 * @param {String} expiresIn - Token expiration (default 1 hour)
 * @returns {String} JWT token
 */
const createTemporaryToken = (payload, expiresIn = '1h') => {
  try {
    return jwt.sign(
      payload,
      process.env.JWT_TEMP_SECRET || process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn }
    );
  } catch (error) {
    logger.error('Error creating temporary token:', error);
    throw new Error('Failed to create temporary token');
  }
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  createTemporaryToken
}; 