#!/usr/bin/env node

/**
 * Deep MongoDB Connection Diagnostics
 * Tests every aspect of the MongoDB connection
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function deepDiagnostics() {
  console.log('🔍 DEEP MONGODB CONNECTION DIAGNOSTICS');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Basic connection
    console.log('\n📊 Test 1: Basic Connection');
    console.log('-'.repeat(70));
    console.log('Connecting to MongoDB...');
    
    const startTime = Date.now();
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      family: 4,
      dbName: 'kelmah_platform'
    });
    
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected in ${connectTime}ms`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   ReadyState: ${mongoose.connection.readyState}`);
    
    // Test 2: Wait for full ready state
    console.log('\n📊 Test 2: Connection Ready State');
    console.log('-'.repeat(70));
    
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for readyState = 1...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for ready state'));
        }, 10000);
        
        const check = setInterval(() => {
          if (mongoose.connection.readyState === 1) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });
    }
    console.log('✅ ReadyState = 1 (Connected)');
    
    // Test 3: Define a test model
    console.log('\n📊 Test 3: Model Creation');
    console.log('-'.repeat(70));
    
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    }, {
      collection: 'test_connection',
      bufferCommands: true  // Test with buffering enabled
    });
    
    const TestModel = mongoose.model('TestConnection', TestSchema);
    console.log('✅ Test model created');
    
    // Test 4: Simple query with buffering
    console.log('\n📊 Test 4: Query with bufferCommands=true');
    console.log('-'.repeat(70));
    
    const queryStart = Date.now();
    const count1 = await TestModel.countDocuments();
    const queryTime1 = Date.now() - queryStart;
    console.log(`✅ Query successful in ${queryTime1}ms`);
    console.log(`   Count: ${count1}`);
    
    // Test 5: Query actual users collection
    console.log('\n📊 Test 5: Query Users Collection');
    console.log('-'.repeat(70));
    
    const UserSchema = new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String,
      role: String,
      isActive: Boolean
    }, {
      collection: 'users',
      bufferCommands: true
    });
    
    const User = mongoose.model('User', UserSchema);
    
    const userQueryStart = Date.now();
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const userQueryTime = Date.now() - userQueryStart;
    
    console.log(`✅ User queries successful in ${userQueryTime}ms`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Active users: ${activeUsers}`);
    
    // Test 6: Rapid consecutive queries (like dashboard does)
    console.log('\n📊 Test 6: Rapid Consecutive Queries (Dashboard simulation)');
    console.log('-'.repeat(70));
    
    const rapidStart = Date.now();
    const [u1, u2, u3] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'hirer' })
    ]);
    const rapidTime = Date.now() - rapidStart;
    
    console.log(`✅ Rapid queries successful in ${rapidTime}ms`);
    console.log(`   Active users: ${u1}`);
    console.log(`   Workers: ${u2}`);
    console.log(`   Hirers: ${u3}`);
    
    // Test 7: Test with bufferCommands=false
    console.log('\n📊 Test 7: Query with bufferCommands=false');
    console.log('-'.repeat(70));
    
    const NoBufferSchema = new mongoose.Schema({
      name: String
    }, {
      collection: 'users',
      bufferCommands: false
    });
    
    const NoBufferUser = mongoose.model('NoBufferUser', NoBufferSchema);
    
    try {
      const noBufferStart = Date.now();
      const noBufferCount = await NoBufferUser.countDocuments();
      const noBufferTime = Date.now() - noBufferStart;
      console.log(`✅ No-buffer query successful in ${noBufferTime}ms`);
      console.log(`   Count: ${noBufferCount}`);
    } catch (noBufferError) {
      console.log(`❌ No-buffer query failed: ${noBufferError.message}`);
    }
    
    // Test 8: Connection pool status
    console.log('\n📊 Test 8: Connection Pool Status');
    console.log('-'.repeat(70));
    console.log('Connection details:');
    console.log(`   ReadyState: ${mongoose.connection.readyState}`);
    console.log(`   Name: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    
    // Test 9: Disconnect and reconnect
    console.log('\n📊 Test 9: Disconnect and Reconnect Test');
    console.log('-'.repeat(70));
    
    console.log('Disconnecting...');
    await mongoose.disconnect();
    console.log('✅ Disconnected');
    
    console.log('Reconnecting...');
    const reconnectStart = Date.now();
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      dbName: 'kelmah_platform'
    });
    const reconnectTime = Date.now() - reconnectStart;
    console.log(`✅ Reconnected in ${reconnectTime}ms`);
    
    // Final test: Query after reconnect
    const User2 = mongoose.model('User');
    const finalCount = await User2.countDocuments({ isActive: true });
    console.log(`✅ Query after reconnect successful: ${finalCount} active users`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL DIAGNOSTICS PASSED!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ DIAGNOSTIC FAILED');
    console.log('='.repeat(70));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

deepDiagnostics();
