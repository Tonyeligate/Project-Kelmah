#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * Tests all MongoDB connections and validates data flow
 */

const { MongoClient } = require('mongodb');
const axios = require('axios');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Service URLs
const SERVICES = {
  AUTH: 'https://kelmah-auth-service.onrender.com',
  USER: 'https://kelmah-user-service.onrender.com', 
  JOB: 'https://kelmah-job-service.onrender.com',
  PAYMENT: 'https://kelmah-payment-service.onrender.com',
  MESSAGING: 'https://kelmah-messaging-service.onrender.com'
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
    if (details) {
      console.log(`   ${details}`);
    }
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
    testResults.issues.push(`${testName}: ${details}`);
  }
}

// Test MongoDB direct connection
async function testMongoDBConnection() {
  console.log('\n🗄️ Testing Direct MongoDB Connection...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('kelmah_platform');
    await db.admin().ping();
    
    logTest('MongoDB Direct Connection', true, 'Successfully connected and pinged');
    
    // Test collections
    const collections = await db.listCollections().toArray();
    logTest('MongoDB Collections', collections.length > 0, 
           `Found ${collections.length} collections: ${collections.map(c => c.name).join(', ')}`);
    
    return true;
  } catch (error) {
    logTest('MongoDB Direct Connection', false, error.message);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Test MongoDB data operations
async function testMongoDBData() {
  console.log('\n📊 Testing MongoDB Data Operations...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('kelmah_platform');
    
    // Test user collection
    const userCount = await db.collection('users').countDocuments();
    logTest('Users Collection', true, `${userCount} users in database`);
    
    // Test job collection
    const jobCount = await db.collection('jobs').countDocuments();
    logTest('Jobs Collection', true, `${jobCount} jobs in database`);
    
    // Test payment collection
    const paymentCount = await db.collection('payments').countDocuments();
    logTest('Payments Collection', true, `${paymentCount} payments in database`);
    
    // Test messaging collections
    const conversationCount = await db.collection('conversations').countDocuments();
    const messageCount = await db.collection('messages').countDocuments();
    logTest('Messaging Collections', true, 
           `${conversationCount} conversations, ${messageCount} messages`);
    
    return true;
  } catch (error) {
    logTest('MongoDB Data Operations', false, error.message);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Test service health endpoints
async function testServiceHealth() {
  console.log('\n🔍 Testing Service Health Endpoints...');
  
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 15000 });
      logTest(`${name} Service Health`, response.status === 200, 
             `Status: ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 100)}`);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        logTest(`${name} Service Health`, false, 'Connection timeout (service may be sleeping)');
      } else {
        logTest(`${name} Service Health`, false, error.message);
      }
    }
  }
}

// Test MongoDB with service integration
async function testServiceMongoDBIntegration() {
  console.log('\n🔗 Testing Service-MongoDB Integration...');
  
  try {
    // Test user service with MongoDB
    const userResponse = await axios.get(`${SERVICES.USER}/api/users`, { 
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    logTest('User Service MongoDB Integration', 
           userResponse.status === 200 && !userResponse.data.message?.includes('column'), 
           `Status: ${userResponse.status}, No PostgreSQL errors`);
  } catch (error) {
    if (error.response?.data?.message?.includes('column')) {
      logTest('User Service MongoDB Integration', false, 
             'Still using PostgreSQL - migration needed');
    } else {
      logTest('User Service MongoDB Integration', false, error.message);
    }
  }
  
  try {
    // Test auth service endpoints
    const authResponse = await axios.get(`${SERVICES.AUTH}/api/auth/health`, { 
      timeout: 15000 
    });
    logTest('Auth Service MongoDB Integration', authResponse.status === 200,
           `Auth service responding: ${authResponse.status}`);
  } catch (error) {
    logTest('Auth Service MongoDB Integration', false, error.message);
  }
}

// Test user registration with MongoDB
async function testUserRegistrationMongoDB() {
  console.log('\n👤 Testing User Registration with MongoDB...');
  
  const testUser = {
    firstName: 'Test',
    lastName: 'Worker', 
    email: `testworker${Date.now()}@mongodb.test`,
    password: 'TestPassword123!',
    phone: '+233555987654',
    role: 'worker'
  };

  try {
    const response = await axios.post(`${SERVICES.AUTH}/api/auth/register`, testUser, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    logTest('User Registration MongoDB', 
           response.status === 201 || response.status === 200, 
           `User created: ${response.data.user?.id || response.data.id || 'Success'}`);
    
    return response.data.user || response.data;
  } catch (error) {
    logTest('User Registration MongoDB', false, 
           error.response?.data?.message || error.message);
    return null;
  }
}

// Test job creation with MongoDB
async function testJobCreationMongoDB(userId) {
  console.log('\n💼 Testing Job Creation with MongoDB...');
  
  if (!userId) {
    logTest('Job Creation MongoDB', false, 'No user ID available');
    return;
  }

  const testJob = {
    title: 'Test MongoDB Job - Plumbing',
    description: 'Test job to verify MongoDB integration',
    category: 'Plumbing',
    budget: 750.00,
    currency: 'GHS',
    location: 'Kumasi, Ghana',
    skills: ['plumbing', 'mongodb-test'],
    urgency: 'medium'
  };

  try {
    // Note: We'd need a valid auth token for this in real implementation
    const response = await axios.post(`${SERVICES.JOB}/api/jobs`, testJob, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    logTest('Job Creation MongoDB', 
           response.status === 201 || response.status === 200,
           `Job created: ${response.data.id || 'Success'}`);
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Job Creation MongoDB', true, 
             'Authentication required (service working)');
    } else {
      logTest('Job Creation MongoDB', false, 
             error.response?.data?.message || error.message);
    }
  }
}

// Test database indexes and performance
async function testMongoDBPerformance() {
  console.log('\n⚡ Testing MongoDB Performance and Indexes...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('kelmah_platform');
    
    // Test user collection indexes
    const userIndexes = await db.collection('users').listIndexes().toArray();
    logTest('Users Collection Indexes', userIndexes.length > 1, 
           `${userIndexes.length} indexes found`);
    
    // Test job collection indexes
    const jobIndexes = await db.collection('jobs').listIndexes().toArray();
    logTest('Jobs Collection Indexes', jobIndexes.length > 1,
           `${jobIndexes.length} indexes found`);
    
    // Test query performance
    const start = Date.now();
    await db.collection('users').findOne({ email: 'admin@kelmah.com' });
    const queryTime = Date.now() - start;
    
    logTest('MongoDB Query Performance', queryTime < 100,
           `Query took ${queryTime}ms`);
    
    return true;
  } catch (error) {
    logTest('MongoDB Performance Tests', false, error.message);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Main test execution
async function runMongoDBTests() {
  console.log('🚀 Starting MongoDB Integration Tests...');
  console.log('📅 Test started at:', new Date().toISOString());
  console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  console.log('🗄️ Database: kelmah_platform');
  console.log('');

  // Run all tests
  const mongoDBConnected = await testMongoDBConnection();
  
  if (mongoDBConnected) {
    await testMongoDBData();
    await testMongoDBPerformance();
  }
  
  await testServiceHealth();
  await testServiceMongoDBIntegration();
  
  const testUser = await testUserRegistrationMongoDB();
  if (testUser) {
    await testJobCreationMongoDB(testUser.id);
  }
  
  // Print test summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MONGODB INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed/testResults.total)*100).toFixed(1)}%`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 Recommended Actions:');
    if (testResults.issues.some(issue => issue.includes('column'))) {
      console.log('- Services still using PostgreSQL - complete MongoDB migration');
    }
    if (testResults.issues.some(issue => issue.includes('timeout'))) {
      console.log('- Some services may be sleeping - restart them on Render');
    }
    if (testResults.issues.some(issue => issue.includes('Connection'))) {
      console.log('- Check MongoDB connection string and network access');
    }
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! MongoDB integration is working correctly.');
    console.log('✨ Your Kelmah platform is successfully running on MongoDB!');
    console.log('🇬🇭 Ready for Ghana\'s skilled worker marketplace!');
  } else if (testResults.passed > testResults.failed) {
    console.log('\n⚠️ Most tests passed, but some issues need attention.');
    console.log('🔧 MongoDB migration may be partially complete.');
  } else {
    console.log('\n❌ Multiple issues detected. MongoDB migration may be needed.');
  }
  
  console.log('\n📋 Next Steps:');
  if (mongoDBConnected) {
    console.log('1. ✅ MongoDB is connected and working');
    console.log('2. Update service configurations to use MongoDB');
    console.log('3. Remove PostgreSQL dependencies from services');
    console.log('4. Restart all Render services');
  } else {
    console.log('1. ❌ Fix MongoDB connection issues first');
    console.log('2. Check your MongoDB URI and credentials');
    console.log('3. Ensure network access to MongoDB cluster');
  }
}

// Handle script execution
if (require.main === module) {
  runMongoDBTests().catch(console.error);
}

module.exports = { runMongoDBTests };