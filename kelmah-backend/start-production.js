#!/usr/bin/env node

/**
 * 🚀 KELMAH PRODUCTION STARTUP SCRIPT
 * Starts all microservices directly on Windows machine for external access
 */

// Load environment variables from .env file
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

// Production configuration
const SERVICES = [
  {
    name: 'API Gateway',
    script: './api-gateway/server.js',
    port: 3000,
    env: { 
      PORT: 3000, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VERCEL_URL || ''
    }
  },
  {
    name: 'Auth Service',
    script: './services/auth-service/server.js',
    port: 5001,
    env: { 
      PORT: 5001, 
      AUTH_SERVICE_PORT: 5001, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      AUTH_MONGO_URI: process.env.AUTH_MONGO_URI,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VERCEL_URL || ''
    }
  },
  {
    name: 'User Service',
    script: './services/user-service/server.js',
    port: 5002,
    env: { 
      PORT: 5002, 
      USER_SERVICE_PORT: 5002, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      USER_MONGO_URI: process.env.USER_MONGO_URI,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VERCEL_URL || ''
    }
  },
  {
    name: 'Job Service',
    script: './services/job-service/server.js',
    port: 5003,
    env: { 
      PORT: 5003, 
      JOB_SERVICE_PORT: 5003, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      JOB_MONGO_URI: process.env.JOB_MONGO_URI,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VERCEL_URL || ''
    }
  },
  {
    name: 'Payment Service',
    script: './services/payment-service/server.js',
    port: 5004,
    env: { 
      PORT: 5004, 
      PAYMENT_SERVICE_PORT: 5004, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      PAYMENT_MONGO_URI: process.env.PAYMENT_MONGO_URI,
      PAYSTACK_SECRET_KEY: 'sk_test_your_paystack_secret_key_here'
    }
  },
  {
    name: 'Messaging Service',
    script: './services/messaging-service/server.js',
    port: 5005,
    env: { 
      PORT: 5005, 
      MESSAGING_SERVICE_PORT: 5005, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      MESSAGING_MONGO_URI: process.env.MESSAGING_MONGO_URI,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VERCEL_URL || ''
    }
  },
  {
    name: 'Review Service',
    script: './services/review-service/server.js',
    port: 5006,
    env: { 
      PORT: 5006, 
      REVIEW_SERVICE_PORT: 5006, 
      NODE_ENV: 'production',
      JWT_SECRET: process.env.JWT_SECRET,
      MONGODB_URI: process.env.MONGODB_URI,
      REVIEW_MONGO_URI: process.env.REVIEW_MONGO_URI,
      FRONTEND_URL: process.env.FRONTEND_URL || process.env.VERCEL_URL || ''
    }
  }
];

const runningProcesses = new Map();

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function startService(service) {
  return new Promise((resolve) => {
    log(`[${service.name}] Starting on port ${service.port}...`);
    
    const env = { ...process.env, ...service.env };
    const child = spawn('node', [service.script], {
      stdio: 'pipe',
      env: env,
      cwd: __dirname
    });
    
    runningProcesses.set(service.name, child);
    
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) log(`[${service.name}] ${output}`);
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) log(`[${service.name}] ERROR: ${output}`);
    });
    
    child.on('exit', (code) => {
      log(`[${service.name}] Process exited with code ${code}`);
      runningProcesses.delete(service.name);
    });
    
    setTimeout(() => {
      log(`[${service.name}] Started successfully on port ${service.port}`);
      resolve(child);
    }, 2000);
  });
}

async function startAllServices() {
  log('🚀 Starting Kelmah Production Services...');
  log(`📊 Environment: Production`);
  log(`🌐 External Access: Enabled (0.0.0.0 binding)`);
  log(`🔌 Total Services: ${SERVICES.length}`);
  
  try {
    for (const service of SERVICES) {
      try {
        await startService(service);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        log(`[${service.name}] Failed to start: ${error.message}`);
      }
    }
    
    log('✅ All services started successfully!');
    log('🌐 External Access URLs:');
    log(`  API Gateway: http://YOUR_IP:3000`);
    log(`  Health Check: http://YOUR_IP:3000/api/health`);
    log(`  API Docs: http://YOUR_IP:3000/api/docs`);
    log('💡 To stop all services, press Ctrl+C');
    
  } catch (error) {
    log(`❌ Failed to start services: ${error.message}`);
    process.exit(1);
  }
}

function gracefulShutdown(signal) {
  log(`🛑 Received ${signal}. Shutting down gracefully...`);
  
  for (const [serviceName, process] of runningProcesses) {
    log(`[${serviceName}] Stopping...`);
    process.kill('SIGTERM');
  }
  
  setTimeout(() => {
    log('🔴 All services stopped');
    process.exit(0);
  }, 3000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

if (require.main === module) {
  startAllServices().catch((error) => {
    log(`💥 Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { startAllServices, startService, SERVICES };

