/**
 * Payment Service Configuration
 * Self-contained config for the payment service
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const config = {
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '1h',
  
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3004,
  
  // Database
  MONGODB_URI: process.env.PAYMENT_MONGO_URI || process.env.MONGODB_URI,
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  
  // PayPal
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE: process.env.PAYPAL_MODE || 'sandbox',
  
  // RabbitMQ
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app'
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables for payment service:');
  missingEnvVars.forEach(env => console.error(`- ${env}`));
  process.exit(1);
}

module.exports = config;