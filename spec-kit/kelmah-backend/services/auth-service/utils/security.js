/**
 * Security Utilities for Kelmah Authentication Service
 * Enhanced security measures and validation
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const { logger } = require('./logger');

class SecurityUtils {
  /**
   * Enhanced password validation with complexity requirements
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    // Minimum length
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    // Maximum length (prevent DoS)
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    // Uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Common password check
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    )) {
      errors.push('Password contains common words or patterns');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      score: this.calculatePasswordStrength(password)
    };
  }
  
  /**
   * Calculate password strength score (0-100)
   * @param {string} password - Password to score
   * @returns {number} Strength score
   */
  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 4, 50);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Complexity bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeating characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Secure password hashing with salt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = 14; // Increased from typical 12 for better security
    return await bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  
  /**
   * Generate cryptographically secure random token
   * @param {number} length - Token length in bytes (default 32)
   * @returns {string} Hex token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Generate CSRF token
   * @returns {string} CSRF token
   */
  static generateCSRFToken() {
    return crypto.randomBytes(32).toString('base64url');
  }
  
  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @param {string} expected - Expected token
   * @returns {boolean} Validation result
   */
  static validateCSRFToken(token, expected) {
    if (!token || !expected) return false;
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expected)
    );
  }
  
  /**
   * Generate 2FA secret for user
   * @param {string} userEmail - User email
   * @param {string} serviceName - Service name
   * @returns {Object} 2FA setup data
   */
  static generate2FASecret(userEmail, serviceName = 'Kelmah') {
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${userEmail})`,
      issuer: serviceName,
      length: 32
    });
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes: this.generateBackupCodes()
    };
  }
  
  /**
   * Verify 2FA token
   * @param {string} token - 6-digit token
   * @param {string} secret - Base32 secret
   * @returns {boolean} Verification result
   */
  static verify2FAToken(token, secret) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps tolerance
    });
  }
  
  /**
   * Generate backup codes for 2FA
   * @returns {Array<string>} Backup codes
   */
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
  
  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - User input
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  /**
   * Validate phone number (international format)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Validation result
   */
  static validatePhone(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (7-15 digits)
    return cleaned.length >= 7 && cleaned.length <= 15;
  }
  
  /**
   * Check if IP address is suspicious
   * @param {string} ip - IP address
   * @returns {Promise<boolean>} Suspicion result
   */
  static async isSuspiciousIP(ip) {
    // Basic IP validation
    if (!ip || ip === '127.0.0.1' || ip === '::1') return false;
    
    // Check against known malicious IP lists (implement with external service)
    // For now, return false - in production, integrate with threat intelligence
    return false;
  }
  
  /**
   * Generate JWT payload with security claims
   * @param {Object} user - User object
   * @param {Object} options - Additional options
   * @returns {Object} JWT payload
   */
  static createJWTPayload(user, options = {}) {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      // Standard claims
      sub: user.id, // Subject
      iat: now, // Issued at
      exp: now + (options.expiresIn || 900), // Expires in (15 minutes default)
      iss: 'kelmah-auth-service', // Issuer
      aud: 'kelmah-platform', // Audience
      
      // Custom claims
      email: user.email,
      role: user.role,
      version: user.tokenVersion || 1,
      
      // Security claims
      jti: crypto.randomUUID(), // JWT ID for tracking
      device: options.deviceFingerprint,
      ip: options.ipAddress
    };
  }
  
  /**
   * Constant-time string comparison to prevent timing attacks
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} Comparison result
   */
  static constantTimeEquals(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  
  /**
   * Rate limiting check helper
   * @param {string} key - Rate limit key
   * @param {number} maxAttempts - Maximum attempts
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit status
   */
  static checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    // This is a basic implementation - in production, use Redis
    const now = Date.now();
    const attempts = global.rateLimitStore?.[key] || [];
    
    // Clean old attempts
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    const isLimited = validAttempts.length >= maxAttempts;
    const resetTime = validAttempts.length > 0 ? 
      Math.max(...validAttempts) + windowMs : now;
    
    if (!isLimited) {
      // Store this attempt
      global.rateLimitStore = global.rateLimitStore || {};
      global.rateLimitStore[key] = [...validAttempts, now];
    }
    
    return {
      isLimited,
      remainingAttempts: Math.max(0, maxAttempts - validAttempts.length),
      resetTime: new Date(resetTime),
      retryAfter: isLimited ? Math.ceil((resetTime - now) / 1000) : 0
    };
  }
}

module.exports = SecurityUtils;