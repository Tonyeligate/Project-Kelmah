/**
 * Test Backend User System Endpoints
 * Validates that all user-related endpoints are working correctly
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!'
};

let authToken = null;

/**
 * Test user authentication and get token
 */
async function testAuthentication() {
  console.log('\n🔐 Testing User Authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER, {
      timeout: 10000
    });
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test user credentials endpoint
 */
async function testUserCredentials() {
  console.log('\n👤 Testing User Credentials Endpoint...');
  
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me/credentials`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ User credentials endpoint working');
      console.log('   User ID:', response.data.data?.id);
      console.log('   Email:', response.data.data?.email);
      return true;
    }
  } catch (error) {
    console.log('❌ User credentials endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test user bookmarks endpoint
 */
async function testUserBookmarks() {
  console.log('\n📚 Testing User Bookmarks Endpoint...');
  
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/bookmarks`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ User bookmarks endpoint working');
      console.log('   Bookmarks:', response.data.data);
      return true;
    }
  } catch (error) {
    console.log('❌ User bookmarks endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test user settings endpoints
 */
async function testUserSettings() {
  console.log('\n⚙️ Testing User Settings Endpoints...');
  
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    // Test GET settings
    const getResponse = await axios.get(`${BASE_URL}/api/users/settings`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (getResponse.status === 200) {
      console.log('✅ Get user settings endpoint working');
      
      // Test PUT settings
      const testSettings = {
        notifications: { email: true, push: false },
        privacy: { profileVisibility: 'public' }
      };
      
      const putResponse = await axios.put(`${BASE_URL}/api/users/settings`, testSettings, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000
      });
      
      if (putResponse.status === 200) {
        console.log('✅ Update user settings endpoint working');
        return true;
      }
    }
  } catch (error) {
    console.log('❌ User settings endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Backend User System Endpoint Tests...');
  console.log('🌐 Base URL:', BASE_URL);
  
  const results = {
    authentication: false,
    credentials: false,
    bookmarks: false,
    settings: false
  };
  
  // Run tests
  results.authentication = await testAuthentication();
  
  if (results.authentication) {
    results.credentials = await testUserCredentials();
    results.bookmarks = await testUserBookmarks();
    results.settings = await testUserSettings();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All user system endpoints are working correctly!');
  } else {
    console.log('⚠️ Some user system endpoints need attention.');
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run tests
runTests().catch(console.error);
