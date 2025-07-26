/**
 * Auth Service Test Script
 * Tests the authentication endpoints to ensure they're working correctly
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

async function testAuthService() {
  console.log('🧪 Testing Auth Service at:', AUTH_SERVICE_URL);
  
  try {
    // Test 1: Health Check
    console.log('\n1. Testing health check...');
    const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test 2: Service Info
    console.log('\n2. Testing service info...');
    const infoResponse = await axios.get(`${AUTH_SERVICE_URL}/`);
    console.log('✅ Service info successful:', infoResponse.data);
    
    // Test 3: Login endpoint (should fail without credentials)
    console.log('\n3. Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
      console.log('⚠️ Login response:', loginResponse.data);
    } catch (loginError) {
      if (loginError.response && loginError.response.status === 401) {
        console.log('✅ Login endpoint working (returned 401 as expected for invalid credentials)');
      } else {
        console.log('❌ Login error:', loginError.response?.data || loginError.message);
      }
    }
    
    // Test 4: Registration endpoint validation
    console.log('\n4. Testing registration validation...');
    try {
      const registerResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
        email: 'invalid-email'
      });
      console.log('⚠️ Registration response:', registerResponse.data);
    } catch (registerError) {
      if (registerError.response && registerError.response.status === 400) {
        console.log('✅ Registration validation working (returned 400 for invalid data)');
      } else {
        console.log('❌ Registration error:', registerError.response?.data || registerError.message);
      }
    }
    
    console.log('\n🎉 Auth service tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testAuthService().catch(console.error); 