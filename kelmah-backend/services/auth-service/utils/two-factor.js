/**
 * Two-Factor Authentication Utility
 * Handles 2FA operations using speakeasy
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { AppError } = require('./app-error');
const logger = require('./logger');

class TwoFactorAuth {
  /**
   * Generate a new 2FA secret
   * @returns {Object} 2FA secret and QR code
   */
  generateSecret() {
    try {
      const secret = speakeasy.generateSecret({
        length: 20,
        name: 'Kelmah',
        issuer: 'Kelmah Platform'
      });

      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
      };
    } catch (error) {
      logger.error(`Failed to generate 2FA secret: ${error.message}`);
      throw new AppError('Failed to generate 2FA secret', 500);
    }
  }

  /**
   * Generate QR code for 2FA setup
   * @param {string} otpauthUrl - OTP auth URL
   * @returns {Promise<string>} QR code data URL
   */
  async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      logger.error(`Failed to generate QR code: ${error.message}`);
      throw new AppError('Failed to generate QR code', 500);
    }
  }

  /**
   * Verify a 2FA token
   * @param {Object} options - Verification options
   * @param {string} options.secret - 2FA secret
   * @param {string} options.token - Token to verify
   * @returns {boolean} Whether the token is valid
   */
  verifyToken({ secret, token }) {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1 // Allow 30 seconds clock drift
      });
    } catch (error) {
      logger.error(`Failed to verify 2FA token: ${error.message}`);
      throw new AppError('Failed to verify 2FA token', 500);
    }
  }

  /**
   * Generate backup codes
   * @param {number} count - Number of backup codes to generate
   * @returns {string[]} Array of backup codes
   */
  generateBackupCodes(count = 8) {
    try {
      const codes = [];
      for (let i = 0; i < count; i++) {
        codes.push(speakeasy.generateSecret({ length: 10 }).base32);
      }
      return codes;
    } catch (error) {
      logger.error(`Failed to generate backup codes: ${error.message}`);
      throw new AppError('Failed to generate backup codes', 500);
    }
  }

  /**
   * Verify a backup code
   * @param {string} code - Backup code to verify
   * @param {string[]} validCodes - Array of valid backup codes
   * @returns {boolean} Whether the code is valid
   */
  verifyBackupCode(code, validCodes) {
    return validCodes.includes(code);
  }

  /**
   * Remove a used backup code
   * @param {string} code - Used backup code
   * @param {string[]} validCodes - Array of valid backup codes
   * @returns {string[]} Updated array of valid backup codes
   */
  removeBackupCode(code, validCodes) {
    return validCodes.filter(c => c !== code);
  }

  /**
   * Format backup codes for display
   * @param {string[]} codes - Array of backup codes
   * @returns {string} Formatted backup codes
   */
  formatBackupCodes(codes) {
    return codes.map((code, index) => `${index + 1}. ${code}`).join('\n');
  }

  /**
   * Generate a recovery code
   * @returns {string} Recovery code
   */
  generateRecoveryCode() {
    try {
      return speakeasy.generateSecret({ length: 16 }).base32;
    } catch (error) {
      logger.error(`Failed to generate recovery code: ${error.message}`);
      throw new AppError('Failed to generate recovery code', 500);
    }
  }

  /**
   * Verify a recovery code
   * @param {string} code - Recovery code to verify
   * @param {string} validCode - Valid recovery code
   * @returns {boolean} Whether the code is valid
   */
  verifyRecoveryCode(code, validCode) {
    return code === validCode;
  }
}

module.exports = new TwoFactorAuth(); 