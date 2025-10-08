#!/usr/bin/env node

/**
 * Test Dashboard Endpoints with Authentication
 * Diagnoses the actual 500 error by testing with real user credentials
 */

const axios = require('axios');

const API_BASE = 'https://kelmah-api-gateway-5loa.onrender.com/api';

async function testDashboard() {
  console.log('🧪 TESTING AUTHENTICATED DASHBOARD REQUESTS');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login to get authentication token...');
    
    // Try multiple test users
    const testCredentials = [
      { email: 'giftyafisa@gmail.com', password: '11221122Tg', name: 'Gifty' },
      { email: 'test@example.com', password: 'TestUser123!', name: 'Test User' },
    ];

    let token = null;
    let loginSuccess = false;

    for (const creds of testCredentials) {
      try {
        console.log(`\n  Trying: ${creds.name} (${creds.email})...`);
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
          email: creds.email,
          password: creds.password
        });

        if (loginRes.data.token) {
          token = loginRes.data.token;
          loginSuccess = true;
          console.log(`  ✅ Login successful with ${creds.name}!`);
          console.log(`  Token (first 20 chars): ${token.substring(0, 20)}...`);
          break;
        }
      } catch (loginErr) {
        console.log(`  ❌ Failed: ${loginErr.response?.data?.message || loginErr.message}`);
      }
    }

    if (!loginSuccess) {
      console.log('\n❌ ALL LOGIN ATTEMPTS FAILED');
      console.log('\n💡 Possible solutions:');
      console.log('   1. Run: node create-gifty-user.js');
      console.log('   2. Check if user exists in database');
      console.log('   3. Verify password hash in database');
      return;
    }

    // Step 2: Test Dashboard Metrics
    console.log('\n\n📊 Step 2: Testing /api/users/dashboard/metrics...');
    try {
      const metricsRes = await axios.get(`${API_BASE}/users/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('  ✅ SUCCESS! Status:', metricsRes.status);
      console.log('  Response:', JSON.stringify(metricsRes.data, null, 2));
    } catch (metricsErr) {
      console.log('  ❌ FAILED! Status:', metricsErr.response?.status);
      console.log('  Error:', JSON.stringify(metricsErr.response?.data || metricsErr.message, null, 2));
      
      if (metricsErr.response?.status === 500) {
        console.log('\n  🔍 500 ERROR DETAILS:');
        console.log('  Message:', metricsErr.response?.data?.message);
        console.log('  Stack:', metricsErr.response?.data?.stack?.substring(0, 500));
      }
    }

    // Step 3: Test Dashboard Workers
    console.log('\n\n👷 Step 3: Testing /api/users/dashboard/workers...');
    try {
      const workersRes = await axios.get(`${API_BASE}/users/dashboard/workers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('  ✅ SUCCESS! Status:', workersRes.status);
      console.log('  Response:', JSON.stringify(workersRes.data, null, 2));
    } catch (workersErr) {
      console.log('  ❌ FAILED! Status:', workersErr.response?.status);
      console.log('  Error:', JSON.stringify(workersErr.response?.data || workersErr.message, null, 2));
      
      if (workersErr.response?.status === 500) {
        console.log('\n  🔍 500 ERROR DETAILS:');
        console.log('  Message:', workersErr.response?.data?.message);
        console.log('  Stack:', workersErr.response?.data?.stack?.substring(0, 500));
      }
    }

    // Step 4: Test Dashboard Analytics
    console.log('\n\n📈 Step 4: Testing /api/users/dashboard/analytics...');
    try {
      const analyticsRes = await axios.get(`${API_BASE}/users/dashboard/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('  ✅ SUCCESS! Status:', analyticsRes.status);
      console.log('  Response:', JSON.stringify(analyticsRes.data, null, 2));
    } catch (analyticsErr) {
      console.log('  ❌ FAILED! Status:', analyticsErr.response?.status);
      console.log('  Error:', JSON.stringify(analyticsErr.response?.data || analyticsErr.message, null, 2));
      
      if (analyticsErr.response?.status === 500) {
        console.log('\n  🔍 500 ERROR DETAILS:');
        console.log('  Message:', analyticsErr.response?.data?.message);
        console.log('  Stack:', analyticsErr.response?.data?.stack?.substring(0, 500));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:');
    console.error(error);
  }
}

// Run the test
testDashboard();
