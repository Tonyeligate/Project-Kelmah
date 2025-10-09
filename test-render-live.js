#!/usr/bin/env node

/**
 * Test Live Render Deployment
 * Direct test of deployed user-service on Render
 */

const axios = require('axios');

const AUTH_SERVICE = 'https://project-kelmah-6i4g.onrender.com';
const USER_SERVICE = 'https://kelmah-user-service-47ot.onrender.com';

async function testLiveRender() {
  console.log('\n🚀 TESTING LIVE RENDER DEPLOYMENT');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login to Auth Service');
    console.log(`URL: ${AUTH_SERVICE}/auth/login`);
    
    const loginResponse = await axios.post(`${AUTH_SERVICE}/auth/login`, {
      email: 'giftyafisa@gmail.com',
      password: '11221122Tg'
    });
    
    console.log('✅ Login successful!');
    console.log(`User: ${loginResponse.data.user.email}`);
    console.log(`Role: ${loginResponse.data.user.role}`);
    
    const token = loginResponse.data.token;
    console.log(`Token: ${token.substring(0, 50)}...`);
    
    // Step 2: Test Dashboard Metrics
    console.log('\n📊 Step 2: Test Dashboard Metrics');
    console.log(`URL: ${USER_SERVICE}/api/users/dashboard/metrics`);
    
    const startTime = Date.now();
    
    try {
      const metricsResponse = await axios.get(`${USER_SERVICE}/api/users/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`\n✅ DASHBOARD METRICS SUCCESS! (${responseTime}ms)`);
      console.log('\nMetrics Data:');
      console.log(JSON.stringify(metricsResponse.data, null, 2));
      
      console.log('\n' + '='.repeat(70));
      console.log('✅✅✅ FIX SUCCESSFUL! Commit 55d505c7 RESOLVED THE ISSUE! ✅✅✅');
      console.log('='.repeat(70));
      
      process.exit(0);
      
    } catch (metricsError) {
      const responseTime = Date.now() - startTime;
      
      console.log(`\n❌ DASHBOARD METRICS FAILED! (${responseTime}ms)`);
      console.log(`Status: ${metricsError.response?.status || 'NO_RESPONSE'}`);
      
      if (metricsError.response) {
        console.log('\nError Response:');
        console.log(JSON.stringify(metricsError.response.data, null, 2));
      } else {
        console.log(`Error: ${metricsError.message}`);
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('❌ FIX DID NOT WORK - Further investigation needed');
      console.log('='.repeat(70));
      
      process.exit(1);
    }
    
  } catch (error) {
    console.log('\n❌ TEST FAILED');
    console.log(`Error: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

testLiveRender();
