#!/usr/bin/env node

/**
 * Test Job Service Fix
 * Tests if we can access the job service directly and fix the routing issue
 */

const axios = require('axios');

// Your ngrok URL
const JOB_SERVICE_URL = 'https://e7e63332d334.ngrok-free.app';

async function testJobServiceEndpoints() {
  console.log('🔍 Testing Job Service Endpoints...');
  console.log('🌍 Job Service URL:', JOB_SERVICE_URL);
  console.log('');

  // Test 1: Root endpoint
  try {
    const rootResponse = await axios.get(`${JOB_SERVICE_URL}/`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    console.log('✅ Root endpoint (/) accessible');
    console.log('📊 Response:', rootResponse.data.name);
  } catch (error) {
    console.log('❌ Root endpoint failed:', error.message);
  }

  // Test 2: Health endpoint
  try {
    const healthResponse = await axios.get(`${JOB_SERVICE_URL}/health`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    console.log('✅ Health endpoint (/health) accessible');
    console.log('📊 Response:', healthResponse.data.status);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }

  // Test 3: Jobs endpoint (this is the critical one)
  try {
    const jobsResponse = await axios.get(`${JOB_SERVICE_URL}/api/jobs`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    console.log('✅ Jobs endpoint (/api/jobs) accessible');
    console.log('📊 Response type:', typeof jobsResponse.data);
    console.log('📊 Response keys:', Object.keys(jobsResponse.data));
    
    // Check if it's the root response or actual jobs
    if (jobsResponse.data.name && jobsResponse.data.name.includes('Job Service API')) {
      console.log('⚠️  WARNING: Getting root endpoint response instead of jobs list');
      console.log('🔧 This confirms the API gateway routing issue');
    } else {
      console.log('✅ Getting actual jobs data');
    }
  } catch (error) {
    console.log('❌ Jobs endpoint failed:', error.message);
  }

  // Test 4: Try to get jobs with query parameters
  try {
    const jobsWithParams = await axios.get(`${JOB_SERVICE_URL}/api/jobs?limit=5`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    console.log('✅ Jobs endpoint with params accessible');
    console.log('📊 Response type:', typeof jobsWithParams.data);
  } catch (error) {
    console.log('❌ Jobs endpoint with params failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Testing Job Service Fix...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('');

  await testJobServiceEndpoints();
  
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 DIAGNOSIS');
  console.log('='.repeat(50));
  console.log('If you see "WARNING: Getting root endpoint response instead of jobs list"');
  console.log('then the issue is confirmed: the job service is not properly routing /api/jobs');
  console.log('');
  console.log('💡 SOLUTION: The API gateway needs to be configured to use the correct');
  console.log('   job service URL and the job service needs to handle /api/jobs properly.');
  console.log('');
  console.log('🔧 Next step: Fix the API gateway configuration on your other device.');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
