#!/usr/bin/env node

/**
 * Test Render Deployment After Latest Fix
 * Tests the deployed user-service with authentication
 */

const axios = require('axios');

const LOCALTUNNEL_URL = 'https://kelmah-api.loca.lt';
const TEST_USER = {
  email: 'giftyafisa@gmail.com',
  password: '11221122Tg'
};

async function testRenderDeployment() {
  console.log('🚀 TESTING RENDER DEPLOYMENT (Commit 55d505c7)');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login');
    console.log('-'.repeat(70));
    console.log(`URL: ${LOCALTUNNEL_URL}/api/auth/login`);
    console.log(`User: ${TEST_USER.email}`);
    
    const loginResponse = await axios.post(`${LOCALTUNNEL_URL}/api/auth/login`, TEST_USER, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Login successful (${loginResponse.status})`);
    
    const { token, user } = loginResponse.data;
    console.log(`   User ID: ${user.id || user._id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Step 2: Test Dashboard Metrics
    console.log('\n📊 Step 2: Test Dashboard Metrics Endpoint');
    console.log('-'.repeat(70));
    console.log(`URL: ${LOCALTUNNEL_URL}/api/users/dashboard/metrics`);
    
    const startTime = Date.now();
    
    try {
      const metricsResponse = await axios.get(`${LOCALTUNNEL_URL}/api/users/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Dashboard metrics successful! (${metricsResponse.status}) - ${responseTime}ms`);
      console.log('\nMetrics Data:');
      console.log(JSON.stringify(metricsResponse.data, null, 2));
      
      console.log('\n' + '='.repeat(70));
      console.log('✅ FIX SUCCESSFUL! Commit 55d505c7 resolved the issue!');
      console.log('='.repeat(70));
      
    } catch (metricsError) {
      const responseTime = Date.now() - startTime;
      
      console.log(`❌ Dashboard metrics failed! (${metricsError.response?.status || 'NO_RESPONSE'}) - ${responseTime}ms`);
      
      if (metricsError.response) {
        console.log('\n❌ ERROR RESPONSE:');
        console.log(`   Status: ${metricsError.response.status}`);
        console.log(`   Status Text: ${metricsError.response.statusText}`);
        console.log(`   Data:`, metricsError.response.data);
        
        if (metricsError.response.data?.error) {
          console.log(`\n🔍 ERROR DETAILS:`);
          console.log(`   Message: ${metricsError.response.data.error}`);
          console.log(`   Stack: ${metricsError.response.data.stack || 'Not available'}`);
        }
      } else {
        console.log('\n❌ NO RESPONSE FROM SERVER');
        console.log(`   Error: ${metricsError.message}`);
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('❌ FIX DID NOT WORK - FURTHER INVESTIGATION NEEDED');
      console.log('='.repeat(70));
      
      throw metricsError;
    }
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(70));
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    } else {
      console.log(`Error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

testRenderDeployment();
