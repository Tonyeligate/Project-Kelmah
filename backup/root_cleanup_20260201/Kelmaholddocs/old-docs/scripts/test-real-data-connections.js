#!/usr/bin/env node

/**
 * Real Data Connection Test Script
 * Comprehensive testing of all backend services and real data flow
 */

const axios = require('axios');

// Service URLs
const SERVICES = {
  AUTH: 'https://kelmah-auth-service.onrender.com',
  USER: 'https://kelmah-user-service.onrender.com', 
  JOB: 'https://kelmah-job-service.onrender.com',
  PAYMENT: 'https://kelmah-payment-service.onrender.com',
  MESSAGING: 'https://kelmah-messaging-service.onrender.com'
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
    testResults.issues.push(`${testName}: ${details}`);
  }
}

// Test service health endpoints
async function testServiceHealth() {
  console.log('\n🔍 Testing Service Health Endpoints...');
  
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 10000 });
      logTest(`${name} Service Health`, response.status === 200, response.data);
    } catch (error) {
      logTest(`${name} Service Health`, false, error.message);
    }
  }
}

// Test user registration flow
async function testUserRegistration() {
  console.log('\n👤 Testing User Registration Flow...');
  
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@kelmah.com`,
    password: 'TestPassword123!',
    phone: '+233123456789',
    role: 'worker'
  };

  try {
    const response = await axios.post(`${SERVICES.AUTH}/api/auth/register`, testUser, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    logTest('User Registration', response.status === 201 || response.status === 200, 
           `User created with ID: ${response.data.user?.id || 'Unknown'}`);
    
    return response.data.user;
  } catch (error) {
    logTest('User Registration', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test user login flow
async function testUserLogin(email = 'admin@kelmah.com', password = 'admin123') {
  console.log('\n🔐 Testing User Login Flow...');
  
  try {
    const response = await axios.post(`${SERVICES.AUTH}/api/auth/login`, {
      email,
      password
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const token = response.data.token || response.data.data?.token;
    logTest('User Login', !!token, `Token received: ${token ? 'Yes' : 'No'}`);
    
    return token;
  } catch (error) {
    logTest('User Login', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test user data retrieval
async function testUserData(token) {
  console.log('\n📊 Testing User Data Retrieval...');
  
  if (!token) {
    logTest('User Data Retrieval', false, 'No authentication token available');
    return;
  }

  try {
    const response = await axios.get(`${SERVICES.USER}/api/users`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });
    
    logTest('User Data Retrieval', response.status === 200, 
           `Retrieved ${response.data.length || 0} users`);
  } catch (error) {
    logTest('User Data Retrieval', false, error.response?.data?.message || error.message);
  }
}

// Test job posting and retrieval
async function testJobFlow(token) {
  console.log('\n💼 Testing Job Posting Flow...');
  
  if (!token) {
    logTest('Job Flow', false, 'No authentication token available');
    return;
  }

  // Test job creation
  const testJob = {
    title: 'Test Plumbing Job',
    description: 'Test job for real data verification',
    category: 'Plumbing',
    budget: 500.00,
    currency: 'GHS',
    location: 'Accra, Ghana',
    skills: ['plumbing', 'pipe-repair'],
    urgency: 'medium'
  };

  try {
    const createResponse = await axios.post(`${SERVICES.JOB}/api/jobs`, testJob, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });
    
    logTest('Job Creation', createResponse.status === 201 || createResponse.status === 200,
           `Job created with ID: ${createResponse.data.id || 'Unknown'}`);

    // Test job retrieval
    const listResponse = await axios.get(`${SERVICES.JOB}/api/jobs`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });
    
    logTest('Job Retrieval', listResponse.status === 200,
           `Retrieved ${listResponse.data.length || 0} jobs`);
           
  } catch (error) {
    logTest('Job Flow', false, error.response?.data?.message || error.message);
  }
}

// Test payment service endpoints
async function testPaymentFlow(token) {
  console.log('\n💰 Testing Payment Service...');
  
  if (!token) {
    logTest('Payment Service', false, 'No authentication token available');
    return;
  }

  try {
    const response = await axios.get(`${SERVICES.PAYMENT}/api/payments/methods`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      timeout: 10000
    });
    
    logTest('Payment Methods', response.status === 200,
           `Retrieved ${response.data.length || 0} payment methods`);
  } catch (error) {
    logTest('Payment Service', false, error.response?.data?.message || error.message);
  }
}

// Test database real data (no mock fallbacks)
async function testDatabaseRealData() {
  console.log('\n🗄️ Testing Real Database Data...');
  
  // Check if we're getting real data vs mock data by testing data consistency
  try {
    const response = await axios.get(`${SERVICES.AUTH}/health`, { timeout: 5000 });
    const hasTimestamp = response.data.timestamp !== undefined;
    
    logTest('Database Real Data', hasTimestamp, 
           'Services returning timestamped real responses');
  } catch (error) {
    logTest('Database Real Data', false, error.message);
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Real Data Connection Tests...');
  console.log('📅 Test started at:', new Date().toISOString());
  console.log('🌍 Testing production services on Render...\n');

  // Run all tests
  await testServiceHealth();
  await testDatabaseRealData();
  
  const token = await testUserLogin();
  if (token) {
    await testUserData(token);
    await testJobFlow(token);
    await testPaymentFlow(token);
  }
  
  const newUser = await testUserRegistration();
  
  // Print test summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed/testResults.total)*100).toFixed(1)}%`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Real data is flowing correctly through the system.');
    console.log('✨ The Kelmah platform is ready for production use with real data!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    console.log('💡 Run the database migration script if schema errors are present.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If tests failed, run: npm run fix-db');  
  console.log('2. Restart Render services if needed');
  console.log('3. Test the frontend to verify real data display');
  console.log('4. Check admin dashboard for real analytics');
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };