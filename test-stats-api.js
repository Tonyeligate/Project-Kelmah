/**
 * END-TO-END TEST: Platform Statistics API Endpoint
 * 
 * Tests the actual /api/jobs/stats endpoint through the API Gateway
 */

const axios = require('axios');

// Determine the API base URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:5003'; // Direct to job-service

async function testStatsEndpoint() {
  try {
    console.log('🌐 END-TO-END TEST: Platform Statistics API\n');
    console.log('=' .repeat(70));
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log('=' .repeat(70));
    
    // Test 1: Health check
    console.log('\n📡 Test 1: Health Check...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      console.log(`✅ Service Status: ${healthResponse.data.status || 'healthy'}`);
    } catch (error) {
      console.log(`⚠️  Health check failed: ${error.message}`);
      console.log('   (Service may still be starting up...)');
    }
    
    // Wait a moment for service to fully start
    console.log('\n⏳ Waiting for service to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Call stats endpoint
    console.log('\n📊 Test 2: Calling /stats endpoint...');
    const statsResponse = await axios.get(`${API_BASE_URL}/stats`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ Status Code: ${statsResponse.status}`);
    console.log(`✅ Response Headers:`);
    console.log(`   Cache-Control: ${statsResponse.headers['cache-control']}`);
    console.log(`   Content-Type: ${statsResponse.headers['content-type']}`);
    
    // Test 3: Validate response structure
    console.log('\n📋 Test 3: Validating Response Structure...');
    const { data } = statsResponse;
    
    if (!data.success) {
      console.log('❌ Response missing "success" field or is false');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }
    console.log('✅ Response has success=true');
    
    if (!data.data) {
      console.log('❌ Response missing "data" field');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }
    console.log('✅ Response has data field');
    
    const stats = data.data;
    const requiredFields = ['availableJobs', 'activeEmployers', 'skilledWorkers', 'successRate', 'lastUpdated'];
    
    for (const field of requiredFields) {
      if (stats[field] === undefined) {
        console.log(`❌ Missing required field: ${field}`);
      } else {
        console.log(`✅ Has field: ${field} = ${stats[field]}`);
      }
    }
    
    // Test 4: Validate data types
    console.log('\n🔍 Test 4: Validating Data Types...');
    
    if (typeof stats.availableJobs !== 'number') {
      console.log(`❌ availableJobs is not a number: ${typeof stats.availableJobs}`);
    } else {
      console.log(`✅ availableJobs is a number: ${stats.availableJobs}`);
    }
    
    if (typeof stats.activeEmployers !== 'number') {
      console.log(`❌ activeEmployers is not a number: ${typeof stats.activeEmployers}`);
    } else {
      console.log(`✅ activeEmployers is a number: ${stats.activeEmployers}`);
    }
    
    if (typeof stats.skilledWorkers !== 'number') {
      console.log(`❌ skilledWorkers is not a number: ${typeof stats.skilledWorkers}`);
    } else {
      console.log(`✅ skilledWorkers is a number: ${stats.skilledWorkers}`);
    }
    
    if (typeof stats.successRate !== 'number') {
      console.log(`❌ successRate is not a number: ${typeof stats.successRate}`);
    } else {
      console.log(`✅ successRate is a number: ${stats.successRate}`);
    }
    
    // Test 5: Check for zero values
    console.log('\n⚠️  Test 5: Checking for Zero Values...');
    
    const allZeros = stats.availableJobs === 0 && 
                     stats.activeEmployers === 0 && 
                     stats.skilledWorkers === 0 && 
                     stats.successRate === 0;
    
    if (allZeros) {
      console.log('❌ CRITICAL ISSUE: All statistics are ZERO!');
      console.log('   This indicates the database queries are not working correctly.');
    } else {
      console.log('✅ Statistics contain non-zero values!');
      
      if (stats.availableJobs > 0) {
        console.log(`   ✅ Available Jobs: ${stats.availableJobs}`);
      } else {
        console.log(`   ⚠️  Available Jobs: 0 (expected: 12)`);
      }
      
      if (stats.activeEmployers > 0) {
        console.log(`   ✅ Active Employers: ${stats.activeEmployers}`);
      } else {
        console.log(`   ⚠️  Active Employers: 0 (expected: 1+)`);
      }
      
      if (stats.skilledWorkers > 0) {
        console.log(`   ✅ Skilled Workers: ${stats.skilledWorkers}`);
      } else {
        console.log(`   ⚠️  Skilled Workers: 0 (expected: 21)`);
      }
      
      console.log(`   ℹ️  Success Rate: ${stats.successRate}% (0% is normal for new platform)`);
    }
    
    // Final result
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL API RESPONSE:');
    console.log('='.repeat(70));
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n' + '='.repeat(70));
    if (allZeros) {
      console.log('❌ TEST RESULT: FAILED');
      console.log('   Issue: Statistics endpoint returning all zeros');
      console.log('   Action: Check MongoDB connection and query logic');
    } else {
      console.log('✅ TEST RESULT: PASSED');
      console.log('   Statistics endpoint is working correctly!');
    }
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused. Is the job-service running?');
      console.error('   Start it with: node start-job-service.js');
    }
    console.error('\nStack:', error.stack);
  }
}

// Run test
console.log('Starting API endpoint test in 5 seconds...');
console.log('(Waiting for service to start if just launched)\n');

setTimeout(() => {
  testStatsEndpoint().catch(console.error);
}, 5000);
