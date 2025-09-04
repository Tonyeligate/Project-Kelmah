#!/usr/bin/env node

/**
 * Create Jobs Direct Script
 * Creates jobs directly through the job service (bypassing API gateway routing issues)
 */

const axios = require('axios');

// Direct job service URL (bypassing API gateway)
const JOB_SERVICE_URL = 'https://e7e63332d334.ngrok-free.app';

// Test jobs data
const testJobs = [
  {
    title: 'Plumbing Repair Service',
    description: 'Need a professional plumber to fix leaking pipes in kitchen and bathroom. Urgent repair needed.',
    category: 'Plumbing',
    budget: 250,
    currency: 'GHS',
    location: 'Accra, Ghana',
    skills: ['plumbing', 'pipe-repair', 'bathroom-repair'],
    urgency: 'high',
    paymentType: 'fixed'
  },
  {
    title: 'Electrical Installation',
    description: 'Install new electrical outlets and ceiling fans in 3 bedrooms. Professional electrician required.',
    category: 'Electrical',
    budget: 400,
    currency: 'GHS',
    location: 'Kumasi, Ghana',
    skills: ['electrical', 'installation', 'wiring'],
    urgency: 'medium',
    paymentType: 'fixed'
  },
  {
    title: 'House Cleaning Service',
    description: 'Weekly house cleaning service needed for 4-bedroom house. Reliable cleaner preferred.',
    category: 'Cleaning',
    budget: 150,
    currency: 'GHS',
    location: 'Tema, Ghana',
    skills: ['cleaning', 'housekeeping', 'sanitization'],
    urgency: 'low',
    paymentType: 'hourly'
  }
];

async function testJobServiceDirect() {
  console.log('🔍 Testing job service directly...');
  
  try {
    // Test if we can reach the job service root
    const rootResponse = await axios.get(`${JOB_SERVICE_URL}/`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    
    console.log('✅ Job service root accessible:', rootResponse.data.name);
    
    // Test if we can reach the jobs endpoint directly
    const jobsResponse = await axios.get(`${JOB_SERVICE_URL}/api/jobs`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 10000
    });
    
    console.log('✅ Jobs endpoint accessible');
    console.log('📊 Response:', JSON.stringify(jobsResponse.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Job service not accessible:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Job Service Direct Access...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌍 Job Service URL:', JOB_SERVICE_URL);
  console.log('');

  const isAccessible = await testJobServiceDirect();
  
  if (isAccessible) {
    console.log('');
    console.log('✅ Job service is accessible directly!');
    console.log('💡 The issue is with API gateway routing, not the job service itself.');
    console.log('🔧 Next step: Fix the API gateway routing configuration.');
  } else {
    console.log('');
    console.log('❌ Job service is not accessible directly.');
    console.log('💡 Check if the job service is running on your other device.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
