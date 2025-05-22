/**
 * Multi-Factor Authentication Utilities
 * Uses TOTP (Time-based One-Time Password) algorithm
 */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { logger } = require('./logger');

/**
 * Generate a new secret for TOTP-based authentication
 * @param {string} email - User's email for identification
 * @returns {Object} Object with secret details
 */
exports.generateSecret = (email) => {
  try {
    const appName = process.env.APP_NAME || 'Kelmah Platform';
    
    // Generate a secret using speakeasy
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${appName}:${email}`
    });
    
    return secret;
  } catch (error) {
    logger.error('Error generating MFA secret:', error);
    throw new Error('Failed to generate MFA secret');
  }
};

/**
 * Generate a QR code for easy setup with authenticator apps
 * @param {string} otpauthUrl - The OTP auth URL to encode
 * @returns {Promise<string>} Data URL of the QR code
 */
exports.generateQrCode = async (otpauthUrl) => {
  try {
    // Generate QR code as a data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP token
 * @param {string} token - The token to verify
 * @param {string} secret - The user's secret key
 * @returns {boolean} Whether the token is valid
 */
exports.verifyToken = (token, secret) => {
  try {
    // Verify the TOTP token
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 period before and after for clock drift
    });
  } catch (error) {
    logger.error('Error verifying MFA token:', error);
    return false;
  }
};

/**
 * Generate a current TOTP token (for testing/debugging)
 * @param {string} secret - The secret key
 * @returns {string} The current TOTP token
 */
exports.generateToken = (secret) => {
  try {
    return speakeasy.totp({
      secret,
      encoding: 'base32'
    });
  } catch (error) {
    logger.error('Error generating MFA token:', error);
    throw new Error('Failed to generate MFA token');
  }
}; 