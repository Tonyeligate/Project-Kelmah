/**
 * Authentication Service
 * Handles authentication-related business logic
 */

const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const config = require('../config');

/**
 * Generate JWT tokens for authentication
 * @param {Object} user - User object
 * @returns {Object} Access and refresh tokens
 */
exports.generateAuthTokens = (user) => {
  // Create payload for JWT
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  // Generate access token
  const accessToken = jwt.sign(
    payload,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - Secret key
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Generate a new access token
 * @param {Object} payload - Token payload
 * @returns {string} Access token
 */
exports.generateAccessToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES });
};

/**
 * Verify a refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token payload
 */
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Find user by refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object>} User object
 */
exports.getUserByRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({
    where: { token, isRevoked: false }
  });

  if (!refreshToken) {
    throw new Error('Invalid refresh token');
  }

  // Check if token is expired
  if (refreshToken.expiresAt < new Date()) {
    throw new Error('Refresh token expired');
  }

  // Find user
  const user = await User.findByPk(refreshToken.userId);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Revoke refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<boolean>} Success status
 */
exports.revokeRefreshToken = async (token) => {
  const result = await RefreshToken.update(
    { isRevoked: true },
    { where: { token } }
  );

  return result[0] > 0;
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
exports.revokeAllRefreshTokens = async (userId) => {
  const result = await RefreshToken.update(
    { isRevoked: true },
    { where: { userId } }
  );

  return result[0] > 0;
}; 