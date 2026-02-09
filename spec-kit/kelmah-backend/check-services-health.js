#!/usr/bin/env node

/**
 * Service Health Check Script
 * Tests all Kelmah microservices to ensure they're running and accessible
 */

const axios = require('axios');

const services = {
  'API Gateway': {
    url: 'http://localhost:3000',
    healthEndpoint: '/health'
  },
  'Auth Service': {
    url: 'http://localhost:5001',
    healthEndpoint: '/health'
  },
  'User Service': {
    url: 'http://localhost:5002',
    healthEndpoint: '/health'
  },
  'Job Service': {
    url: 'http://localhost:5003',
    healthEndpoint: '/health'
  },
  'Messaging Service': {
    url: 'http://localhost:5005',
    healthEndpoint: '/health'
  }
};

async function checkServiceHealth(serviceName, config) {
  const fullUrl = `${config.url}${config.healthEndpoint}`;

  try {
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    console.log(`✅ ${serviceName}: ${response.status} - ${response.data.status || 'OK'}`);
    return { status: 'healthy', response: response.data };
  } catch (error) {
    console.log(`❌ ${serviceName}: FAILED - ${error.message}`);
    return { status: 'unhealthy', error: error.message };
  }
}

async function testServiceEndpoints() {
  console.log('🔍 Testing Service Endpoints...\n');

  // Test API Gateway proxy routes
  const gatewayUrl = 'http://localhost:3000';

  const endpoints = [
    { name: 'Jobs API', url: `${gatewayUrl}/api/jobs` },
    { name: 'Users API', url: `${gatewayUrl}/api/users` },
    { name: 'Messages API', url: `${gatewayUrl}/api/messages` },
    { name: 'Notifications API', url: `${gatewayUrl}/api/notifications` }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint.url, {
        timeout: 5000,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      console.log(`✅ ${endpoint.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.status || 'FAILED'} - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Kelmah Services Health Check');
  console.log('================================\n');

  const results = {};

  // Check individual services
  for (const [serviceName, config] of Object.entries(services)) {
    results[serviceName] = await checkServiceHealth(serviceName, config);
  }

  console.log('\n' + '='.repeat(50));

  // Test API Gateway routes
  await testServiceEndpoints();

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');

  const healthy = Object.values(results).filter(r => r.status === 'healthy').length;
  const total = Object.keys(results).length;

  console.log(`Services Healthy: ${healthy}/${total}`);

  if (healthy === total) {
    console.log('✅ All services are running properly!');
  } else {
    console.log('⚠️  Some services are not responding. Check the logs above.');
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Make sure all services are started with the correct environment variables');
    console.log('2. Check that MongoDB is running and accessible');
    console.log('3. Verify JWT_SECRET is set in environment');
    console.log('4. Check service ports are not in use by other applications');
  }

  console.log('\n🔗 Service URLs for reference:');
  Object.entries(services).forEach(([name, config]) => {
    console.log(`   ${name}: ${config.url}`);
  });
}

// Run the health check
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkServiceHealth };
