/**
 * OTP Utility
 * Generates one-time passcodes for verification
 */

exports.generateOTP = () => {
  // Generate a 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}; 