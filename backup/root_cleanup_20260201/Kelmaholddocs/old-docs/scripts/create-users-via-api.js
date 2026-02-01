#!/usr/bin/env node

/**
 * 👥 CREATE USERS VIA AUTH API
 * Creates users through the working auth service API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

// Sample users to create
const SAMPLE_USERS = [
  {
    firstName: 'Kwame',
    lastName: 'Asante',
    email: 'kwame.asante1@kelmah.test',
    password: 'TestUser123!',
    role: 'worker',
    phone: '+233241001001'
  },
  {
    firstName: 'Samuel',
    lastName: 'Osei',
    email: 'samuel.osei@ghanaconstruction.com',
    password: 'TestUser123!',
    role: 'hirer',
    phone: '+233241002001'
  },
  {
    firstName: 'Efua',
    lastName: 'Mensah',
    email: 'efua.mensah@kelmah.test',
    password: 'TestUser123!',
    role: 'worker',
    phone: '+233241001002'
  },
  {
    firstName: 'Akosua',
    lastName: 'Mensah',
    email: 'akosua.mensah@goldstarbuilders.com',
    password: 'TestUser123!',
    role: 'hirer',
    phone: '+233241002002'
  },
  {
    firstName: 'Kwaku',
    lastName: 'Osei',
    email: 'kwaku.osei@kelmah.test',
    password: 'TestUser123!',
    role: 'worker',
    phone: '+233241001003'
  }
];

async function createUsersViaAPI() {
  console.log('👥 CREATING USERS VIA AUTH API');
  console.log('==============================');

  const results = [];
  let successCount = 0;

  for (let i = 0; i < SAMPLE_USERS.length; i++) {
    const user = SAMPLE_USERS[i];
    console.log(`\n🔄 Creating user ${i + 1}/${SAMPLE_USERS.length}: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, user, {
        timeout: 15000
      });

      if (response.data.success) {
        console.log(`   ✅ Registration successful!`);
        successCount++;
        
        results.push({
          ...user,
          status: 'created',
          message: response.data.message,
          needsVerification: true
        });
      } else {
        console.log(`   ❌ Registration failed: ${response.data.message}`);
        results.push({
          ...user,
          status: 'failed',
          error: response.data.message
        });
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`   ℹ️  User already exists`);
        results.push({
          ...user,
          status: 'exists',
          message: 'User already exists in database'
        });
      } else {
        console.log(`   ❌ Registration failed: ${error.response?.data?.message || error.message}`);
        results.push({
          ...user,
          status: 'error',
          error: error.response?.data?.message || error.message
        });
      }
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save results
  const outputFile = path.join(__dirname, 'created-users-results.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalUsers: SAMPLE_USERS.length,
    successCount,
    results
  }, null, 2));

  console.log('\n📊 CREATION SUMMARY:');
  console.log('====================');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`⚠️  Already existed: ${results.filter(r => r.status === 'exists').length} users`);
  console.log(`❌ Failed: ${results.filter(r => r.status === 'failed' || r.status === 'error').length} users`);
  
  const createdUsers = results.filter(r => r.status === 'created');
  if (createdUsers.length > 0) {
    console.log('\n🔑 CREATED USERS (NEED EMAIL VERIFICATION):');
    console.log('===========================================');
    createdUsers.forEach(user => {
      console.log(`📧 ${user.email} (${user.role}) - Password: ${user.password}`);
    });
    
    console.log('\n⚠️  IMPORTANT: These users need email verification before login!');
    console.log('Check your email for verification links or use MongoDB to set isEmailVerified: true');
  }

  const existingUsers = results.filter(r => r.status === 'exists');
  if (existingUsers.length > 0) {
    console.log('\n👤 EXISTING USERS (TRY LOGIN):');
    console.log('=============================');
    existingUsers.forEach(user => {
      console.log(`🔑 ${user.email} (${user.role}) - Password: ${user.password}`);
    });
    
    console.log('\n✅ Try logging in with these - they might already be verified!');
  }

  console.log(`\n💾 Detailed results saved to: ${outputFile}`);
  
  return results;
}

// Test login with existing users
async function testLoginWithResults(results) {
  console.log('\n🔐 TESTING LOGIN WITH CREATED/EXISTING USERS');
  console.log('============================================');

  const usersToTest = results.filter(r => r.status === 'created' || r.status === 'exists');

  for (const user of usersToTest) {
    console.log(`\n🔄 Testing login: ${user.email}`);
    
    try {
      const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: user.email,
        password: user.password
      });

      if (loginResponse.data.success || loginResponse.data.data?.token) {
        console.log(`   🎉 LOGIN SUCCESS!`);
        console.log(`   ✅ Email: ${user.email}`);
        console.log(`   ✅ Password: ${user.password}`);
        console.log(`   ✅ Role: ${loginResponse.data.data?.user?.role || 'unknown'}`);
        console.log(`   ✅ Name: ${loginResponse.data.data?.user?.firstName} ${loginResponse.data.data?.user?.lastName}`);
        
        console.log('\n🎊 WORKING CREDENTIALS FOUND!');
        console.log('============================');
        console.log(`✅ Email: ${user.email}`);
        console.log(`✅ Password: ${user.password}`);
        console.log('Use these in your frontend!');
        
        return { email: user.email, password: user.password, user: loginResponse.data.data?.user };
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`   ❌ Login failed: Invalid credentials or needs verification`);
      } else if (error.response?.status === 423) {
        console.log(`   ⏰ Account locked (too many attempts)`);
      } else {
        console.log(`   ❌ Login failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return null;
}

async function main() {
  try {
    const results = await createUsersViaAPI();
    const workingCredentials = await testLoginWithResults(results);
    
    if (!workingCredentials) {
      console.log('\n💡 NEXT STEPS:');
      console.log('===============');
      console.log('1. Check your email for verification links');
      console.log('2. Verify any newly created accounts');
      console.log('3. Try login again with verified accounts');
      console.log('4. Or wait 30 minutes if accounts are locked');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createUsersViaAPI };