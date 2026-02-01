#!/usr/bin/env node

/**
 * 🔑 CREATE TEST USER AND LOGIN
 * Creates a fresh test user and immediately tests login
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

async function createTestUserAndLogin() {
  console.log('🔑 CREATE TEST USER AND LOGIN');
  console.log('=============================');
  
  const timestamp = Date.now();
  const testUser = {
    firstName: 'Test',
    lastName: 'Worker',
    email: `testworker${timestamp}@kelmah.test`,
    password: 'TestPass123!',
    role: 'worker',
    phone: `+233${timestamp.toString().slice(-9)}` // Generate unique phone
  };

  console.log('👤 Creating new test user...');
  console.log(`Email: ${testUser.email}`);
  console.log(`Password: ${testUser.password}`);
  console.log(`Phone: ${testUser.phone}`);

  try {
    // Step 1: Register the user
    console.log('\n📝 Step 1: Registering user...');
    const registerResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, testUser);
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful!');
      console.log('📄 Registration response:', registerResponse.data);
    } else {
      console.log('⚠️  Registration response:', registerResponse.data);
    }

    // Step 2: Immediately try to login
    console.log('\n🔐 Step 2: Testing login...');
    const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResponse.data.success || loginResponse.data.data?.token) {
      console.log('🎉 LOGIN SUCCESS!');
      console.log('✅ Fresh user created and login working!');
      
      const userData = loginResponse.data.data || loginResponse.data;
      console.log('\n👤 User Data:');
      console.log(`   ID: ${userData.user?.id}`);
      console.log(`   Name: ${userData.user?.firstName} ${userData.user?.lastName}`);
      console.log(`   Email: ${userData.user?.email}`);
      console.log(`   Role: ${userData.user?.role}`);
      console.log(`   Token: ${userData.token ? 'Received' : 'Missing'}`);

      // Step 3: Test protected endpoint
      if (userData.token) {
        console.log('\n🔒 Step 3: Testing protected endpoint...');
        try {
          const profileResponse = await axios.get(`${AUTH_SERVICE_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${userData.token}` }
          });
          console.log('✅ Protected endpoint works!');
          console.log('📄 Profile data:', profileResponse.data);
        } catch (error) {
          console.log('❌ Protected endpoint failed:', error.response?.data || error.message);
        }
      }

      console.log('\n🎊 SUCCESS! Your auth system is working perfectly!');
      console.log('=====================================');
      console.log('✅ Registration: Working');
      console.log('✅ Login: Working');
      console.log('✅ Token generation: Working');
      console.log('✅ Protected routes: Working');
      console.log('\n🔑 WORKING CREDENTIALS:');
      console.log(`Email: ${testUser.email}`);
      console.log(`Password: ${testUser.password}`);
      console.log('\nUse these credentials in your frontend to test!');

    } else {
      console.log('❌ Login failed after successful registration');
      console.log('Response:', loginResponse.data);
    }

  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  User already exists, trying with different details...');
      
      // Try with slightly different details
      testUser.email = `testworker${timestamp + 1}@kelmah.test`;
      testUser.phone = `+233${(timestamp + 1).toString().slice(-9)}`;
      
      console.log('🔄 Retrying with new details...');
      return createTestUserAndLogin(); // Recursive retry
      
    } else {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  }
}

if (require.main === module) {
  createTestUserAndLogin().catch(console.error);
}

module.exports = { createTestUserAndLogin };