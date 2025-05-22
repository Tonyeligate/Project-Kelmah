/**
 * Two-Factor Authentication Middleware
 * Handles 2FA validation for protected routes
 */

const User = require('../models/user.model');
const { AppError } = require('../utils/app-error');
const twoFactorUtil = require('../utils/two-factor');
const logger = require('../utils/logger');

/**
 * Validate 2FA token for users with 2FA enabled
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.requireTwoFactor = async (req, res, next) => {
  try {
    // Skip if user is not authenticated yet
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Find user
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Skip if 2FA is not enabled for this user
    if (!user.isTwoFactorEnabled) {
      return next();
    }

    const { mfaToken } = req.body;

    // Check if 2FA token is provided
    if (!mfaToken) {
      return next(new AppError('Two-factor authentication token required', 403, { requireMfa: true }));
    }

    // Verify 2FA token
    const isValid = twoFactorUtil.verifyToken({
      secret: user.twoFactorSecret,
      token: mfaToken
    });

    if (!isValid) {
      return next(new AppError('Invalid two-factor authentication token', 403, { requireMfa: true }));
    }

    // Token is valid, continue
    next();
  } catch (error) {
    logger.error(`2FA middleware error: ${error.message}`);
    return next(new AppError('Two-factor authentication failed', 500));
  }
};

/**
 * Force 2FA for specific roles
 * @param {Array} roles - Array of roles that require 2FA
 * @returns {Function} Express middleware
 */
exports.enforceTwoFactorForRoles = (roles = ['admin']) => {
  return async (req, res, next) => {
    try {
      // Skip if user is not authenticated yet
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Skip if user's role doesn't require 2FA
      if (!roles.includes(req.user.role)) {
        return next();
      }

      // Find user
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Check if 2FA is enabled
      if (!user.isTwoFactorEnabled) {
        return next(new AppError('Two-factor authentication is required for your role', 403, { setupMfa: true }));
      }

      // If 2FA is enabled, proceed to 2FA validation
      return exports.requireTwoFactor(req, res, next);
    } catch (error) {
      logger.error(`2FA role enforcement error: ${error.message}`);
      return next(new AppError('Two-factor authentication check failed', 500));
    }
  };
}; 