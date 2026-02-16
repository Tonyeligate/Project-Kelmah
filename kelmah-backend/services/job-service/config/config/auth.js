/**
 * Authentication Configuration
 */

// Fail-fast: require JWT secrets in production (no hardcoded fallbacks)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}
if (isProduction && !process.env.JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_REFRESH_SECRET environment variable is required in production');
  process.exit(1);
}

module.exports = {
  // JWT configuration — no hardcoded fallbacks; env vars required
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
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
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_EXPIRES: process.env.SESSION_EXPIRES || '24h'
}; 