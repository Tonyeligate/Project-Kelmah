/**
 * JWT Utilities for API Gateway
 * Local implementation to replace missing shared utilities
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is required');
  // Don't exit immediately, let the main server handle it
  // process.exit(1);
}

/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'kelmah-api-gateway'
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required for refresh tokens');
  }
  
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object');
  }
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'kelmah-api-gateway'
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a string');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required for refresh tokens');
  }
  
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a string');
  }
  
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a string');
  }
  
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Generate token pair (access + refresh)
 */
const generateTokenPair = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 900 // 15 minutes
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  isTokenExpired,
  generateTokenPair
};
