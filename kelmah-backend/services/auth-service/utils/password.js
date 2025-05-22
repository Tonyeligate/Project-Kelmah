/**
 * Password Utility
 * Handles password-related operations
 */

const bcrypt = require('bcryptjs');
const { zxcvbn } = require('zxcvbn');
const { AppError } = require('./app-error');
const logger = require('./logger');
const config = require('../config');

class PasswordUtil {
  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hash(password) {
    try {
      const salt = await bcrypt.genSalt(config.password.saltRounds);
      return bcrypt.hash(password, salt);
    } catch (error) {
      logger.error(`Failed to hash password: ${error.message}`);
      throw new AppError('Failed to hash password', 500);
    }
  }

  /**
   * Compare a password with its hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Whether the password matches
   */
  async compare(password, hash) {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      logger.error(`Failed to compare passwords: ${error.message}`);
      throw new AppError('Failed to compare passwords', 500);
    }
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} Password strength information
   */
  checkStrength(password) {
    const result = zxcvbn(password);
    const strength = {
      score: result.score,
      feedback: result.feedback.suggestions,
      warning: result.feedback.warning,
      crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
    };

    // Add custom feedback based on requirements
    const requirements = this.checkRequirements(password);
    strength.requirements = requirements;

    return strength;
  }

  /**
   * Check password requirements
   * @param {string} password - Password to check
   * @returns {Object} Requirements check results
   */
  checkRequirements(password) {
    const requirements = {
      length: password.length >= config.password.minLength,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      common: !this.isCommonPassword(password)
    };

    return requirements;
  }

  /**
   * Check if password meets all requirements
   * @param {string} password - Password to check
   * @returns {boolean} Whether all requirements are met
   */
  meetsRequirements(password) {
    const requirements = this.checkRequirements(password);
    return Object.values(requirements).every(Boolean);
  }

  /**
   * Check if password is in common passwords list
   * @param {string} password - Password to check
   * @returns {boolean} Whether password is common
   */
  isCommonPassword(password) {
    // This is a simplified check. In production, you should use a more comprehensive list
    const commonPasswords = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'football',
      'abc123',
      '111111'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Generate a random password
   * @param {Object} options - Password generation options
   * @param {number} options.length - Password length
   * @param {boolean} options.uppercase - Include uppercase letters
   * @param {boolean} options.lowercase - Include lowercase letters
   * @param {boolean} options.numbers - Include numbers
   * @param {boolean} options.special - Include special characters
   * @returns {string} Generated password
   */
  generate({
    length = 12,
    uppercase = true,
    lowercase = true,
    numbers = true,
    special = true
  } = {}) {
    const chars = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let availableChars = '';
    let password = '';

    if (uppercase) availableChars += chars.uppercase;
    if (lowercase) availableChars += chars.lowercase;
    if (numbers) availableChars += chars.numbers;
    if (special) availableChars += chars.special;

    // Ensure at least one character from each selected type
    if (uppercase) password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)];
    if (lowercase) password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)];
    if (numbers) password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
    if (special) password += chars.special[Math.floor(Math.random() * chars.special.length)];

    // Fill the rest randomly
    while (password.length < length) {
      password += availableChars[Math.floor(Math.random() * availableChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Validate password against requirements
   * @param {string} password - Password to validate
   * @throws {AppError} If password doesn't meet requirements
   */
  validate(password) {
    if (!this.meetsRequirements(password)) {
      const requirements = this.checkRequirements(password);
      const missing = Object.entries(requirements)
        .filter(([_, met]) => !met)
        .map(([req]) => req);

      throw AppError.validationError(
        `Password must meet the following requirements: ${missing.join(', ')}`
      );
    }

    const strength = this.checkStrength(password);
    if (strength.score < 3) {
      throw AppError.validationError(
        `Password is too weak. ${strength.feedback.join(' ')}`
      );
    }
  }
}

module.exports = new PasswordUtil(); 