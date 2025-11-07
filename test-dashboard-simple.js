#!/usr/bin/env node

const axios = require('axios');

async function testDashboard() {
  try {
    // Step 1: Login
    console.log('🔐 Step 1: Login...');
        const loginResponse = await axios.post(
      'https://kelmah-api-gateway-nhxc.onrender.com/api/auth/login',
      {
        email: 'giftyafisa@gmail.com',
        password: '11221122Tg'
      },
      { timeout: 30000 }
    );

    if (!loginRes.data?.data?.token) {
      console.log('❌ No token received');
      return;
    }

    const token = loginRes.data.data.token;
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 30) + '...');

    // Step 2: Test dashboard metrics
    console.log('\n📊 Step 2: Testing dashboard metrics endpoint...');
    
    try {
      const metricsRes = await axios.get(
        'https://kelmah-api-gateway-nhxc.onrender.com/api/users/dashboard/metrics',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      console.log('✅ SUCCESS!');
      console.log('   Status:', metricsRes.status);
      console.log('   Data:', JSON.stringify(metricsRes.data, null, 2));

    } catch (metricsErr) {
      console.log('❌ DASHBOARD METRICS ERROR:');
      console.log('   Status:', metricsErr.response?.status);
      console.log('   Code:', metricsErr.code);
      console.log('   Message:', metricsErr.message);
      
      if (metricsErr.response?.data) {
        console.log('   Response Data:', JSON.stringify(metricsErr.response.data, null, 2));
      }

      // Check if it's a timeout
      if (metricsErr.code === 'ECONNABORTED') {
        console.log('\n⚠️ Request timed out after 60 seconds');
        console.log('   This suggests the service is hanging or stuck');
      }

      // Check if it's a 500 error
      if (metricsErr.response?.status === 500) {
        console.log('\n🔍 500 INTERNAL SERVER ERROR DETAILS:');
        console.log('   Message:', metricsErr.response.data?.message);
        if (metricsErr.response.data?.stack) {
          console.log('   Stack Trace:');
          console.log(metricsErr.response.data.stack);
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

testDashboard();
