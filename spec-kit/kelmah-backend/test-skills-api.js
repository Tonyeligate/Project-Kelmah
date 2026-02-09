/**
 * API Test Script - Worker Skills Flow
 * 
 * This script tests the worker skills functionality:
 * 1. Register a new worker with initial skills
 * 2. Get the worker's credentials
 * 3. Add a new skill to the worker
 * 4. Request verification for a skill
 * 
 * Run with: node test-skills-api.js
 */

const axios = require('axios');

// API configuration
const API_URL = 'http://localhost:8080';
let authToken = '';
let userId = '';

// Test data
const testWorker = {
  email: `worker${Date.now()}@example.com`,
  password: 'TestPassword123',
  firstName: 'Test',
  lastName: 'Worker',
  role: 'worker',
  skills: ['Plumbing', 'Electrical'] // Initial skills
};

// Helper function for making authenticated requests
const authRequest = async (method, endpoint, data = null) => {
  const headers = { 'Content-Type': 'application/json' };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      data
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error in ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Main test flow
async function runTest() {
  try {
    console.log('\n=== Worker Skills API Test ===\n');
    
    // Step 1: Register the worker
    console.log('1. Registering a new worker with initial skills...');
    const registerResponse = await authRequest('post', '/api/auth/register', testWorker);
    authToken = registerResponse.token;
    userId = registerResponse.user.id;
    console.log(`✅ Worker registered successfully with ID: ${userId}`);
    console.log(`   Initial skills: ${testWorker.skills.join(', ')}`);
    
    // Step 2: Get worker credentials
    console.log('\n2. Fetching worker credentials...');
    const credentialsResponse = await authRequest('get', '/api/workers/me/credentials');
    console.log('✅ Worker credentials retrieved:');
    console.log('   Skills:', credentialsResponse.skills.map(s => `${s.name}${s.verified ? ' (verified)' : ''}`).join(', '));
    console.log('   Licenses:', credentialsResponse.licenses.map(l => l.name).join(', '));
    
    // Step 3: Add a new skill
    const newSkill = 'Carpentry';
    console.log(`\n3. Adding a new skill: ${newSkill}...`);
    const addSkillResponse = await authRequest('post', '/api/workers/me/skills', { name: newSkill });
    console.log(`✅ New skill added successfully`);
    console.log(`   Updated skills: ${addSkillResponse.skills.join(', ')}`);
    
    // Step 4: Request skill verification
    const skillToVerify = credentialsResponse.skills[2].id; // Get the ID of the third skill (should be carpentry if added)
    console.log(`\n4. Requesting verification for skill ID: ${skillToVerify}...`);
    const verifyResponse = await authRequest('post', `/api/workers/me/skills/${skillToVerify}/verify`, {
      documentUrls: ['https://example.com/certificate.pdf'],
      notes: 'Test verification request'
    });
    console.log(`✅ Verification request submitted with status: ${verifyResponse.status}`);
    
    // Step 5: Get available skills
    console.log('\n5. Fetching available skills list...');
    const availableSkillsResponse = await authRequest('get', '/api/workers/skills');
    console.log(`✅ Available skills retrieved: ${availableSkillsResponse.length} skills found`);
    console.log(`   Sample skills: ${availableSkillsResponse.slice(0, 3).map(s => s.name).join(', ')}...`);
    
    console.log('\n✨ All tests completed successfully! ✨');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
runTest(); 