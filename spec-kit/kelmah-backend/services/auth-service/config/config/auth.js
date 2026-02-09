/**
 * Authentication Configuration
 */

module.exports = {
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-secret-key',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-default-refresh-secret',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  
  // Password settings
  PASSWORD_HASH_ROUNDS: process.env.PASSWORD_HASH_ROUNDS || 10,
  
  // 2FA settings
  MFA_ENABLED: process.env.MFA_ENABLED === 'true',
  
  // OAuth providers
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  
  // Session settings
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-default-session-secret',
  SESSION_EXPIRES: process.env.SESSION_EXPIRES || '24h'
}; 