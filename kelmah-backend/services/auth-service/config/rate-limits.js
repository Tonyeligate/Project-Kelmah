/**
 * Rate Limits Configuration
 * Defines rate limits for different API endpoints
 */

module.exports = {
  // Authentication endpoints
  login: {
    limit: 5,      // 5 requests
    window: 60     // per minute
  },
  
  register: {
    limit: 3,      // 3 requests
    window: 60     // per minute
  },
  
  forgotPassword: {
    limit: 3,      // 3 requests
    window: 300    // per 5 minutes
  },
  
  resetPassword: {
    limit: 3,      // 3 requests
    window: 300    // per 5 minutes
  },
  
  // Email verification
  emailVerification: {
    limit: 3,      // 3 requests
    window: 300    // per 5 minutes
  },
  
  // Two-factor authentication
  twoFactor: {
    limit: 5,      // 5 requests
    window: 300    // per 5 minutes
  },
  
  // Token refresh
  refreshToken: {
    limit: 10,     // 10 requests
    window: 60     // per minute
  },
  
  // Default values used when specific endpoint isn't defined
  default: {
    limit: 30,     // 30 requests
    window: 60     // per minute
  }
}; 