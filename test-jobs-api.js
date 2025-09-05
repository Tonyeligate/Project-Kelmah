#!/usr/bin/env node

/**
 * Test Jobs API Script
 * This script tests the job service API to see if it's working and if there are jobs in the database
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000'; // API Gateway URL
const JOB_SERVICE_URL = 'http://localhost:5003'; // Direct job service URL

async function testJobsAPI() {
  console.log('🔍 Testing Jobs API...\n');

  // Test 1: Direct Job Service
  console.log('1️⃣ Testing Direct Job Service...');
  try {
    const response = await axios.get(`${JOB_SERVICE_URL}/api/jobs`, {
      timeout: 5000,
      params: { limit: 10 }
    });
    console.log('✅ Direct Job Service Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Direct Job Service Error:');
    console.log(`   Status: ${error.response?.status || 'No response'}`);
    console.log(`   Message: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: API Gateway
  console.log('2️⃣ Testing API Gateway...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/jobs`, {
      timeout: 5000,
      params: { limit: 10 }
    });
    console.log('✅ API Gateway Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ API Gateway Error:');
    console.log(`   Status: ${error.response?.status || 'No response'}`);
    console.log(`   Message: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Health Check
  console.log('3️⃣ Testing Health Checks...');
  
  try {
    const jobHealth = await axios.get(`${JOB_SERVICE_URL}/health`, { timeout: 3000 });
    console.log('✅ Job Service Health:', jobHealth.data);
  } catch (error) {
    console.log('❌ Job Service Health Error:', error.message);
  }

  try {
    const gatewayHealth = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    console.log('✅ API Gateway Health:', gatewayHealth.data);
  } catch (error) {
    console.log('❌ API Gateway Health Error:', error.message);
  }
}

// Run the test
testJobsAPI().catch(console.error);
