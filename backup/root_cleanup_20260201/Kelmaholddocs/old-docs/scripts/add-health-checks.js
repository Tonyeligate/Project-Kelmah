#!/usr/bin/env node

/**
 * Health Check Integration Script
 * Adds comprehensive health check endpoints to all services
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '../kelmah-backend/services');

console.log('🏥 Adding health check endpoints to all services...');

function addHealthChecksToService(serviceName) {
  const servicePath = path.join(SERVICES_DIR, serviceName);
  const serverJsPath = path.join(servicePath, 'server.js');
  
  console.log(`\n📝 Processing ${serviceName}...`);
  
  if (!fs.existsSync(serverJsPath)) {
    console.log(`❌ No server.js found in ${serviceName}`);
    return;
  }
  
  // Read current server.js
  let serverContent = fs.readFileSync(serverJsPath, 'utf8');
  
  // Check if health checks are already added
  if (serverContent.includes('health-check') || serverContent.includes('/health')) {
    console.log(`ℹ️  Health checks already integrated in ${serviceName}`);
    return;
  }
  
  // Add health check import
  const healthImport = `
// Import health check utilities
const { createHealthCheck, createReadinessCheck, createLivenessCheck } = require('../../shared/health-check');
`;
  
  // Find position to add import (after logger import)
  const loggerImportRegex = /require\(['"][^'"]*logger['"]\);?/;
  const importMatch = serverContent.match(loggerImportRegex);
  
  if (importMatch) {
    const insertPosition = importMatch.index + importMatch[0].length;
    serverContent = 
      serverContent.slice(0, insertPosition) + 
      healthImport + 
      serverContent.slice(insertPosition);
  } else {
    // Fallback: add after other requires
    const requiresEndRegex = /\n\n(?=\/\/|const app|app\.)/;
    const requiresMatch = serverContent.match(requiresEndRegex);
    if (requiresMatch) {
      serverContent = 
        serverContent.slice(0, requiresMatch.index) + 
        healthImport + 
        serverContent.slice(requiresMatch.index);
    }
  }
  
  // Get service-specific health check configuration
  const healthCheckConfig = getHealthCheckConfig(serviceName);
  
  // Add health check endpoints
  const healthEndpoints = `
// Health check endpoints
app.get('/health', createHealthCheck('${serviceName}', ${JSON.stringify(healthCheckConfig, null, 2)}));
app.get('/health/ready', createReadinessCheck(${JSON.stringify(healthCheckConfig.readiness || {}, null, 2)}));
app.get('/health/live', createLivenessCheck());

// Additional health endpoints
app.get('/ping', (req, res) => res.status(200).send('pong'));
app.get('/status', (req, res) => {
  res.status(200).json({
    service: '${serviceName}',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});
`;
  
  // Find position to add endpoints (after basic routes but before error handlers)
  const errorHandlerRegex = /app\.use\(createErrorLogger/;
  const errorMatch = serverContent.match(errorHandlerRegex);
  
  if (errorMatch) {
    const insertPosition = errorMatch.index;
    serverContent = 
      serverContent.slice(0, insertPosition) + 
      healthEndpoints + 
      '\n' + 
      serverContent.slice(insertPosition);
  } else {
    // Fallback: add before server start
    const serverStartRegex = /app\.listen\(/;
    const serverMatch = serverContent.match(serverStartRegex);
    if (serverMatch) {
      const insertPosition = serverMatch.index;
      serverContent = 
        serverContent.slice(0, insertPosition) + 
        healthEndpoints + 
        '\n' + 
        serverContent.slice(insertPosition);
    }
  }
  
  // Write updated server.js
  fs.writeFileSync(serverJsPath, serverContent);
  console.log(`✅ Health checks added to ${serviceName}`);
}

function getHealthCheckConfig(serviceName) {
  const baseConfig = {
    version: '1.0.0',
    checkMongo: true,
    customChecks: []
  };
  
  // Service-specific configurations
  switch (serviceName) {
    case 'auth-service':
      return {
        ...baseConfig,
        externalServices: [],
        customChecks: [
          {
            name: 'jwt-validation',
            description: 'Check JWT functionality'
          },
          {
            name: 'email-service',
            description: 'Check email service connectivity'
          }
        ],
        readiness: {
          checkMongo: true,
          requiredServices: []
        }
      };
      
    case 'user-service':
      return {
        ...baseConfig,
        externalServices: [
          { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' }
        ],
        customChecks: [
          {
            name: 'file-upload',
            description: 'Check file upload capabilities'
          }
        ],
        readiness: {
          checkMongo: true,
          requiredServices: [
            { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' }
          ]
        }
      };
      
    case 'job-service':
      return {
        ...baseConfig,
        externalServices: [
          { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' },
          { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://localhost:5002' }
        ],
        customChecks: [
          {
            name: 'search-indexing',
            description: 'Check search indexing functionality'
          }
        ],
        readiness: {
          checkMongo: true,
          requiredServices: [
            { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' }
          ]
        }
      };
      
    case 'messaging-service':
      return {
        ...baseConfig,
        externalServices: [
          { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' },
          { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://localhost:5002' }
        ],
        customChecks: [
          {
            name: 'websocket-server',
            description: 'Check WebSocket server status'
          },
          {
            name: 'message-queue',
            description: 'Check message queue connectivity'
          }
        ],
        readiness: {
          checkMongo: true,
          requiredServices: [
            { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' }
          ]
        }
      };
      
    case 'payment-service':
      return {
        ...baseConfig,
        externalServices: [
          { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' },
          { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://localhost:5002' }
        ],
        customChecks: [
          {
            name: 'stripe-connectivity',
            description: 'Check Stripe API connectivity'
          },
          {
            name: 'paypal-connectivity',
            description: 'Check PayPal API connectivity'
          }
        ],
        readiness: {
          checkMongo: true,
          requiredServices: [
            { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' }
          ]
        }
      };
      
    case 'review-service':
      return {
        ...baseConfig,
        externalServices: [
          { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' },
          { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://localhost:5002' },
          { name: 'job-service', url: process.env.JOB_SERVICE_URL || 'http://localhost:5003' }
        ],
        customChecks: [
          {
            name: 'moderation-service',
            description: 'Check content moderation functionality'
          }
        ],
        readiness: {
          checkMongo: true,
          requiredServices: [
            { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001' }
          ]
        }
      };
      
    default:
      return baseConfig;
  }
}

async function runHealthCheckIntegration() {
  console.log('🏥 Health Check Integration Process');
  console.log('=' . repeat(50));
  
  // Get list of services
  const services = fs.readdirSync(SERVICES_DIR).filter(dir => {
    const servicePath = path.join(SERVICES_DIR, dir);
    return fs.statSync(servicePath).isDirectory();
  });
  
  console.log(`📦 Found services: ${services.join(', ')}`);
  
  // Add health checks to each service
  for (const service of services) {
    addHealthChecksToService(service);
  }
  
  console.log('\n🎉 Health check integration completed!');
  console.log('\n📋 Health Endpoints Added:');
  console.log('✅ GET /health - Comprehensive health check');
  console.log('✅ GET /health/ready - Readiness probe (for K8s)');
  console.log('✅ GET /health/live - Liveness probe (for K8s)');
  console.log('✅ GET /ping - Simple ping endpoint');
  console.log('✅ GET /status - Service status');
  
  console.log('\n🔧 Features:');
  console.log('- MongoDB connection monitoring');
  console.log('- External service dependency checks');
  console.log('- System resource monitoring');
  console.log('- Custom service-specific checks');
  console.log('- Kubernetes-compatible probes');
  console.log('- Response time measurement');
  
  console.log('\n📖 Usage Examples:');
  console.log('- curl http://localhost:5001/health');
  console.log('- curl http://localhost:5001/health?detailed=true');
  console.log('- curl http://localhost:5001/health/ready');
}

// Run integration
runHealthCheckIntegration().catch(error => {
  console.error('💥 Health check integration failed:', error);
  process.exit(1);
});