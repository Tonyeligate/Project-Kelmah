// Check if routes are mounted by testing the route handler
// This tests via LocalTunnel to the deployed job-service

const axios = require('axios');
const fs = require('fs');

// Read current LocalTunnel URL from config
const config = JSON.parse(fs.readFileSync('./ngrok-config.json', 'utf8'));
const BASE_URL = config.http || 'https://shaggy-snake-43.loca.lt';

console.log('🔍 Testing Job Service Route Mounting...');
console.log('📍 Base URL:', BASE_URL);
console.log('');

async function testRouteMounting() {
  try {
    console.log('1️⃣ Testing root endpoint (should return API info)...');
    const rootResponse = await axios.get(`${BASE_URL}/`, {
      headers: {
        'bypass-tunnel-reminder': 'true'
      }
    });
    console.log('✅ Root endpoint responded:', rootResponse.status);
    console.log('   Message:', rootResponse.data.message);
    console.log('');

    console.log('2️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'bypass-tunnel-reminder': 'true'
      }
    });
    console.log('✅ Health endpoint:', healthResponse.data.status);
    console.log('');

    console.log('3️⃣ Testing /api/jobs/?status=open (the problematic endpoint)...');
    const jobsResponse = await axios.get(`${BASE_URL}/api/jobs/?status=open&limit=10`, {
      headers: {
        'bypass-tunnel-reminder': 'true'
      }
    });
    
    if (jobsResponse.status === 200) {
      console.log('✅ SUCCESS! Jobs endpoint working!');
      console.log('   Status:', jobsResponse.status);
      console.log('   Data:', JSON.stringify(jobsResponse.data, null, 2).substring(0, 500));
      console.log('');
      console.log('🎉 ROUTES ARE MOUNTED AND WORKING!');
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed:');
      console.log('   Status:', error.response.status);
      console.log('   URL:', error.config.url);
      console.log('   Data:', error.response.data);
      
      if (error.response.status === 404) {
        console.log('');
        console.log('🔍 404 Error - Routes may not be mounted!');
        console.log('');
        console.log('Expected logs to check in production:');
        console.log('  - [ROUTE MOUNTING] mountApiRoutes() function called!');
        console.log('  - [ROUTE MOUNTING] ✅ All API routes mounted successfully!');
        console.log('  - [DB CONNECTION] ✅ MongoDB connection successful!');
        console.log('');
        console.log('If these logs are MISSING, routes are not mounted due to:');
        console.log('  1. DB connection failing');
        console.log('  2. mountApiRoutes() never called');
        console.log('  3. Server started before DB connected');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Give deployment time to complete (3 minutes)
const deploymentTime = 3 * 60 * 1000;
console.log(`⏳ Waiting ${deploymentTime / 1000} seconds for deployment to complete...`);
console.log('');

setTimeout(() => {
  testRouteMounting();
}, deploymentTime);

console.log('💡 Tip: You can also check Render logs directly for the debug output');
console.log('   Look for [ROUTE MOUNTING], [DB CONNECTION], and [SERVER START] tags');
console.log('');
