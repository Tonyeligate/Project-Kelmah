#!/usr/bin/env node

/**
 * 🔍 TEST ACTUAL USERS IN DATABASE
 * Tests login with users that actually exist in your MongoDB database
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

// Based on your MongoDB screenshot, I can see this user exists
const EXISTING_USERS = [
  {
    email: 'giftyafisa@gmail.com',
    password: 'TestUser123!', // Let's try the standard password
    name: 'Afisa (from MongoDB)'
  },
  {
    email: 'giftyafisa@gmail.com', 
    password: '$2a$12$nP5/41I/Ec0HyLWHqU7X..IGMvuJYUqNquTWGunnNg4CNyqerXiaK', // The hashed password from DB
    name: 'Afisa (with hashed password)'
  },
  // Let's also try some of our test users
  {
    email: 'kwame.asante1@kelmah.test',
    password: 'TestUser123!',
    name: 'Kwame (test user)'
  },
  {
    email: 'tony.gate@kelmah.test',
    password: 'TestUser123!',
    name: 'Tony (test user)'
  }
];

async function testActualUsers() {
  console.log('🔍 TESTING ACTUAL USERS IN DATABASE');
  console.log('===================================');
  console.log('Based on your MongoDB Atlas data, testing real users...\n');

  for (const user of EXISTING_USERS) {
    console.log(`🔄 Testing: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password.substring(0, 20)}...`);

    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: user.email,
        password: user.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.data.token) {
        console.log(`   ✅ LOGIN SUCCESS!`);
        console.log(`   🎉 Found working credentials: ${user.email}`);
        console.log(`   👤 User: ${JSON.stringify(response.data.data?.user || response.data.user, null, 2)}`);
        console.log(`   🔑 Token: ${response.data.data?.token ? 'Received' : 'Not found'}`);
        
        // Test a protected endpoint
        if (response.data.data?.token || response.data.token) {
          const token = response.data.data?.token || response.data.token;
          try {
            const profileResponse = await axios.get(`${AUTH_SERVICE_URL}/api/users/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`   ✅ Protected endpoint works!`);
          } catch (error) {
            console.log(`   ⚠️  Protected endpoint failed: ${error.message}`);
          }
        }
        
        console.log('\n🎊 SUCCESS! Use these credentials in your frontend:');
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${user.password}`);
        console.log('=====================================\n');
        return; // Stop testing once we find working credentials
        
      } else {
        console.log(`   ❌ Login failed: No success/token in response`);
      }

    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`   ❌ Invalid credentials (401)`);
      } else if (error.response?.status) {
        console.log(`   ❌ HTTP ${error.response.status}: ${error.response.data?.message || error.message}`);
      } else {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line between tests
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🔍 ADDITIONAL DEBUGGING');
  console.log('========================');
  
  // Test auth service health
  try {
    const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('✅ Auth Service Health:', healthResponse.data);
  } catch (error) {
    console.log('❌ Auth Service Health failed:', error.message);
  }

  // Test registration endpoint to see what fields are required
  console.log('\n📝 Testing registration to understand required fields...');
  try {
    const regResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test' + Date.now() + '@test.com',
      password: 'TestPass123!',
      role: 'worker'
    });
    console.log('✅ Registration works! User format:', regResponse.data);
  } catch (error) {
    console.log('ℹ️  Registration response:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testActualUsers().catch(console.error);
}

module.exports = { testActualUsers };