/**
 * JWT Utility
 * Handles token generation, verification, and refresh functionality
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { promisify } = require('util');

/**
 * Generate access token for a user
 * @param {Object} payload - User data to include in token
 * @returns {String} - JWT access token
 */
exports.generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      version: payload.tokenVersion || 0
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiry
    }
  );
};

/**
 * Generate refresh token for a user
 * @param {Object} payload - User data to include in token
 * @returns {String} - JWT refresh token
 */
exports.generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      version: payload.tokenVersion || 0
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry
    }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} - Object containing both tokens
 */
exports.generateAuthTokens = (user) => {
  const accessToken = exports.generateAccessToken(user);
  const refreshToken = exports.generateRefreshToken(user);
  
  return { accessToken, refreshToken };
};

/**
 * Verify access token
 * @param {String} token - JWT access token to verify
 * @returns {Promise<Object>} - Decoded token payload
 */
exports.verifyAccessToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, config.jwt.accessSecret);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
};

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Promise<Object>} - Decoded token payload
 */
exports.verifyRefreshToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, config.jwt.refreshSecret);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

/**
 * Extract JWT token from authorization header
 * @param {Object} req - Express request object
 * @returns {String|null} - JWT token or null if not found
 */
exports.extractTokenFromHeader = (req) => {
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Decode token without verification (useful for getting expired token info)
 * @param {String} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
exports.decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}; 