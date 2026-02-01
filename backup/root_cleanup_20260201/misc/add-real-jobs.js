#!/usr/bin/env node

/**
 * Add Real Jobs to Database
 * Creates real jobs in the database to replace mock data
 */

const axios = require('axios');

// Use the ngrok URL directly
const API_URL = 'https://e7e63332d334.ngrok-free.app';

// Real job data that matches your platform
const realJobs = [
  {
    title: 'Senior Electrical Engineer - Commercial Projects',
    description: 'Seeking certified electrician for high-rise commercial installations. Must have 5+ years experience with industrial wiring and safety protocols.',
    category: 'Electrical',
    budget: 4500,
    currency: 'GHS',
    location: 'Accra, Greater Accra',
    skills: ['Electrical Installation', 'Industrial Wiring', 'Safety Protocols', 'Commercial Projects', 'High-Rise Buildings'],
    urgency: 'high',
    paymentType: 'fixed',
    companyName: 'PowerTech Solutions Ghana',
    experienceLevel: 'Senior',
    jobType: 'Full-time'
  },
  {
    title: 'Master Plumber - Residential & Commercial',
    description: 'Professional plumber needed for luxury residential and commercial plumbing systems. Experience with modern fixtures required.',
    category: 'Plumbing',
    budget: 3500,
    currency: 'GHS',
    location: 'Kumasi, Ashanti Region',
    skills: ['Pipe Installation', 'Water Systems', 'Drainage', 'Modern Fixtures', 'Luxury Projects'],
    urgency: 'medium',
    paymentType: 'fixed',
    companyName: 'AquaFlow Ghana Limited',
    experienceLevel: 'Master',
    jobType: 'Contract'
  },
  {
    title: 'Expert Carpenter - Custom Furniture Specialist',
    description: 'Skilled carpenter needed for custom furniture and woodworking projects. Experience with both traditional and modern techniques required.',
    category: 'Carpentry',
    budget: 2800,
    currency: 'GHS',
    location: 'Tema, Greater Accra',
    skills: ['Custom Furniture', 'Woodworking', 'Carpentry', 'Traditional Techniques', 'Modern Design'],
    urgency: 'low',
    paymentType: 'fixed',
    companyName: 'Artisan Woodworks Ghana',
    experienceLevel: 'Expert',
    jobType: 'Part-time'
  },
  {
    title: 'HVAC Technician - Climate Control Systems',
    description: 'Certified HVAC technician needed for installation and maintenance of air conditioning and heating systems in commercial buildings.',
    category: 'HVAC',
    budget: 3200,
    currency: 'GHS',
    location: 'Takoradi, Western Region',
    skills: ['HVAC Installation', 'Climate Control', 'Air Conditioning', 'Heating Systems', 'Commercial Maintenance'],
    urgency: 'high',
    paymentType: 'fixed',
    companyName: 'ClimateTech Solutions',
    experienceLevel: 'Certified',
    jobType: 'Full-time'
  },
  {
    title: 'House Cleaning Service - Weekly Maintenance',
    description: 'Reliable house cleaner needed for weekly cleaning of 4-bedroom house. Must be trustworthy and experienced with modern cleaning techniques.',
    category: 'Cleaning',
    budget: 200,
    currency: 'GHS',
    location: 'Cape Coast, Central Region',
    skills: ['House Cleaning', 'Weekly Maintenance', 'Modern Cleaning', 'Trustworthy', 'Reliable'],
    urgency: 'low',
    paymentType: 'hourly',
    companyName: 'CleanHome Ghana',
    experienceLevel: 'Experienced',
    jobType: 'Part-time'
  }
];

async function addJobDirectly(jobData) {
  try {
    // Try to add job directly to job service (bypassing API gateway)
    const response = await axios.post(`${API_URL}/api/jobs`, jobData, {
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 15000
    });
    
    console.log(`✅ Added job: "${jobData.title}"`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to add job "${jobData.title}":`, error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Adding Real Jobs to Database...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌍 API URL:', API_URL);
  console.log('');

  let added = 0;
  
  for (const job of realJobs) {
    const result = await addJobDirectly(job);
    if (result) {
      added++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Jobs added: ${added}/${realJobs.length}`);
  
  if (added > 0) {
    console.log('');
    console.log('🎉 Real jobs added to database!');
    console.log('💡 Now refresh your frontend to see real data instead of mock data');
    console.log('🔗 Visit: https://kelmah-frontend-cyan.vercel.app/jobs');
  } else {
    console.log('');
    console.log('⚠️ No jobs were added. The API gateway routing issue needs to be fixed first.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
