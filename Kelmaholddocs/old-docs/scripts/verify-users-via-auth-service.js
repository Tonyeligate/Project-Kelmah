#!/usr/bin/env node

/**
 * 🔓 VERIFY USERS VIA AUTH SERVICE
 * Alternative method to verify users using the Auth Service API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';

// Test users for login verification
const TEST_USERS = [
  { email: 'kwame.asante1@kelmah.test', name: 'Kwame Asante', role: 'worker' },
  { email: 'samuel.osei@ghanaconstruction.com', name: 'Samuel Osei', role: 'hirer' },
  { email: 'efua.mensah@kelmah.test', name: 'Efua Mensah', role: 'worker' },
  { email: 'akosua.mensah@goldstarbuilders.com', name: 'Akosua Mensah', role: 'hirer' },
  { email: 'kwaku.osei@kelmah.test', name: 'Kwaku Osei', role: 'worker' }
];

async function testUserLogins() {
  console.log('🔑 TESTING USER LOGIN STATUS');
  console.log('=============================');
  console.log('Testing sample users to check verification status...\n');
  
  const results = {
    canLogin: [],
    needsVerification: [],
    errors: []
  };
  
  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i];
    console.log(`🔄 Testing ${i + 1}/${TEST_USERS.length}: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: user.email,
        password: 'TestUser123!'
      }, { timeout: 10000 });
      
      if (response.data.success || response.data.data?.token) {
        console.log(`   🎉 LOGIN SUCCESS! User is verified and ready!`);
        results.canLogin.push({
          ...user,
          token: response.data.data?.token || response.data.token
        });
      } else {
        console.log(`   ❓ Unexpected response`);
        results.errors.push({ ...user, error: 'Unexpected response' });
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        if (error.response.data?.message?.includes('verify your email')) {
          console.log(`   📧 NEEDS EMAIL VERIFICATION`);
          results.needsVerification.push(user);
        } else if (error.response.data?.message?.includes('Incorrect email or password')) {
          console.log(`   ❌ Invalid credentials (user may not exist)`);
          results.errors.push({ ...user, error: 'Invalid credentials' });
        } else {
          console.log(`   ❌ Auth error: ${error.response.data.message}`);
          results.errors.push({ ...user, error: error.response.data.message });
        }
      } else {
        console.log(`   ❓ Network error: ${error.message}`);
        results.errors.push({ ...user, error: error.message });
      }
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function generateManualInstructions(results) {
  console.log('\n📊 USER VERIFICATION STATUS');
  console.log('============================');
  console.log(`✅ Ready to Login: ${results.canLogin.length} users`);
  console.log(`📧 Need Verification: ${results.needsVerification.length} users`);
  console.log(`❌ Errors/Not Found: ${results.errors.length} users`);
  
  if (results.canLogin.length > 0) {
    console.log('\n🎉 USERS READY FOR IMMEDIATE LOGIN:');
    console.log('===================================');
    results.canLogin.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: TestUser123!`);
      console.log('');
    });
    
    console.log('🚀 LOGIN NOW:');
    console.log('=============');
    console.log('1. Go to: https://kelmah-frontend-mu.vercel.app/login');
    console.log(`2. Use any email above with password: TestUser123!`);
    console.log('3. You should be able to login immediately!');
  }
  
  if (results.needsVerification.length > 0 || results.errors.length > 0) {
    console.log('\n📧 MANUAL VERIFICATION NEEDED');
    console.log('==============================');
    console.log('Since we cannot connect to MongoDB directly due to SSL issues,');
    console.log('here are the MANUAL STEPS to verify your users:');
    
    console.log('\n🔧 OPTION 1: MongoDB Atlas Dashboard (Recommended)');
    console.log('==================================================');
    console.log('1. Open: https://cloud.mongodb.com/');
    console.log('2. Login to your MongoDB Atlas account');
    console.log('3. Navigate to your cluster → Browse Collections');
    console.log('4. Find the database containing users (likely "kelmah" or "auth")');
    console.log('5. Open the "users" collection');
    console.log('6. Find user: kwame.asante1@kelmah.test');
    console.log('7. Click "Edit Document"');
    console.log('8. Find the field "isEmailVerified" and change it to: true');
    console.log('9. Click "Update"');
    console.log('10. Repeat for other users as needed');
    
    console.log('\n🔧 OPTION 2: MongoDB Compass (Desktop App)');
    console.log('===========================================');
    console.log('1. Download MongoDB Compass from: https://www.mongodb.com/products/compass');
    console.log('2. Connect using your connection string');
    console.log('3. Navigate to the users collection');
    console.log('4. Find and edit user documents to set isEmailVerified: true');
    
    console.log('\n🔧 OPTION 3: Quick Single User Test');
    console.log('====================================');
    console.log('To test the platform immediately:');
    console.log('1. Go to MongoDB Atlas → Browse Collections');
    console.log('2. Find ONE user: kwame.asante1@kelmah.test');
    console.log('3. Set "isEmailVerified": true');
    console.log('4. Save the document');
    console.log('5. Login immediately with:');
    console.log('   📧 Email: kwame.asante1@kelmah.test');
    console.log('   🔑 Password: TestUser123!');
    
    console.log('\n🎯 PRIORITY USERS TO VERIFY FIRST:');
    console.log('===================================');
    console.log('For quick testing, verify these key users:');
    console.log('1. kwame.asante1@kelmah.test (Worker - Plumber)');
    console.log('2. samuel.osei@ghanaconstruction.com (Hirer - Construction)');
    console.log('3. efua.mensah@kelmah.test (Worker - Plumber)');
    console.log('4. akosua.mensah@goldstarbuilders.com (Hirer - Construction)');
    console.log('5. kwaku.osei@kelmah.test (Worker - Electrician)');
  }
  
  // Save report
  const reportFile = path.join(__dirname, 'MANUAL-VERIFICATION-GUIDE.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    testResults: results,
    manualSteps: {
      mongodbAtlasUrl: 'https://cloud.mongodb.com/',
      priorityUsers: [
        'kwame.asante1@kelmah.test',
        'samuel.osei@ghanaconstruction.com',
        'efua.mensah@kelmah.test'
      ],
      loginUrl: 'https://kelmah-frontend-mu.vercel.app/login',
      password: 'TestUser123!'
    }
  }, null, 2));
  
  console.log(`\n💾 Manual guide saved to: ${reportFile}`);
}

async function main() {
  console.log('🎯 USER VERIFICATION STATUS CHECK');
  console.log('==================================');
  console.log('Checking which users can login and providing manual verification guide...\n');
  
  try {
    // Test sample users
    const results = await testUserLogins();
    
    // Generate manual instructions
    await generateManualInstructions(results);
    
    console.log('\n🎊 VERIFICATION STATUS CHECK COMPLETE!');
    console.log('======================================');
    
    if (results.canLogin.length > 0) {
      console.log(`✅ GREAT NEWS: ${results.canLogin.length} users are already verified and ready!`);
      console.log('🚀 You can login and test your platform immediately!');
    } else {
      console.log('📧 Users need manual verification in MongoDB Atlas');
      console.log('💡 Follow the detailed instructions above');
    }
    
    console.log('\n🌟 NEXT STEPS:');
    if (results.canLogin.length > 0) {
      console.log('1. Login with any verified user above');
      console.log('2. Test your fully functional Kelmah platform!');
    } else {
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Set isEmailVerified: true for kwame.asante1@kelmah.test');
      console.log('3. Login and enjoy your platform!');
    }
    
  } catch (error) {
    console.error('\n❌ Status check failed:', error.message);
  }
}

if (require.main === module) {
  main();
}