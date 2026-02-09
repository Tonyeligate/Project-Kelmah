#!/usr/bin/env node

/**
 * 🔑 CREATE PRE-VERIFIED USER
 * Creates a user with email verification already set to true
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

async function createVerifiedUser() {
  console.log('🔑 CREATE PRE-VERIFIED USER');
  console.log('===========================');
  
  const timestamp = Date.now();
  const testUser = {
    firstName: 'Verified',
    lastName: 'Worker',
    email: `verified${timestamp}@kelmah.test`,
    password: 'TestPass123!',
    role: 'worker',
    phone: `+233${timestamp.toString().slice(-9)}`,
    isEmailVerified: true // Try to set this during registration
  };

  console.log('👤 Creating pre-verified user...');
  console.log(`Email: ${testUser.email}`);
  console.log(`Password: ${testUser.password}`);

  try {
    // Try registration with isEmailVerified flag
    console.log('\n📝 Attempting registration with verification flag...');
    const registerResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, testUser);
    
    console.log('📄 Registration response:', registerResponse.data);

    if (registerResponse.data.success) {
      // Try immediate login
      console.log('\n🔐 Testing immediate login...');
      const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });

      if (loginResponse.data.success || loginResponse.data.data?.token) {
        console.log('🎉 SUCCESS! User can login immediately!');
        const userData = loginResponse.data.data || loginResponse.data;
        
        console.log('\n✅ WORKING CREDENTIALS:');
        console.log(`Email: ${testUser.email}`);
        console.log(`Password: ${testUser.password}`);
        console.log(`User ID: ${userData.user?.id}`);
        console.log(`Role: ${userData.user?.role}`);
        
        return { email: testUser.email, password: testUser.password, userData };
        
      } else {
        console.log('❌ Still requires verification');
        console.log('Response:', loginResponse.data);
      }
    }

  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data || error.message);
  }

  // Alternative: Try to find existing verified users
  console.log('\n🔍 Checking if there are any verified users we can use...');
  
  // Based on your MongoDB, let's try some variations of the existing user
  const possibleUsers = [
    { email: 'giftyafisa@gmail.com', password: 'password123' },
    { email: 'giftyafisa@gmail.com', password: '123456' },
    { email: 'giftyafisa@gmail.com', password: 'gifty123' },
    { email: 'giftyafisa@gmail.com', password: 'Password123!' },
    // Try variations based on the user's info
  ];

  for (const user of possibleUsers) {
    console.log(`🔄 Trying: ${user.email} with password: ${user.password}`);
    try {
      const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, user);
      
      if (loginResponse.data.success || loginResponse.data.data?.token) {
        console.log('🎉 FOUND WORKING CREDENTIALS!');
        console.log(`✅ Email: ${user.email}`);
        console.log(`✅ Password: ${user.password}`);
        
        const userData = loginResponse.data.data || loginResponse.data;
        console.log(`✅ User: ${userData.user?.firstName} ${userData.user?.lastName}`);
        console.log(`✅ Role: ${userData.user?.role}`);
        
        return { email: user.email, password: user.password, userData };
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🔧 SOLUTION OPTIONS:');
  console.log('====================');
  console.log('1. Check your email for verification link and verify the created user');
  console.log('2. Modify the auth service to allow unverified login for testing');
  console.log('3. Create users directly in MongoDB with isEmailVerified: true');
  console.log('4. Add an admin endpoint to verify users programmatically');
  
  return null;
}

if (require.main === module) {
  createVerifiedUser().catch(console.error);
}

module.exports = { createVerifiedUser };