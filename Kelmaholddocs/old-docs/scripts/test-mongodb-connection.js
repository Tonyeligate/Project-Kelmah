#!/usr/bin/env node

/**
 * 🔍 MONGODB CONNECTION TEST
 * Tests basic connectivity to the MongoDB cluster
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

async function testConnection() {
  console.log('🔍 TESTING MONGODB CONNECTION');
  console.log('============================');
  
  if (!MONGODB_URI) {
    console.log('❌ No DATABASE_URL environment variable found');
    return;
  }

  console.log('🔄 Attempting to connect...');
  console.log(`📡 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//[CREDENTIALS]@')}`);

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB!');
    
    const admin = client.db().admin();
    const info = await admin.serverStatus();
    
    console.log(`📊 Server Version: ${info.version}`);
    console.log(`🏠 Host: ${info.host}`);
    console.log(`⏱️  Uptime: ${Math.floor(info.uptime / 3600)} hours`);
    
    await client.close();
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL/TLS Issue Detected');
      console.log('This appears to be a certificate or SSL configuration issue.');
      console.log('Your MongoDB cluster is likely working fine, but there\'s a connection security issue.');
    }
  }
}

testConnection().catch(console.error);