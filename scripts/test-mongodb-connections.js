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
             `Status: ${response.status}`);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        logTest(`${name} Service Health`, false, 'Connection timeout (service may be sleeping)');
      } else {
        logTest(`${name} Service Health`, false, error.message);
      }
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
  }
  
  await testServiceHealth();
  
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