#!/usr/bin/env node

/**
 * 🚨 MONGODB DATABASE FIX SCRIPT
 * Fixes MongoDB collections and ensures proper schema for Kelmah services
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ DATABASE_URL or MONGODB_URI environment variable required');
  process.exit(1);
}

async function fixMongoDatabase() {
  console.log('🚨 STARTING MONGODB DATABASE FIX');
  console.log('================================');

  const client = new MongoClient(MONGODB_URI, {
    retryWrites: true,
    serverSelectionTimeoutMS: 30000, // 30 second timeout
    connectTimeoutMS: 30000
  });

  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

    const db = client.db('kelmah_platform');
    console.log(`📊 Database: ${db.databaseName}`);

    // Check existing collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Existing collections: ${collections.map(c => c.name).join(', ')}`);

    // Create Users collection with proper indexes
    console.log('\n👤 Setting up Users collection...');
    const usersCollection = db.collection('users');
    
    // Create indexes for performance
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ 'profile.profession': 1 });
    await usersCollection.createIndex({ 'profile.location': 1 });
    console.log('✅ Users collection indexes created');

    // Create Jobs collection
    console.log('\n💼 Setting up Jobs collection...');
    const jobsCollection = db.collection('jobs');
    await jobsCollection.createIndex({ hirerId: 1 });
    await jobsCollection.createIndex({ category: 1 });
    await jobsCollection.createIndex({ status: 1 });
    await jobsCollection.createIndex({ location: 1 });
    await jobsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Jobs collection indexes created');

    // Create Applications collection  
    console.log('\n📝 Setting up Applications collection...');
    const applicationsCollection = db.collection('applications');
    await applicationsCollection.createIndex({ jobId: 1 });
    await applicationsCollection.createIndex({ workerId: 1 });
    await applicationsCollection.createIndex({ status: 1 });
    await applicationsCollection.createIndex({ appliedAt: -1 });
    console.log('✅ Applications collection indexes created');

    // Create Messages collection
    console.log('\n💬 Setting up Messages collection...');
    const messagesCollection = db.collection('messages');
    await messagesCollection.createIndex({ conversationId: 1 });
    await messagesCollection.createIndex({ senderId: 1 });
    await messagesCollection.createIndex({ createdAt: -1 });
    console.log('✅ Messages collection indexes created');

    // Create Conversations collection
    console.log('\n💭 Setting up Conversations collection...');
    const conversationsCollection = db.collection('conversations');
    await conversationsCollection.createIndex({ participants: 1 });
    await conversationsCollection.createIndex({ updatedAt: -1 });
    console.log('✅ Conversations collection indexes created');

    // Create Notifications collection
    console.log('\n🔔 Setting up Notifications collection...');
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.createIndex({ userId: 1 });
    await notificationsCollection.createIndex({ read: 1 });
    await notificationsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Notifications collection indexes created');

    // Create Contracts collection
    console.log('\n📄 Setting up Contracts collection...');
    const contractsCollection = db.collection('contracts');
    await contractsCollection.createIndex({ hirerId: 1 });
    await contractsCollection.createIndex({ workerId: 1 });
    await contractsCollection.createIndex({ jobId: 1 });
    await contractsCollection.createIndex({ status: 1 });
    console.log('✅ Contracts collection indexes created');

    // Create Payments collection
    console.log('\n💰 Setting up Payments collection...');
    const paymentsCollection = db.collection('payments');
    await paymentsCollection.createIndex({ userId: 1 });
    await paymentsCollection.createIndex({ contractId: 1 });
    await paymentsCollection.createIndex({ status: 1 });
    await paymentsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Payments collection indexes created');

    // Verify collections
    const finalCollections = await db.listCollections().toArray();
    console.log('\n📋 Final collections:');
    finalCollections.forEach(col => {
      console.log(`   ✅ ${col.name}`);
    });

    // Check if we have any existing users
    const userCount = await usersCollection.countDocuments();
    console.log(`\n👥 Current users in database: ${userCount}`);

    if (userCount > 0) {
      // Update any existing users to ensure they have required fields
      const updateResult = await usersCollection.updateMany(
        {},
        {
          $set: {
            isEmailVerified: { $ifNull: ['$isEmailVerified', false] },
            isPhoneVerified: { $ifNull: ['$isPhoneVerified', false] },
            isActive: { $ifNull: ['$isActive', true] },
            createdAt: { $ifNull: ['$createdAt', new Date()] },
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ Updated ${updateResult.modifiedCount} existing users with default values`);
    }

    console.log('\n🎉 MONGODB DATABASE FIX COMPLETED SUCCESSFULLY!');
    console.log('================================================');
    console.log('✅ All collections created with proper indexes');
    console.log('✅ Database ready for production use');
    console.log('✅ Existing data preserved and updated');
    console.log('\n🚀 Your MongoDB database is now optimized and ready!');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during MongoDB fix:');
    console.error(`Error: ${error.message}`);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Verify your MongoDB connection string is correct');
    console.error('2. Ensure your MongoDB cluster is running and accessible');
    console.error('3. Check your network connection');
    console.error('4. Verify database permissions');
    
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  fixMongoDatabase().catch(console.error);
}

module.exports = { fixMongoDatabase };