/**
 * Authentication Middleware
 * Validates JWT tokens and adds user info to request
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

/**
 * Middleware to authenticate requests
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token locally first
    try {
      // Note: This is just a preliminary check
      // We're using the public key that only verifies the token structure
      // The actual validation will be done by the auth service
      const publicKey = process.env.JWT_PUBLIC_KEY || 'default-public-key';
      jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Validate token with auth service
    // This is more secure as it also checks if the token has been revoked
    const verifyResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/validate`, 
      { token },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'X-Internal-Request': process.env.INTERNAL_API_KEY
        }
      }
    );

    if (!verifyResponse.data || !verifyResponse.data.valid) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Add user info to request
    req.user = verifyResponse.data.user;
    
    // Add token to request for downstream services
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle auth service being down
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ message: 'Authentication service unavailable' });
    }
    
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authenticate; 