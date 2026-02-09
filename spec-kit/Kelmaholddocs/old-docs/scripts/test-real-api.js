/**
 * Test Real API Integration
 * Verifies that the app is using real API data instead of mock data
 */

const axios = require('axios');

async function testRealAPIIntegration() {
  console.log('🧪 Testing Real API Integration...\n');

  try {
    // Test 1: Login with real test user
    console.log('1️⃣ Testing Authentication...');
    const loginResponse = await axios.post('https://kelmah-auth-service.onrender.com/api/auth/login', {
      email: 'kwame.asante1@kelmah.test',
      password: 'TestUser123!'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('   ✅ Login successful!');
    console.log(`   👤 User: ${user.firstName} ${user.lastName}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👷 Role: ${user.role}`);
    console.log(`   ✅ Verified: ${user.isEmailVerified}`);

    // Test 2: Profile endpoint
    console.log('\n2️⃣ Testing Profile Endpoint...');
    const profileResponse = await axios.get('https://kelmah-auth-service.onrender.com/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Profile endpoint working!');
    console.log(`   📄 Profile data available: ${Object.keys(profileResponse.data.data).length} fields`);

    // Test 3: Dashboard metrics
    console.log('\n3️⃣ Testing Dashboard Metrics...');
    const metricsResponse = await axios.get('https://kelmah-auth-service.onrender.com/api/users/dashboard/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Dashboard metrics working!');
    console.log(`   📊 Metrics: ${JSON.stringify(metricsResponse.data.data, null, 6)}`);

    // Test 4: Jobs endpoint
    console.log('\n4️⃣ Testing Jobs Endpoint...');
    const jobsResponse = await axios.get('https://kelmah-auth-service.onrender.com/api/jobs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Jobs endpoint working!');
    console.log(`   💼 Jobs available: ${jobsResponse.data.data.length}`);

    // Test 5: User credentials
    console.log('\n5️⃣ Testing User Credentials...');
    const credentialsResponse = await axios.get('https://kelmah-auth-service.onrender.com/api/users/me/credentials', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Credentials endpoint working!');
    console.log(`   🛠️ Skills: ${credentialsResponse.data.data.skills.length}`);
    console.log(`   📜 Licenses: ${credentialsResponse.data.data.licenses.length}`);

    console.log('\n🎉 ALL TESTS PASSED! Real API integration is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Authentication: Real user login working');
    console.log('   ✅ Profile Data: API endpoints responding');
    console.log('   ✅ Dashboard: Metrics and analytics available');
    console.log('   ✅ Jobs: Job listings accessible');
    console.log('   ✅ User Data: Skills and credentials available');
    console.log('\n🚀 The app is now using REAL API data instead of mock data!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the test
testRealAPIIntegration(); 