/**
 * Encryption Utility
 * Provides tools for encrypting and decrypting messages
 */

const crypto = require('crypto');
const logger = require('./logger');
const config = require('../config');

/**
 * Generate a random encryption key
 * @param {number} length - Key length in bytes
 * @returns {string} Base64 encoded key
 */
exports.generateKey = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

/**
 * Encrypt a message using the service key
 * This is for transport-level encryption only (not end-to-end)
 * @param {string} message - Message to encrypt
 * @param {string} key - Encryption key
 * @returns {Object} Encrypted message object
 */
exports.encryptMessage = (message, key) => {
  try {
    // Use service key if not provided
    const encryptionKey = key || process.env.MESSAGE_ENCRYPTION_KEY;
    
    // If encryption is not enabled or no key, return original message
    if (!config.messages.enableEncryption || !encryptionKey) {
      return { content: message, encrypted: false };
    }
    
    // Generate initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey, 'base64'),
      iv
    );
    
    // Encrypt message
    let encrypted = cipher.update(message, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Return encrypted message with IV
    return {
      content: encrypted,
      iv: iv.toString('base64'),
      encrypted: true
    };
  } catch (error) {
    logger.error(`Encryption error: ${error.message}`);
    // On error, return original message
    return { content: message, encrypted: false };
  }
};

/**
 * Decrypt a message using the service key
 * This is for transport-level encryption only (not end-to-end)
 * @param {string} encrypted - Encrypted message
 * @param {string} iv - Initialization vector
 * @param {string} key - Encryption key
 * @returns {string} Decrypted message
 */
exports.decryptMessage = (encrypted, iv, key) => {
  try {
    // Use service key if not provided
    const encryptionKey = key || process.env.MESSAGE_ENCRYPTION_KEY;
    
    // If encryption is not enabled or no key, return encrypted message
    if (!config.messages.enableEncryption || !encryptionKey || !iv) {
      return encrypted;
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey, 'base64'),
      Buffer.from(iv, 'base64')
    );
    
    // Decrypt message
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    // On error, return encrypted message
    return encrypted;
  }
};

/**
 * Hash a string using SHA-256
 * Useful for message integrity verification
 * @param {string} data - Data to hash
 * @returns {string} SHA-256 hash
 */
exports.hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Verify a message's integrity using its hash
 * @param {string} message - Original message
 * @param {string} hash - SHA-256 hash to verify against
 * @returns {boolean} Whether the hash matches
 */
exports.verifyMessageIntegrity = (message, hash) => {
  const calculatedHash = this.hashData(message);
  return calculatedHash === hash;
}; 