/**
 * MongoDB Connection Test Script
 * Tests the MongoDB connection with the same URI used by the services
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

const options = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  dbName: 'kelmah_platform'
};

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('📍 URI:', MONGODB_URI.replace(/:([^:@]{4,}[^:@]+)@/, ':****@'));
  console.log('📊 Database: kelmah_platform');
  console.log('');

  try {
    console.log('⏳ Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ Connected successfully!');
    console.log('🌐 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('📡 ReadyState:', conn.connection.readyState);
    console.log('');

    // Test a simple query
    console.log('⏳ Testing database query...');
    const db = conn.connection.db;
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    console.log('');

    // Test users collection
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👥 Users count:', userCount);

    // Test a sample user query
    const sampleUser = await usersCollection.findOne({ role: 'worker' });
    if (sampleUser) {
      console.log('✅ Sample worker found:', {
        id: sampleUser._id,
        name: `${sampleUser.firstName} ${sampleUser.lastName}`,
        role: sampleUser.role,
        profession: sampleUser.profession
      });
    } else {
      console.log('⚠️ No worker users found in database');
    }
    console.log('');

    console.log('✅ All tests passed!');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('  1. Invalid MongoDB URI');
    console.error('  2. Network connectivity issues');
    console.error('  3. Database authentication failure');
    console.error('  4. IP whitelist not configured');
    console.error('  5. Wrong database name');
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
