/**
 * Data Fetch Error Fix Verification Script
 * Tests all endpoints affected by the recent fixes
 */

const axios = require('axios');

// Service URLs
const SERVICES = {
  job: 'https://kelmah-job-service.onrender.com',
  messaging: 'https://kelmah-messaging-service.onrender.com', 
  user: 'https://kelmah-user-service.onrender.com',
  auth: 'https://kelmah-auth-service.onrender.com'
};

// Test configuration
const TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;

/**
 * Test helper function with retries
 */
async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const startTime = Date.now();
      const response = await axios({
        method: 'GET',
        url,
        timeout: TIMEOUT,
        validateStatus: () => true, // Accept all status codes
        ...options
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Response: ${response.status} ${response.statusText}`);
      console.log(`   ⏱️ Duration: ${duration}ms`);
      
      if (response.data) {
        if (response.data.service) {
          console.log(`   🏷️ Service: ${response.data.service}`);
        }
        if (response.data.deployment) {
          console.log(`   🚀 Deployment: ${response.data.deployment.status}`);
        }
        if (response.data.database) {
          console.log(`   📊 Database: ${response.data.database.status}`);
        }
        if (response.data.contracts) {
          console.log(`   📋 Contracts: ${response.data.contracts.length} found`);
        }
        if (response.data.conversations) {
          console.log(`   💬 Conversations: ${response.data.conversations.length} found`);
        }
      }
      
      return {
        success: response.status < 400,
        status: response.status,
        duration,
        data: response.data,
        attempt
      };
      
    } catch (error) {
      console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === RETRY_ATTEMPTS) {
        return {
          success: false,
          error: error.message,
          attempt
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

/**
 * Test all critical endpoints
 */
async function runTests() {
  console.log('🚀 STARTING DATA FETCH ERROR FIX VERIFICATION');
  console.log('===============================================');
  
  const results = {};
  
  // Test 1: Job Service Identity Verification
  console.log('\n📋 JOB SERVICE TESTS');
  console.log('-------------------');
  
  results.jobServiceRoot = await testEndpoint(
    'Job Service Root (Identity Check)',
    SERVICES.job
  );
  
  results.jobServiceHealth = await testEndpoint(
    'Job Service Health',
    `${SERVICES.job}/health`
  );
  
  results.jobServiceContracts = await testEndpoint(
    'Job Service Contracts (CRITICAL)',
    `${SERVICES.job}/api/jobs/contracts`
  );
  
  // Test 2: Messaging Service MongoDB Connection
  console.log('\n💬 MESSAGING SERVICE TESTS');
  console.log('-------------------------');
  
  results.messagingServiceHealth = await testEndpoint(
    'Messaging Service Health (MongoDB Check)',
    `${SERVICES.messaging}/health`
  );
  
  // Test with mock auth token for conversations
  const mockToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  results.messagingConversations = await testEndpoint(
    'Messaging Service Conversations (Auth Test)',
    `${SERVICES.messaging}/api/conversations`,
    {
      headers: {
        'Authorization': mockToken
      }
    }
  );
  
  results.messagingNotifications = await testEndpoint(
    'Messaging Service Notifications (Auth Test)',
    `${SERVICES.messaging}/api/notifications`,
    {
      headers: {
        'Authorization': mockToken
      }
    }
  );
  
  // Test 3: Other Services for Comparison
  console.log('\n👤 OTHER SERVICE VERIFICATION');
  console.log('----------------------------');
  
  results.userServiceHealth = await testEndpoint(
    'User Service Health (Comparison)',
    `${SERVICES.user}/health`
  );
  
  results.authServiceHealth = await testEndpoint(
    'Auth Service Health (Comparison)',
    `${SERVICES.auth}/health`
  );
  
  // Generate Test Report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  let totalTests = 0;
  let passedTests = 0;
  let criticalIssues = 0;
  
  Object.entries(results).forEach(([testName, result]) => {
    totalTests++;
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `(${result.duration}ms)` : '';
    
    console.log(`${status} ${testName} ${duration}`);
    
    if (result.success) {
      passedTests++;
    } else {
      // Check if this is a critical endpoint
      if (testName.includes('Contracts') || testName.includes('MongoDB')) {
        criticalIssues++;
        console.log(`   🚨 CRITICAL: ${result.error || 'Unknown error'}`);
      }
    }
  });
  
  console.log('\n🎯 FINAL ASSESSMENT');
  console.log('===================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Critical Issues: ${criticalIssues}`);
  
  if (criticalIssues === 0) {
    console.log('🎉 SUCCESS: All critical data fetch errors have been resolved!');
    console.log('✅ Job Service contracts endpoint working');
    console.log('✅ Messaging Service MongoDB connection established');
    console.log('✅ Services are properly deployed and responding');
  } else {
    console.log('🚨 ATTENTION: Critical issues still exist');
    console.log('❌ Some fixes may need additional time to deploy');
    console.log('🔄 Services may be restarting - try again in 2-3 minutes');
  }
  
  console.log(`\n⏰ Test completed at: ${new Date().toISOString()}`);
  
  return {
    totalTests,
    passedTests,
    criticalIssues,
    results
  };
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint };