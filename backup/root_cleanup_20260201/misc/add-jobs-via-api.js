#!/usr/bin/env node

/**
 * Add Real Jobs via API Script
 * Creates real job postings through the deployed API
 */

const axios = require('axios');

// API Base URL
const API_BASE_URL = 'https://kelmah-frontend-cyan.vercel.app';

// Test user credentials (existing test user)
const TEST_USER = {
  email: 'kwame.asante1@kelmah.test',
  password: 'TestUser123!'
};

// Real job postings data
const realJobs = [
  {
    title: "Senior Electrical Engineer - Commercial Projects",
    description: "Seeking certified electrician for high-rise commercial installations. Must have 5+ years experience with industrial wiring and safety protocols. Experience with modern electrical systems and energy-efficient solutions preferred.",
    category: "Electrical",
    skills: ["Electrical Installation", "Industrial Wiring", "Safety Protocols", "Circuit Design", "Maintenance", "Energy Efficiency"],
    budget: 4500,
    currency: "GHS",
    duration: { value: 3, unit: "month" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Accra" },
    status: "open",
    visibility: "public"
  },
  {
    title: "Master Plumber - Residential & Commercial",
    description: "Professional plumber needed for luxury residential and commercial plumbing systems. Experience with modern fixtures required. Must have valid plumbing certification and own tools.",
    category: "Plumbing",
    skills: ["Pipe Installation", "Water Systems", "Drainage", "Fixture Installation", "Leak Detection", "Water Heater Installation"],
    budget: 3500,
    currency: "GHS",
    duration: { value: 2, unit: "month" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Kumasi" },
    status: "open",
    visibility: "public"
  },
  {
    title: "Expert Carpenter - Custom Furniture Specialist",
    description: "Seeking master carpenter for high-end custom furniture and cabinet making. Must excel in traditional and modern woodworking techniques. Portfolio required.",
    category: "Carpentry",
    skills: ["Fine Woodworking", "Cabinet Making", "Furniture Design", "Tool Mastery", "Finishing", "Custom Joinery"],
    budget: 3000,
    currency: "GHS",
    duration: { value: 4, unit: "week" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Tema" },
    status: "open",
    visibility: "public"
  },
  {
    title: "HVAC Technician - Climate Control Systems",
    description: "Install and maintain air conditioning systems in commercial buildings. Experience with energy-efficient systems preferred. Must have HVAC license and transport available.",
    category: "HVAC",
    skills: ["HVAC Installation", "System Maintenance", "Refrigeration", "Energy Efficiency", "Troubleshooting", "Ductwork"],
    budget: 3650,
    currency: "GHS",
    duration: { value: 6, unit: "week" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Accra" },
    status: "open",
    visibility: "public"
  },
  {
    title: "Construction Supervisor - Building Projects",
    description: "Lead construction teams for residential and commercial building projects. Strong leadership and technical skills required. Must have construction management degree and 5+ years experience.",
    category: "Construction",
    skills: ["Project Management", "Team Leadership", "Quality Control", "Safety Management", "Cost Control", "Building Codes"],
    budget: 5350,
    currency: "GHS",
    duration: { value: 6, unit: "month" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Kumasi" },
    status: "open",
    visibility: "public"
  },
  {
    title: "Professional Painter - Residential & Commercial",
    description: "High-quality painting services for residential and commercial properties. Experience with various paint types and techniques required. Must have own equipment.",
    category: "Painting",
    skills: ["Interior Painting", "Exterior Painting", "Color Matching", "Surface Preparation", "Staining", "Wallpaper Installation"],
    budget: 2300,
    currency: "GHS",
    duration: { value: 3, unit: "week" },
    paymentType: "fixed",
    location: { type: "onsite", country: "Ghana", city: "Tema" },
    status: "open",
    visibility: "public"
  }
];

async function checkAPIHealth() {
  try {
    console.log('🔍 Checking API health...');
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ API is healthy:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ API health check failed:', error.message);
    return false;
  }
}

async function checkExistingJobs() {
  try {
    console.log('🔍 Checking existing jobs...');
    const response = await axios.get(`${API_BASE_URL}/api/jobs/api/jobs`, {
      timeout: 10000
    });
    const jobs = response.data.items || [];
    console.log(`📊 Found ${jobs.length} existing jobs`);
    return jobs;
  } catch (error) {
    console.log('❌ Failed to check existing jobs:', error.message);
    return [];
  }
}

async function createUser() {
  try {
    console.log('👤 Creating test user...');
    const userData = {
      firstName: 'Test',
      lastName: 'Hirer',
      email: TEST_USER.email,
      password: TEST_USER.password,
      role: 'hirer',
      phone: '+233123456789'
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ User created successfully');
    return response.data.token || response.data.data?.token;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ User already exists, attempting login...');
      return await loginUser();
    }
    console.log('❌ Failed to create user:', error.response?.data?.message || error.message);
    return null;
  }
}

async function loginUser() {
  try {
    console.log('🔐 Logging in user...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER, {
      headers: { 'Content-Type': 'application/json' },
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
    const response = await axios.post(`${API_BASE_URL}/api/jobs/api/jobs`, job, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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

async function main() {
  console.log('🚀 Starting Real Jobs Creation via API...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌍 API URL:', API_BASE_URL);
  console.log('');

  // Check API health
  const isHealthy = await checkAPIHealth();
  if (!isHealthy) {
    console.log('❌ Cannot proceed - API is not healthy');
    process.exit(1);
  }

  // Check existing jobs
  const existingJobs = await checkExistingJobs();
  
  // Create or login user
  let token = await createUser();
  if (!token) {
    token = await loginUser();
  }
  
  if (!token) {
    console.log('❌ Cannot proceed without authentication token');
    process.exit(1);
  }

  // Create jobs
  console.log('📝 Creating real jobs...');
  let created = 0;
  
  for (const job of realJobs) {
    const result = await createJob(job, token);
    if (result) {
      created++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Check final job count
  const finalJobs = await checkExistingJobs();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Jobs created: ${created}/${realJobs.length}`);
  console.log(`📋 Jobs before: ${existingJobs.length}`);
  console.log(`🎯 Jobs after: ${finalJobs.length}`);
  
  if (created > 0) {
    console.log('');
    console.log('🎉 Real jobs created successfully!');
    console.log('💡 The frontend should now show real job postings');
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
