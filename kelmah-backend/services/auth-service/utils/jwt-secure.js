/**
 * Secure JWT Utilities with Token Rotation
 * Enhanced security for Kelmah platform authentication
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const { Op } = require('sequelize'); // Removed - not needed for MongoDB
const SecurityUtils = require('./security');

class SecureJWT {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    // Don't throw error in constructor - check at runtime instead
    this._validateSecrets();
  }
  
  _validateSecrets() {
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      console.error('JWT secrets not configured properly');
      console.error('JWT_SECRET:', this.accessTokenSecret ? '[set]' : '[missing]');
      console.error('JWT_REFRESH_SECRET:', this.refreshTokenSecret ? '[set]' : '[missing]');
    }
  }
  
  /**
   * Generate secure access token with enhanced claims
   * @param {Object} user - User object
   * @param {Object} context - Request context (IP, device, etc.)
   * @returns {string} Signed JWT token
   */
  generateAccessToken(user, context = {}) {
    if (!this.accessTokenSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const payload = SecurityUtils.createJWTPayload(user, {
      expiresIn: this.parseExpiry(this.accessTokenExpiry),
      deviceFingerprint: context.deviceFingerprint,
      ipAddress: context.ipAddress
    });
    
    return jwt.sign(payload, this.accessTokenSecret, {
      algorithm: 'HS256',
      issuer: 'kelmah-auth-service',
      audience: 'kelmah-platform'
    });
  }
  
  /**
   * Generate secure refresh token with rotation capability
   * @param {Object} user - User object
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Token data including hash for storage
   */
  async generateRefreshToken(user, context = {}) {
    if (!this.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    
    const tokenId = crypto.randomUUID();
    const rawToken = crypto.randomBytes(64).toString('hex');
    
    const payload = {
      sub: user.id,
      jti: tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.refreshTokenExpiry),
      iss: 'kelmah-auth-service',
      aud: 'kelmah-platform',
      version: user.tokenVersion || 1,
      type: 'refresh'
    };
    
    const signedToken = jwt.sign(payload, this.refreshTokenSecret, {
      algorithm: 'HS256'
    });
    
    // Create composite token: signed_jwt.raw_token
    const compositeToken = `${signedToken}.${rawToken}`;
    
    // Hash the raw token for database storage
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    
    return {
      token: compositeToken,
      tokenId,
      tokenHash,
      expiresAt: new Date(payload.exp * 1000),
      deviceInfo: context.deviceInfo,
      ipAddress: context.ipAddress
    };
  }
  
  /**
   * Verify and decode access token
   * @param {string} token - JWT token to verify
   * @param {Object} context - Request context for validation
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token, context = {}) {
    if (!this.accessTokenSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'kelmah-auth-service',
        audience: 'kelmah-platform'
      });
      
      // Additional security validations
      if (context.ipAddress && decoded.ip && decoded.ip !== context.ipAddress) {
        // IP mismatch - could be token theft
        throw new Error('Token IP mismatch - possible token theft');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Verify refresh token with rotation
   * @param {string} compositeToken - Composite refresh token
   * @param {Object} storedTokenData - Stored token data from database
   * @returns {Object} Verification result
   */
  async verifyRefreshToken(compositeToken, storedTokenData) {
    if (!this.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }
    
    try {
      // Split composite token
      const parts = compositeToken.split('.');
      if (parts.length !== 4) { // JWT has 3 parts + our raw token
        throw new Error('Invalid refresh token format');
      }
      
      const signedPart = parts.slice(0, 3).join('.');
      const rawToken = parts[3];
      
      // Verify JWT part
      const decoded = jwt.verify(signedPart, this.refreshTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'kelmah-auth-service',
        audience: 'kelmah-platform'
      });
      
      // Verify raw token hash
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      
      if (!SecurityUtils.constantTimeEquals(tokenHash, storedTokenData.tokenHash)) {
        throw new Error('Invalid refresh token');
      }
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error('Refresh token expired');
      }
      
      // Check token version
      if (decoded.version !== storedTokenData.version) {
        throw new Error('Token version mismatch - token invalidated');
      }
      
      return {
        valid: true,
        userId: decoded.sub,
        tokenId: decoded.jti,
        version: decoded.version
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  /**
   * Rotate refresh token - generate new token and invalidate old one
   * @param {Object} user - User object
   * @param {string} oldTokenId - Old token ID to invalidate
   * @param {Object} context - Request context
   * @returns {Promise<Object>} New token data
   */
  async rotateRefreshToken(user, oldTokenId, context = {}) {
    const { RefreshToken } = require('../models');
    const mongoose = require('mongoose');
    
    // Generate new refresh token
    const newTokenData = await this.generateRefreshToken(user, context);
    
    // Use MongoDB session for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Invalidate old token
      await RefreshToken.updateOne(
        { tokenId: oldTokenId },
        { 
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Token rotated'
        },
        { session }
      );
      
      // Store new token
      await RefreshToken.create([{
        userId: user.id,
        tokenId: newTokenData.tokenId,
        tokenHash: newTokenData.tokenHash,
        expiresAt: newTokenData.expiresAt,
        deviceInfo: newTokenData.deviceInfo,
        ipAddress: newTokenData.ipAddress,
        isRevoked: false,
        version: user.tokenVersion || 1
      }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      return newTokenData;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  
  /**
   * Revoke all refresh tokens for a user
   * @param {number} userId - User ID
   * @param {string} reason - Revocation reason
   * @returns {Promise<number>} Number of revoked tokens
   */
  async revokeAllRefreshTokens(userId, reason = 'Manual revocation') {
    const { RefreshToken } = require('../models');
    
    const result = await RefreshToken.updateMany(
      {
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      }
    );
    
    return result.modifiedCount;
  }
  
  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of cleaned tokens
   */
  async cleanupExpiredTokens() {
    const { RefreshToken } = require('../models');
    
    const result = await RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { 
          isRevoked: true,
          revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days old
        }
      ]
    });
    
    return result.deletedCount;
  }
  
  /**
   * Parse expiry string to seconds
   * @param {string} expiry - Expiry time (e.g., '15m', '7d', '1h')
   * @returns {number} Expiry in seconds
   */
  parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes
    
    const [, amount, unit] = match;
    const multipliers = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60
    };
    
    return parseInt(amount) * multipliers[unit];
  }
  
  /**
   * Generate device fingerprint from request
   * @param {Object} req - Express request object
   * @returns {string} Device fingerprint
   */
  generateDeviceFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
    
    return crypto
      .createHash('sha256')
      .update(fingerprint)
      .digest('hex')
      .substring(0, 16);
  }
  
  /**
   * Extract user ID from any valid token
   * @param {string} token - JWT token
   * @returns {string|null} User ID or null
   */
  extractUserId(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.sub || decoded?.id || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Check if token is close to expiry
   * @param {string} token - JWT token
   * @param {number} threshold - Threshold in seconds (default 5 minutes)
   * @returns {boolean} True if token expires soon
   */
  isTokenExpiringSoon(token, threshold = 300) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded?.exp) return false;
      
      const expiryTime = decoded.exp * 1000;
      const now = Date.now();
      
      return (expiryTime - now) <= (threshold * 1000);
    } catch {
      return true; // Assume expired if can't decode
    }
  }
}

module.exports = new SecureJWT();