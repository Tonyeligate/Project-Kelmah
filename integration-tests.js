#!/usr/bin/env node

/**
 * Kelmah Platform Integration Test Suite
 * Comprehensive end-to-end testing for critical user flows
 *
 * Usage: node integration-tests.js
 */

const axios = require('axios');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_TIMEOUT = 30000;

// Test data
const testUsers = {
  hirer: {
    email: 'test-hirer@kelmah.com',
    password: 'TestUser123!',
    firstName: 'John',
    lastName: 'Hirsch',
    role: 'hirer'
  },
  worker: {
    email: 'test-worker@kelmah.com',
    password: 'TestUser123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'worker'
  }
};

let authTokens = {};
let testJobId = null;
let testConversationId = null;

// Test utilities
class TestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running: ${name}`);
    try {
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
      this.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
      this.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.tests.filter(t => t.status === 'FAILED').forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }

    console.log('='.repeat(60));
  }
}

// HTTP client with auth
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  if (config.useAuth && authTokens[config.userType]) {
    config.headers.Authorization = `Bearer ${authTokens[config.userType]}`;
  }
  return config;
});

// Test functions
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/health`);
  expect(response.status).to.equal(200);
  expect(response.data.status).to.equal('healthy');
}

async function testAggregateHealth() {
  const response = await axios.get(`${BASE_URL}/api/health/aggregate`);
  expect(response.status).to.equal(200);
  expect(response.data).to.have.property('gateway');
  expect(response.data).to.have.property('services');
  expect(response.data).to.have.property('timestamp');
}

async function testUserRegistration() {
  // Test hirer registration
  const hirerResponse = await apiClient.post('/api/auth/register', testUsers.hirer);
  expect(hirerResponse.status).to.equal(201);
  expect(hirerResponse.data.success).to.be.true;

  // Test worker registration
  const workerResponse = await apiClient.post('/api/auth/register', testUsers.worker);
  expect(workerResponse.status).to.equal(201);
  expect(workerResponse.data.success).to.be.true;
}

async function testUserLogin() {
  // Test hirer login
  const hirerLogin = await apiClient.post('/api/auth/login', {
    email: testUsers.hirer.email,
    password: testUsers.hirer.password
  });
  expect(hirerLogin.status).to.equal(200);
  expect(hirerLogin.data.success).to.be.true;
  expect(hirerLogin.data.data.tokens).to.have.property('accessToken');
  authTokens.hirer = hirerLogin.data.data.tokens.accessToken;

  // Test worker login
  const workerLogin = await apiClient.post('/api/auth/login', {
    email: testUsers.worker.email,
    password: testUsers.worker.password
  });
  expect(workerLogin.status).to.equal(200);
  expect(workerLogin.data.success).to.be.true;
  expect(workerLogin.data.data.tokens).to.have.property('accessToken');
  authTokens.worker = workerLogin.data.data.tokens.accessToken;
}

async function testUserProfiles() {
  // Test hirer profile access
  const hirerProfile = await apiClient.get('/api/users/profile', {
    useAuth: true,
    userType: 'hirer'
  });
  expect(hirerProfile.status).to.equal(200);
  expect(hirerProfile.data.success).to.be.true;
  expect(hirerProfile.data.data.email).to.equal(testUsers.hirer.email);

  // Test worker profile access
  const workerProfile = await apiClient.get('/api/users/profile', {
    useAuth: true,
    userType: 'worker'
  });
  expect(workerProfile.status).to.equal(200);
  expect(workerProfile.data.success).to.be.true;
  expect(workerProfile.data.data.email).to.equal(testUsers.worker.email);
}

async function testJobPosting() {
  const jobData = {
    title: 'Integration Test Job - Electrician Needed',
    description: 'This is an integration test job posting for testing purposes.',
    category: 'Electrical',
    budget: {
      min: 500,
      max: 1000,
      currency: 'GHS'
    },
    location: {
      address: 'Accra, Ghana',
      coordinates: [-0.186964, 5.603717]
    },
    skills: ['Electrical Wiring', 'Circuit Installation']
  };

  const response = await apiClient.post('/api/jobs', jobData, {
    useAuth: true,
    userType: 'hirer'
  });

  expect(response.status).to.equal(201);
  expect(response.data.success).to.be.true;
  expect(response.data.data).to.have.property('id');
  testJobId = response.data.data.id;
}

async function testJobRetrieval() {
  // Test public job browsing
  const publicJobs = await apiClient.get('/api/jobs/public');
  expect(publicJobs.status).to.equal(200);
  expect(publicJobs.data.success).to.be.true;
  expect(Array.isArray(publicJobs.data.data)).to.be.true;

  // Test authenticated job access
  const myJobs = await apiClient.get('/api/jobs/my-jobs', {
    useAuth: true,
    userType: 'hirer'
  });
  expect(myJobs.status).to.equal(200);
  expect(myJobs.data.success).to.be.true;
  expect(Array.isArray(myJobs.data.data)).to.be.true;

  // Test specific job retrieval
  if (testJobId) {
    const specificJob = await apiClient.get(`/api/jobs/${testJobId}`, {
      useAuth: true,
      userType: 'hirer'
    });
    expect(specificJob.status).to.equal(200);
    expect(specificJob.data.success).to.be.true;
    expect(specificJob.data.data.id).to.equal(testJobId);
  }
}

async function testJobApplication() {
  if (!testJobId) {
    throw new Error('No test job ID available for application test');
  }

  const applicationData = {
    proposedRate: 750,
    coverLetter: 'I am an experienced electrician ready to handle this job professionally.',
    availability: 'Available immediately'
  };

  const response = await apiClient.post(`/api/jobs/${testJobId}/apply`, applicationData, {
    useAuth: true,
    userType: 'worker'
  });

  expect(response.status).to.equal(201);
  expect(response.data.success).to.be.true;
  expect(response.data.data).to.have.property('id');
}

async function testJobApplicationsRetrieval() {
  if (!testJobId) {
    throw new Error('No test job ID available for applications retrieval test');
  }

  // Hirer views applications
  const applications = await apiClient.get(`/api/jobs/${testJobId}/applications`, {
    useAuth: true,
    userType: 'hirer'
  });

  expect(applications.status).to.equal(200);
  expect(applications.data.success).to.be.true;
  expect(Array.isArray(applications.data.data)).to.be.true;
  expect(applications.data.data.length).to.be.at.least(1);
}

async function testConversationCreation() {
  const conversationData = {
    participants: [testUsers.worker.email], // Worker will be the other participant
    initialMessage: 'Hello! I am interested in discussing the job opportunity.'
  };

  const response = await apiClient.post('/api/messages/conversations', conversationData, {
    useAuth: true,
    userType: 'hirer'
  });

  expect(response.status).to.equal(201);
  expect(response.data.success).to.be.true;
  expect(response.data.data).to.have.property('id');
  testConversationId = response.data.data.id;
}

async function testMessageSending() {
  if (!testConversationId) {
    throw new Error('No test conversation ID available for messaging test');
  }

  const messageData = {
    content: 'Thank you for your interest! When would be a good time to discuss the project details?',
    messageType: 'text'
  };

  const response = await apiClient.post(`/api/messages/conversations/${testConversationId}/messages`, messageData, {
    useAuth: true,
    userType: 'hirer'
  });

  expect(response.status).to.equal(201);
  expect(response.data.success).to.be.true;
  expect(response.data.data).to.have.property('id');
  expect(response.data.data.content).to.equal(messageData.content);
}

async function testMessageRetrieval() {
  if (!testConversationId) {
    throw new Error('No test conversation ID available for message retrieval test');
  }

  const response = await apiClient.get(`/api/messages/conversations/${testConversationId}/messages`, {
    useAuth: true,
    userType: 'hirer'
  });

  expect(response.status).to.equal(200);
  expect(response.data.success).to.be.true;
  expect(Array.isArray(response.data.data)).to.be.true;
  expect(response.data.data.length).to.be.at.least(1);
}

async function testReviewSubmission() {
  if (!testJobId) {
    throw new Error('No test job ID available for review test');
  }

  const reviewData = {
    jobId: testJobId,
    revieweeId: testUsers.worker.email, // Simplified - in real app this would be user ID
    rating: 5,
    comment: 'Excellent work! Highly professional and completed on time.'
  };

  const response = await apiClient.post('/api/reviews', reviewData, {
    useAuth: true,
    userType: 'hirer'
  });

  expect(response.status).to.equal(201);
  expect(response.data.success).to.be.true;
  expect(response.data.data).to.have.property('id');
  expect(response.data.data.rating).to.equal(reviewData.rating);
}

async function testReviewRetrieval() {
  const reviews = await apiClient.get(`/api/reviews/worker/${testUsers.worker.email}`);
  expect(reviews.status).to.equal(200);
  expect(reviews.data.success).to.be.true;
  expect(Array.isArray(reviews.data.data)).to.be.true;
}

async function testAPIDocumentation() {
  // Test YAML API spec
  const yamlResponse = await axios.get(`${BASE_URL}/api/docs`);
  expect(yamlResponse.status).to.equal(200);
  expect(yamlResponse.headers['content-type']).to.include('application/yaml');

  // Test HTML documentation (if available)
  try {
    const htmlResponse = await axios.get(`${BASE_URL}/api/docs.html`);
    expect(htmlResponse.status).to.equal(200);
    expect(htmlResponse.headers['content-type']).to.include('text/html');
  } catch (error) {
    console.log('   HTML documentation not available (expected in development)');
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Kelmah Platform Integration Tests');
  console.log(`📍 API Base URL: ${BASE_URL}`);
  console.log('⏱️  Test Timeout: ${TEST_TIMEOUT}ms');
  console.log('='.repeat(60));

  const suite = new TestSuite();

  try {
    // Health & System Tests
    await suite.runTest('System Health Check', testHealthCheck);
    await suite.runTest('Aggregate Health Check', testAggregateHealth);
    await suite.runTest('API Documentation Access', testAPIDocumentation);

    // Authentication Flow
    await suite.runTest('User Registration', testUserRegistration);
    await suite.runTest('User Login', testUserLogin);
    await suite.runTest('User Profile Access', testUserProfiles);

    // Job Management Flow
    await suite.runTest('Job Posting', testJobPosting);
    await suite.runTest('Job Retrieval', testJobRetrieval);
    await suite.runTest('Job Application', testJobApplication);
    await suite.runTest('Job Applications Retrieval', testJobApplicationsRetrieval);

    // Messaging Flow
    await suite.runTest('Conversation Creation', testConversationCreation);
    await suite.runTest('Message Sending', testMessageSending);
    await suite.runTest('Message Retrieval', testMessageRetrieval);

    // Review System
    await suite.runTest('Review Submission', testReviewSubmission);
    await suite.runTest('Review Retrieval', testReviewRetrieval);

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
  }

  suite.printSummary();

  // Exit with appropriate code
  process.exit(suite.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('💥 Fatal error running integration tests:', error);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };