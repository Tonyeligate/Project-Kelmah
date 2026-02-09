#!/usr/bin/env node

/**
 * Create Test Jobs Script
 * Creates sample jobs in the database for testing
 */

const axios = require('axios');

// Use your ngrok URL for the API gateway
const API_BASE_URL = 'https://e7e63332d334.ngrok-free.app';

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
  },
  {
    title: 'Carpentry Work',
    description: 'Build custom kitchen cabinets and repair wooden furniture. Experienced carpenter needed.',
    category: 'Carpentry',
    budget: 800,
    currency: 'GHS',
    location: 'Takoradi, Ghana',
    skills: ['carpentry', 'woodworking', 'furniture-repair'],
    urgency: 'medium',
    paymentType: 'fixed'
  },
  {
    title: 'Garden Landscaping',
    description: 'Design and maintain garden landscape. Plant flowers, trim trees, and general garden maintenance.',
    category: 'Gardening',
    budget: 300,
    currency: 'GHS',
    location: 'Cape Coast, Ghana',
    skills: ['gardening', 'landscaping', 'plant-care'],
    urgency: 'low',
    paymentType: 'fixed'
  }
];

// Use verified worker credentials for testing (from ALL-USER-CREDENTIALS.json)
const USER_CREDENTIALS = {
  email: 'kwame.asante1@kelmah.test',
  password: 'TestUser123!'
};

async function loginAsUser() {
  console.log('🔐 Logging in as user...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, USER_CREDENTIALS, {
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000
    });
    
    const token = response.data.token || response.data.data?.token;
    if (token) {
      console.log('✅ User login successful');
      return token;
    } else {
      console.log('❌ No token received');
      return null;
    }
  } catch (error) {
    console.log('❌ User login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function createJob(job, token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/jobs`, job, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000
    });
    
    console.log(`✅ Created job: "${job.title}"`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to create job "${job.title}":`, error.response?.data?.message || error.message);
    return null;
  }
}

async function checkExistingJobs(token) {
  console.log('🔍 Checking existing jobs...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/jobs`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 10000
    });
    
    console.log(`📊 Found ${response.data.data?.length || 0} existing jobs`);
    return response.data.data || [];
  } catch (error) {
    console.log('❌ Failed to check existing jobs:', error.response?.data?.message || error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Test Jobs Creation...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌍 API URL:', API_BASE_URL);
  console.log('');

  // Login as user
  const token = await loginAsUser();
  if (!token) {
    console.log('❌ Cannot proceed without authentication token');
    process.exit(1);
  }

  // Check existing jobs
  const existingJobs = await checkExistingJobs(token);
  
  // Create test jobs
  console.log('📝 Creating test jobs...');
  let created = 0;
  
  for (const job of testJobs) {
    const result = await createJob(job, token);
    if (result) {
      created++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Jobs created: ${created}/${testJobs.length}`);
  console.log(`📋 Existing jobs: ${existingJobs.length}`);
  
  // Check jobs again
  const finalJobs = await checkExistingJobs(token);
  console.log(`🎯 Total jobs now: ${finalJobs.length}`);
  
  if (created > 0) {
    console.log('');
    console.log('🎉 Test jobs created successfully!');
    console.log('💡 Now test the frontend to see if jobs appear');
    console.log('🔗 Visit: https://kelmah-frontend-cyan.vercel.app/jobs');
  } else {
    console.log('');
    console.log('⚠️ No jobs were created. Check the error messages above.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
