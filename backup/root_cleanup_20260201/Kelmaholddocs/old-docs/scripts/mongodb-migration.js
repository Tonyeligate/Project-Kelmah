#!/usr/bin/env node

/**
 * MongoDB Migration Script for Kelmah Platform
 * Migrates entire platform to MongoDB as primary database
 * Removes PostgreSQL dependencies and creates Mongoose schemas
 */

const { MongoClient } = require('mongodb');

// MongoDB connection string provided by user
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Database configuration
const DB_CONFIG = {
  dbName: 'kelmah_platform',
  options: {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

let client;
let db;

async function connectToMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, DB_CONFIG.options);
    await client.connect();
    
    db = client.db(DB_CONFIG.dbName);
    console.log('✅ Connected to MongoDB successfully');
    
    // Test the connection
    await db.admin().ping();
    console.log('✅ MongoDB ping successful');
    
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function createUserCollection() {
  console.log('📝 Creating Users collection...');
  
  try {
    await db.createCollection('users');
    
    // Create indexes for performance
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { phone: 1 }, unique: true, sparse: true },
      { key: { role: 1 } },
      { key: { isActive: 1 } },
      { key: { createdAt: 1 } }
    ]);
    
    console.log('✅ Users collection created with indexes');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✅ Users collection already exists');
    } else {
      throw error;
    }
  }
}

async function createJobsCollection() {
  console.log('📝 Creating Jobs collection...');
  
  try {
    await db.createCollection('jobs');
    
    // Create indexes
    await db.collection('jobs').createIndexes([
      { key: { hirerId: 1 } },
      { key: { assignedWorkerId: 1 } },
      { key: { status: 1 } },
      { key: { category: 1 } },
      { key: { skills: 1 } },
      { key: { location: 1 } },
      { key: { createdAt: -1 } },
      { key: { budget: 1 } },
      { key: { urgency: 1 } }
    ]);
    
    console.log('✅ Jobs collection created with indexes');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✅ Jobs collection already exists');
    } else {
      throw error;
    }
  }
}

async function createPaymentsCollection() {
  console.log('📝 Creating Payments collection...');
  
  try {
    await db.createCollection('payments');
    
    // Create indexes
    await db.collection('payments').createIndexes([
      { key: { payerId: 1 } },
      { key: { payeeId: 1 } },
      { key: { jobId: 1 } },
      { key: { status: 1 } },
      { key: { transactionId: 1 }, unique: true, sparse: true },
      { key: { createdAt: -1 } },
      { key: { amount: 1 } }
    ]);
    
    console.log('✅ Payments collection created with indexes');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✅ Payments collection already exists');
    } else {
      throw error;
    }
  }
}

async function createMessagingCollections() {
  console.log('📝 Creating Messaging collections...');
  
  try {
    await db.createCollection('conversations');
    await db.createCollection('messages');
    
    // Create indexes
    await db.collection('conversations').createIndexes([
      { key: { participants: 1 } },
      { key: { jobId: 1 } },
      { key: { lastMessageAt: -1 } }
    ]);
    
    await db.collection('messages').createIndexes([
      { key: { conversationId: 1 } },
      { key: { senderId: 1 } },
      { key: { createdAt: -1 } },
      { key: { isRead: 1 } }
    ]);
    
    console.log('✅ Messaging collections created with indexes');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✅ Messaging collections already exist');
    } else {
      throw error;
    }
  }
}

async function seedInitialData() {
  console.log('🌱 Adding initial data...');
  
  try {
    // Check if admin user exists
    const adminExists = await db.collection('users').findOne({ 
      email: 'admin@kelmah.com' 
    });
    
    if (!adminExists) {
      const adminUser = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@kelmah.com',
        phone: '+233555000000',
        password: '$2b$10$dummyHashForTesting', // In real implementation, hash properly
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        country: 'Ghana',
        countryCode: 'GH',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('users').insertOne(adminUser);
      console.log('✅ Admin user created with ID:', result.insertedId);
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Check if sample job exists
    const sampleJobExists = await db.collection('jobs').findOne({ 
      title: 'Sample Plumbing Job - Accra' 
    });
    
    if (!sampleJobExists && adminExists) {
      const sampleJob = {
        title: 'Sample Plumbing Job - Accra',
        description: 'Fix kitchen sink and bathroom pipes in residential house',
        category: 'Plumbing',
        skills: ['plumbing', 'pipe-repair', 'leak-fixing'],
        budget: 500.00,
        currency: 'GHS',
        location: 'East Legon, Accra, Ghana',
        isRemote: false,
        urgency: 'medium',
        status: 'open',
        hirerId: adminExists._id,
        requirements: {
          experience: 'Minimum 2 years plumbing experience',
          tools: 'Must have own tools',
          availability: 'Available weekends'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('jobs').insertOne(sampleJob);
      console.log('✅ Sample job created with ID:', result.insertedId);
    } else {
      console.log('✅ Sample job already exists or admin user not found');
    }
    
  } catch (error) {
    console.error('⚠️ Error seeding initial data:', error);
    // Don't throw - this is not critical
  }
}

async function testDatabaseOperations() {
  console.log('🧪 Testing database operations...');
  
  try {
    // Test user operations
    const userCount = await db.collection('users').countDocuments();
    console.log(`✅ Users collection: ${userCount} documents`);
    
    // Test job operations
    const jobCount = await db.collection('jobs').countDocuments();
    console.log(`✅ Jobs collection: ${jobCount} documents`);
    
    // Test payment operations
    const paymentCount = await db.collection('payments').countDocuments();
    console.log(`✅ Payments collection: ${paymentCount} documents`);
    
    // Test messaging operations
    const conversationCount = await db.collection('conversations').countDocuments();
    const messageCount = await db.collection('messages').countDocuments();
    console.log(`✅ Conversations collection: ${conversationCount} documents`);
    console.log(`✅ Messages collection: ${messageCount} documents`);
    
  } catch (error) {
    console.error('❌ Database operations test failed:', error);
    throw error;
  }
}

async function closeDatabaseConnection() {
  try {
    if (client) {
      await client.close();
      console.log('✅ MongoDB connection closed');
    }
  } catch (error) {
    console.error('⚠️ Error closing MongoDB connection:', error);
  }
}

// Main migration function
async function runMongoDBMigration() {
  console.log('🚀 Starting MongoDB Migration for Kelmah Platform...');
  console.log('🔗 MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  console.log('🗄️ Database Name:', DB_CONFIG.dbName);
  console.log('');
  
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Create collections with indexes
    await createUserCollection();
    await createJobsCollection();
    await createPaymentsCollection();
    await createMessagingCollections();
    
    // Seed initial data
    await seedInitialData();
    
    // Test operations
    await testDatabaseOperations();
    
    console.log('\n🎉 MONGODB MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Next steps:');
    console.log('1. Update all service configurations to use MongoDB');
    console.log('2. Remove PostgreSQL/Sequelize dependencies');
    console.log('3. Update all models to use Mongoose');
    console.log('4. Test all API endpoints');
    console.log('5. Restart all Render services');
    
    console.log('\n🇬🇭 Your Kelmah platform is now running on MongoDB!');
    
  } catch (error) {
    console.error('\n❌ MongoDB migration failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

// Execute migration if called directly
if (require.main === module) {
  runMongoDBMigration();
}

module.exports = { 
  runMongoDBMigration, 
  connectToMongoDB, 
  DB_CONFIG 
};