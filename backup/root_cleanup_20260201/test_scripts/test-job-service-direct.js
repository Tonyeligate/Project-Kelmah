#!/usr/bin/env node

/**
 * Test Job Service Direct Access
 * Tests if the job service is properly handling routes
 */

const axios = require('axios');

// Your ngrok URL
const JOB_SERVICE_URL = 'https://e7e63332d334.ngrok-free.app';

async function testJobServiceRoutes() {
  console.log('🔍 Testing Job Service Routes...');
  console.log('🌍 Job Service URL:', JOB_SERVICE_URL);
  console.log('');

  // Test 1: Root endpoint
  try {
    const rootResponse = await axios.get(`${JOB_SERVICE_URL}/`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    console.log('✅ Root endpoint (/) accessible');
    console.log('📊 Response type:', typeof rootResponse.data);
    console.log('📊 Response keys:', Object.keys(rootResponse.data));
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
      console.log('🔧 This confirms the job service routing issue');
    } else {
      console.log('✅ Getting actual jobs data');
      console.log('📊 Jobs count:', jobsResponse.data.jobs?.length || 'N/A');
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
  console.log('🚀 Testing Job Service Direct Access...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('');

  await testJobServiceRoutes();
  
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 DIAGNOSIS');
  console.log('='.repeat(50));
  console.log('If you see "WARNING: Getting root endpoint response instead of jobs list"');
  console.log('then the issue is in the job service itself, not the API Gateway.');
  console.log('');
  console.log('💡 SOLUTION: The job service needs to be fixed to properly handle');
  console.log('   the /api/jobs route when accessed via ngrok.');
  console.log('');
  console.log('🔧 Next step: Check the job service server configuration.');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
