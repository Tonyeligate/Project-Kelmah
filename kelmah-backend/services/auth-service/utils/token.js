/**
 * Token Utility
 * Handles token generation and management
 */

const crypto = require('crypto');
const { AppError } = require('./app-error');
const logger = require('./logger');
const config = require('../config');

class TokenUtil {
  /**
   * Generate a random token
   * @param {number} length - Token length
   * @returns {string} Generated token
   */
  generate(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      logger.error(`Failed to generate token: ${error.message}`);
      throw new AppError('Failed to generate token', 500);
    }
  }

  /**
   * Generate a verification token
   * @returns {Object} Token and expiry
   */
  generateVerificationToken() {
    const token = this.generate();
    const expires = new Date(Date.now() + config.verification.tokenExpiry);
    return { token, expires };
  }

  /**
   * Generate a password reset token
   * @returns {Object} Token and expiry
   */
  generatePasswordResetToken() {
    const token = this.generate();
    const expires = new Date(Date.now() + config.verification.passwordResetExpiry);
    return { token, expires };
  }

  /**
   * Generate a session token
   * @returns {Object} Token and expiry
   */
  generateSessionToken() {
    const token = this.generate();
    const expires = new Date(Date.now() + config.session.expiry);
    return { token, expires };
  }

  /**
   * Generate a refresh token
   * @returns {Object} Token and expiry
   */
  generateRefreshToken() {
    const token = this.generate();
    const expires = new Date(Date.now() + config.jwt.refreshExpiry);
    return { token, expires };
  }

  /**
   * Generate a device token
   * @returns {Object} Token and expiry
   */
  generateDeviceToken() {
    const token = this.generate();
    const expires = new Date(Date.now() + config.jwt.deviceExpiry);
    return { token, expires };
  }

  /**
   * Generate a recovery token
   * @returns {Object} Token and expiry
   */
  generateRecoveryToken() {
    const token = this.generate();
    const expires = new Date(Date.now() + config.verification.recoveryExpiry);
    return { token, expires };
  }

  /**
   * Generate a backup code
   * @returns {string} Backup code
   */
  generateBackupCode() {
    return this.generate(8).toUpperCase();
  }

  /**
   * Generate a recovery code
   * @returns {string} Recovery code
   */
  generateRecoveryCode() {
    return this.generate(16).toUpperCase();
  }

  /**
   * Hash a token
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  hash(token) {
    try {
      return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    } catch (error) {
      logger.error(`Failed to hash token: ${error.message}`);
      throw new AppError('Failed to hash token', 500);
    }
  }

  /**
   * Verify a token
   * @param {string} token - Token to verify
   * @param {string} hash - Hash to compare against
   * @returns {boolean} Whether the token matches
   */
  verify(token, hash) {
    try {
      const tokenHash = this.hash(token);
      return crypto.timingSafeEqual(
        Buffer.from(tokenHash),
        Buffer.from(hash)
      );
    } catch (error) {
      logger.error(`Failed to verify token: ${error.message}`);
      throw new AppError('Failed to verify token', 500);
    }
  }

  /**
   * Check if a token is expired
   * @param {Date} expiry - Token expiry date
   * @returns {boolean} Whether the token is expired
   */
  isExpired(expiry) {
    return Date.now() > expiry.getTime();
  }

  /**
   * Format token for display
   * @param {string} token - Token to format
   * @returns {string} Formatted token
   */
  format(token) {
    return token.match(/.{1,4}/g).join('-');
  }

  /**
   * Generate a secure random string
   * @param {number} length - String length
   * @returns {string} Generated string
   */
  generateSecureString(length = 32) {
    try {
      return crypto
        .randomBytes(length)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, length);
    } catch (error) {
      logger.error(`Failed to generate secure string: ${error.message}`);
      throw new AppError('Failed to generate secure string', 500);
    }
  }

  /**
   * Generate a device fingerprint
   * @param {Object} deviceInfo - Device information
   * @returns {string} Device fingerprint
   */
  generateDeviceFingerprint(deviceInfo) {
    try {
      // Ensure deviceInfo is valid before stringifying
      const safeDeviceInfo = deviceInfo || {};
      
      // Create a simplified device info object with only essential properties
      const simplifiedInfo = {
        browser: safeDeviceInfo.browser?.name || 'unknown',
        os: safeDeviceInfo.os?.name || 'unknown',
        device: safeDeviceInfo.device?.type || 'unknown'
      };
      
      const fingerprint = JSON.stringify(simplifiedInfo);
      return crypto
        .createHash('sha256')
        .update(fingerprint)
        .digest('hex');
    } catch (error) {
      logger.error(`Failed to generate device fingerprint: ${error.message}`);
      // Return a fallback fingerprint instead of throwing an error
      return crypto
        .createHash('sha256')
        .update('unknown-device')
        .digest('hex');
    }
  }
}

module.exports = new TokenUtil(); 