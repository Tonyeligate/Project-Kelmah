#!/usr/bin/env node

/**
 * Configuration Setup Script
 * Sets up environment files and validates configuration for all services
 */

const fs = require('fs');
const path = require('path');
const { validateAllServices, createEnvTemplate } = require('../config/config-validator');

const SERVICES_DIR = path.join(__dirname, '../kelmah-backend/services');

console.log('⚙️  Starting configuration setup...');

function setupServiceConfig(serviceName) {
  const servicePath = path.join(SERVICES_DIR, serviceName);
  const envPath = path.join(servicePath, '.env');
  const envExamplePath = path.join(servicePath, '.env.example');
  
  console.log(`\n🔧 Setting up ${serviceName} configuration...`);
  
  // Create .env.example template
  try {
    const template = createEnvTemplate(serviceName);
    fs.writeFileSync(envExamplePath, template);
    console.log(`✅ Created .env.example for ${serviceName}`);
  } catch (error) {
    console.error(`❌ Failed to create template for ${serviceName}:`, error.message);
    return;
  }
  
  // Create .env file if it doesn't exist
  if (!fs.existsSync(envPath)) {
    const baseEnv = getBaseEnvironmentForService(serviceName);
    fs.writeFileSync(envPath, baseEnv);
    console.log(`✅ Created .env for ${serviceName}`);
  } else {
    console.log(`ℹ️  .env already exists for ${serviceName}`);
  }
}

function getBaseEnvironmentForService(serviceName) {
  const basePort = getServicePort(serviceName);
  const dbName = `kelmah_${serviceName.replace('-service', '')}`;
  
  let envContent = [
    `# ${serviceName.toUpperCase()} Environment Configuration`,
    `NODE_ENV=development`,
    `PORT=${basePort}`,
    ``,
    `# Database Configuration`,
    `MONGODB_URI=mongodb://localhost:27017/${dbName}`,
    `DB_NAME=${dbName}`,
    ``,
    `# Security`,
    `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars`,
    ``,
    `# CORS`,
    `CORS_ORIGIN=http://localhost:3001`,
    ``,
    `# Logging`,
    `LOG_LEVEL=info`,
    ``
  ];
  
  // Add service-specific configuration
  switch (serviceName) {
    case 'auth-service':
      envContent.push(
        `# Email Configuration`,
        `EMAIL_SERVICE=gmail`,
        `EMAIL_FROM=noreply@kelmah.com`,
        `EMAIL_PASSWORD=your-email-password`,
        ``,
        `# JWT Configuration`,
        `JWT_REFRESH_SECRET=your-refresh-secret-change-this-in-production-min-32-chars`,
        `JWT_ACCESS_EXPIRY=15m`,
        `JWT_REFRESH_EXPIRY=7d`,
        ``,
        `# OAuth (Optional)`,
        `# OAUTH_GOOGLE_CLIENT_ID=`,
        `# OAUTH_GOOGLE_CLIENT_SECRET=`,
        ``
      );
      break;
      
    case 'payment-service':
      envContent.push(
        `# Stripe Configuration`,
        `STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key`,
        `STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key`,
        `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`,
        ``,
        `# PayPal Configuration (Optional)`,
        `# PAYPAL_CLIENT_ID=`,
        `# PAYPAL_CLIENT_SECRET=`,
        `PAYPAL_MODE=sandbox`,
        ``,
        `# Platform Settings`,
        `PLATFORM_FEE_PERCENTAGE=5`,
        `MINIMUM_PAYOUT=10`,
        ``
      );
      break;
      
    case 'messaging-service':
      envContent.push(
        `# Socket.IO Configuration`,
        `SOCKET_IO_CORS_ORIGIN=http://localhost:3001`,
        ``,
        `# Message Settings`,
        `MAX_MESSAGE_LENGTH=2000`,
        `MESSAGE_RETENTION_DAYS=365`,
        ``,
        `# File Upload`,
        `MAX_ATTACHMENT_SIZE=10485760`,
        `ALLOWED_ATTACHMENT_TYPES=image/*,application/pdf`,
        ``
      );
      break;
      
    case 'user-service':
      envContent.push(
        `# File Upload Configuration`,
        `UPLOAD_MAX_SIZE=5242880`,
        `UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf`,
        ``,
        `# Cloud Storage (Optional)`,
        `# CLOUDINARY_CLOUD_NAME=`,
        `# CLOUDINARY_API_KEY=`,
        `# CLOUDINARY_API_SECRET=`,
        ``,
        `# Profile Settings`,
        `SKILLS_MAX_COUNT=20`,
        ``
      );
      break;
      
    case 'job-service':
      envContent.push(
        `# Job Settings`,
        `JOB_EXPIRY_DAYS=30`,
        `MAX_APPLICATIONS_PER_JOB=100`,
        `SEARCH_RADIUS_KM=50`,
        ``,
        `# Search Configuration (Optional)`,
        `# ELASTICSEARCH_URL=http://localhost:9200`,
        `ELASTICSEARCH_INDEX=jobs`,
        ``
      );
      break;
  }
  
  return envContent.join('\n');
}

function getServicePort(serviceName) {
  const portMap = {
    'auth-service': 5001,
    'user-service': 5002,
    'job-service': 5003,
    'messaging-service': 5004,
    'payment-service': 5005,
    'review-service': 5006
  };
  
  return portMap[serviceName] || 5000;
}

function validateConfigurations() {
  console.log('\n🔍 Validating all service configurations...');
  
  const results = validateAllServices(SERVICES_DIR);
  let hasErrors = false;
  
  for (const [serviceName, result] of Object.entries(results)) {
    console.log(`\n📋 ${serviceName}:`);
    
    if (result.isValid) {
      console.log(`  ✅ Configuration valid`);
    } else {
      console.log(`  ❌ Configuration has errors:`);
      result.errors.forEach(error => {
        console.log(`    • ${error.field}: ${error.message}`);
      });
      hasErrors = true;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log(`  ⚠️  Warnings:`);
      result.warnings.forEach(warning => {
        console.log(`    • ${warning.field}: ${warning.message}`);
      });
    }
    
    console.log(`  📁 .env file exists: ${result.envFileExists ? 'Yes' : 'No'}`);
  }
  
  return !hasErrors;
}

function createDockerComposeEnv() {
  console.log('\n🐳 Creating Docker Compose environment file...');
  
  const dockerEnv = [
    `# Docker Compose Environment Variables`,
    `# Generated on ${new Date().toISOString()}`,
    ``,
    `# Network Configuration`,
    `COMPOSE_PROJECT_NAME=kelmah`,
    ``,
    `# Service Ports`,
    `API_GATEWAY_PORT=5000`,
    `AUTH_SERVICE_PORT=5001`,
    `USER_SERVICE_PORT=5002`, 
    `JOB_SERVICE_PORT=5003`,
    `MESSAGING_SERVICE_PORT=5004`,
    `PAYMENT_SERVICE_PORT=5005`,
    `REVIEW_SERVICE_PORT=5006`,
    ``,
    `# Database Configuration`,
    `MONGODB_PORT=27017`,
    `MONGODB_ROOT_USERNAME=admin`,
    `MONGODB_ROOT_PASSWORD=password123`,
    ``,
    `# Redis Configuration`,
    `REDIS_PORT=6379`,
    `REDIS_PASSWORD=redis123`,
    ``,
    `# Elasticsearch Configuration (Optional)`,
    `ELASTICSEARCH_PORT=9200`,
    ``,
    `# Frontend Configuration`,
    `FRONTEND_PORT=3001`,
    `FRONTEND_URL=http://localhost:3001`,
    ``,
    `# Global Configuration`,
    `NODE_ENV=development`,
    `LOG_LEVEL=info`,
    `INTERNAL_API_KEY=internal-service-key-change-in-production`,
    ``
  ].join('\n');
  
  fs.writeFileSync('.env.docker', dockerEnv);
  console.log('✅ Created .env.docker for Docker Compose');
}

async function runSetup() {
  console.log('⚙️  Configuration Management Setup');
  console.log('=' . repeat(50));
  
  // Get list of services
  const services = fs.readdirSync(SERVICES_DIR).filter(dir => {
    const servicePath = path.join(SERVICES_DIR, dir);
    return fs.statSync(servicePath).isDirectory();
  });
  
  console.log(`📦 Found services: ${services.join(', ')}`);
  
  // Setup each service
  for (const service of services) {
    setupServiceConfig(service);
  }
  
  // Create Docker environment
  createDockerComposeEnv();
  
  // Validate all configurations
  const isValid = validateConfigurations();
  
  console.log('\n🎉 Configuration setup completed!');
  
  if (isValid) {
    console.log('✅ All configurations are valid');
  } else {
    console.log('⚠️  Some configurations have errors - please review and fix');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Review and update .env files with your actual values');
  console.log('2. Set up MongoDB database connections');
  console.log('3. Configure external service API keys (Stripe, PayPal, etc.)');
  console.log('4. Test each service individually');
  console.log('5. Run integration tests');
  
  console.log('\n🔧 Useful commands:');
  console.log('- Validate config: node scripts/validate-config.js');
  console.log('- Generate templates: node scripts/setup-config.js --templates-only');
  console.log('- Docker setup: docker-compose up -d');
}

// Run setup
runSetup().catch(error => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});