/**
 * Admin Script to Force Verify Test Users
 * Bypasses email verification for testing purposes
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://kelmah-auth-service.onrender.com';
const INPUT_FILE = path.join(__dirname, 'test-users-credentials.json');

// Load test users data
const testUsersData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

// Admin API Client
class AdminAPI {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async batchVerifyUsers(emails) {
    try {
      const response = await this.client.post('/api/admin/verify-users-batch', { emails });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  async forceVerifyUser(email) {
    try {
      const response = await this.client.post('/api/admin/verify-user', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  async loginUser(email, password) {
    try {
      const response = await this.client.post('/api/auth/login', {
        email,
        password
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
}

async function forceVerifyAllUsers() {
  console.log('🔑 Admin: Force Verifying All Test Users\n');
  
  const admin = new AdminAPI(API_BASE_URL);
  const emails = testUsersData.loginCredentials.map(user => user.email);
  
  console.log('📧 Batch verifying all test user emails...');
  console.log(`   Emails to verify: ${emails.length}`);
  
  // Use batch verification first
  const batchResult = await admin.batchVerifyUsers(emails);
  
  if (batchResult.success) {
    console.log('✅ Batch verification completed');
    console.log(`   ${batchResult.data.message}`);
    
    const verificationResults = batchResult.data.data;
    const verified = verificationResults.filter(r => r.success);
    const failed = verificationResults.filter(r => !r.success);
    
    console.log(`   • Successfully verified: ${verified.length}`);
    console.log(`   • Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\n⚠️  Failed verifications:');
      failed.forEach(f => {
        console.log(`   • ${f.email}: ${f.status}`);
      });
    }
  } else {
    console.log(`❌ Batch verification failed: ${batchResult.error}`);
    console.log('🔄 Falling back to individual verification...');
  }

  // Test logins for all users
  console.log('\n🔐 Testing logins for all users...');
  const loginResults = [];

  for (let i = 0; i < testUsersData.loginCredentials.length; i++) {
    const user = testUsersData.loginCredentials[i];
    
    console.log(`\n🔐 Testing login ${i + 1}/20: ${user.name}`);
    console.log(`   Email: ${user.email}`);

    const loginResult = await admin.loginUser(user.email, user.password);
    
    if (loginResult.success) {
      console.log('   ✅ Login successful');
      loginResults.push({
        ...user,
        status: 'verified_and_working',
        token: loginResult.data.token,
        loginSuccess: true
      });
    } else {
      console.log(`   ❌ Login failed: ${loginResult.error}`);
      loginResults.push({
        ...user,
        status: 'login_failed',
        error: loginResult.error,
        loginSuccess: false
      });
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  const workingUsers = loginResults.filter(r => r.loginSuccess);
  
  console.log('\n📊 Final Summary:');
  console.log(`   • Total Users: ${loginResults.length}`);
  console.log(`   • Working Logins: ${workingUsers.length}`);
  console.log(`   • Failed Logins: ${loginResults.length - workingUsers.length}`);

  if (workingUsers.length > 0) {
    console.log('\n✅ Ready-to-Use Login Credentials:');
    console.log('   ┌─────────────────────────────────────────────────────────────────┐');
    console.log('   │                    VERIFIED USER LOGINS                         │');
    console.log('   ├─────────────────────────────────────────────────────────────────┤');
    
    workingUsers.forEach((user, index) => {
      console.log(`   │ ${(index + 1).toString().padStart(2)}. ${user.name.padEnd(20)} │ ${user.profession.padEnd(12)} │`);
      console.log(`   │     Email: ${user.email.padEnd(35)} │`);
      console.log(`   │     Password: ${user.password.padEnd(31)} │`);
      if (index < workingUsers.length - 1) {
        console.log('   ├─────────────────────────────────────────────────────────────────┤');
      }
    });
    
    console.log('   └─────────────────────────────────────────────────────────────────┘');
  }

  // Save results
  const outputFile = path.join(__dirname, 'verified-users-final.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    processedAt: new Date().toISOString(),
    summary: {
      total: loginResults.length,
      working: workingUsers.length,
      failed: loginResults.length - workingUsers.length
    },
    workingUsers,
    allResults: loginResults,
    batchVerificationResult: batchResult
  }, null, 2));

  console.log(`\n💾 Final results saved to: ${outputFile}`);
  console.log(`🌐 Login URL: https://kelmah-frontend-mu.vercel.app/login`);

  return loginResults;
}

// Execute if run directly
if (require.main === module) {
  forceVerifyAllUsers().catch(console.error);
}

module.exports = { forceVerifyAllUsers }; 