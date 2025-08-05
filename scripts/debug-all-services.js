/**
 * Debug All Services Script
 * Tests connectivity to all microservices and specific endpoints
 */

const axios = require('axios');

// Service URLs
const SERVICES = {
  'Auth Service': 'https://kelmah-auth-service.onrender.com',
  'User Service': 'https://kelmah-user-service.onrender.com', 
  'Job Service': 'https://kelmah-job-service.onrender.com',
  'Messaging Service': 'https://kelmah-messaging-service.onrender.com',
  'Payment Service': 'https://kelmah-payment-service.onrender.com'
};

// Test endpoints
const ENDPOINTS = {
  'Auth Service': [
    '/health',
    '/api/auth/verify'
  ],
  'User Service': [
    '/health'
  ],
  'Job Service': [
    '/health',
    '/',
    '/api/jobs',
    '/api/jobs/contracts'
  ],
  'Messaging Service': [
    '/health',
    '/api/conversations',
    '/api/notifications'
  ],
  'Payment Service': [
    '/health'
  ]
};

// Test configuration
const TEST_CONFIG = {
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Kelmah-Service-Debugger/1.0'
  }
};

/**
 * Test a single endpoint
 */
async function testEndpoint(serviceName, baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Testing: ${serviceName} - ${endpoint}`);
    
    const response = await axios.get(url, {
      ...TEST_CONFIG,
      validateStatus: (status) => status < 500 // Accept 404, etc.
    });
    
    const duration = Date.now() - startTime;
    const statusColor = response.status < 300 ? '✅' : 
                       response.status < 400 ? '🟡' : 
                       response.status < 500 ? '🟠' : '❌';
    
    console.log(`${statusColor} ${response.status} - ${url} (${duration}ms)`);
    
    if (response.data) {
      console.log(`   📋 Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    }
    
    return {
      service: serviceName,
      endpoint,
      url,
      status: response.status,
      duration,
      success: response.status < 400,
      data: response.data
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorType = error.code === 'ECONNABORTED' ? 'TIMEOUT' :
                     error.code === 'ENOTFOUND' ? 'DNS_ERROR' :
                     error.code === 'ECONNREFUSED' ? 'CONNECTION_REFUSED' :
                     error.response ? `HTTP_${error.response.status}` : 'UNKNOWN';
    
    console.log(`❌ ${errorType} - ${url} (${duration}ms)`);
    if (error.message) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }
    
    return {
      service: serviceName,
      endpoint,
      url,
      status: error.response?.status || 0,
      duration,
      success: false,
      error: errorType,
      message: error.message
    };
  }
}

/**
 * Test all services
 */
async function testAllServices() {
  console.log('🚀 Starting comprehensive service connectivity test...\n');
  
  const allResults = [];
  
  for (const [serviceName, baseUrl] of Object.entries(SERVICES)) {
    console.log(`\n🔧 Testing ${serviceName} (${baseUrl}):`);
    console.log('─'.repeat(60));
    
    const endpoints = ENDPOINTS[serviceName] || ['/health'];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(serviceName, baseUrl, endpoint);
      allResults.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Summary
  console.log('\n🎯 TEST SUMMARY:');
  console.log('═'.repeat(80));
  
  const serviceStatus = {};
  for (const result of allResults) {
    if (!serviceStatus[result.service]) {
      serviceStatus[result.service] = { total: 0, successful: 0, failed: 0 };
    }
    serviceStatus[result.service].total++;
    if (result.success) {
      serviceStatus[result.service].successful++;
    } else {
      serviceStatus[result.service].failed++;
    }
  }
  
  for (const [service, stats] of Object.entries(serviceStatus)) {
    const healthIcon = stats.failed === 0 ? '✅' : stats.successful > 0 ? '🟡' : '❌';
    console.log(`${healthIcon} ${service}: ${stats.successful}/${stats.total} endpoints working`);
  }
  
  // Specific issues
  console.log('\n🔍 SPECIFIC ISSUES FOUND:');
  console.log('─'.repeat(40));
  
  const issues = allResults.filter(r => !r.success);
  if (issues.length === 0) {
    console.log('✅ No issues found!');
  } else {
    for (const issue of issues) {
      console.log(`❌ ${issue.service} - ${issue.endpoint}: ${issue.error || 'HTTP ' + issue.status}`);
      if (issue.message) {
        console.log(`   💬 ${issue.message}`);
      }
    }
  }
  
  console.log('\n✅ Service connectivity test completed!');
}

// Run the test
if (require.main === module) {
  testAllServices().catch(console.error);
}

module.exports = { testAllServices, testEndpoint };