#!/usr/bin/env node

/**
 * Test Single Job Creation
 * Tests creating one job to debug the API issue
 */

const axios = require('axios');

const API_BASE_URL = 'https://kelmah-frontend-cyan.vercel.app';
const TEST_USER = {
  email: 'kwame.asante1@kelmah.test',
  password: 'TestUser123!'
};

async function loginUser() {
  try {
    console.log('🔐 Logging in user...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
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

async function testJobCreation(token) {
  const simpleJob = {
    title: "Test Plumbing Job",
    description: "Simple test job for debugging",
    category: "Plumbing",
    budget: 250,
    currency: "GHS",
    paymentType: "fixed",
    location: "Accra, Ghana",
    skills: ["plumbing", "repair"]
  };

  try {
    console.log('📝 Testing job creation...');
    console.log('Job data:', JSON.stringify(simpleJob, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/api/jobs/api/jobs`, simpleJob, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Job created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Job creation failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Single Job Creation...');
  
  const token = await loginUser();
  if (!token) {
    console.log('❌ Cannot proceed without token');
    return;
  }
  
  await testJobCreation(token);
}

main().catch(console.error);
