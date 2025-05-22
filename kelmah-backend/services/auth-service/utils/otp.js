/**
 * OTP Utilities
 * Functions for generating and validating one-time passwords
 */

const crypto = require('crypto');

/**
 * Generate a random numeric OTP of specified length
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
exports.generateOTP = (length = 6) => {
  // Generate random bytes and convert to a number
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % Math.pow(10, length);
  
  // Pad with leading zeros if necessary
  return num.toString().padStart(length, '0');
};

/**
 * Verify if an OTP is valid
 * @param {string} inputOTP - The OTP provided by the user
 * @param {string} storedOTP - The OTP stored in the system
 * @returns {boolean} - Whether the OTP is valid
 */
exports.verifyOTP = (inputOTP, storedOTP) => {
  return inputOTP === storedOTP;
};

/**
 * Check if an OTP has expired
 * @param {Date} otpExpiry - The expiry timestamp of the OTP
 * @returns {boolean} - Whether the OTP has expired
 */
exports.isOTPExpired = (otpExpiry) => {
  return new Date() > otpExpiry;
}; 