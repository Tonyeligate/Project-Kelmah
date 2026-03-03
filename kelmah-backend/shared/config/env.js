/**
 * Shared Environment Configuration
 * Provides common environment variables with sensible defaults
 */

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://project-kelmah.vercel.app',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'kelmah-internal-key-2024',
};
