/**
 * MongoDB Atlas Network Access Configuration
 * Script to verify and fix IP whitelist settings
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function testAndDiagnose() {
  console.log('🔍 MongoDB Atlas Connection Diagnostic');
  console.log('=====================================\n');

  try {
    console.log('⏳ Testing connection...');
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    console.log('✅ Connection successful!');

    const admin = client.db().admin();
    const serverInfo = await admin.serverInfo();
    console.log('📊 MongoDB Version:', serverInfo.version);

    // Test database operations
    const db = client.db('kelmah_platform');
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections:', collections.length);

    // Test users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log('👥 Users in database:', usersCount);

    await client.close();

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📝 DIAGNOSIS:');
    console.log('- MongoDB connection: WORKING');
    console.log('- Database access: WORKING');
    console.log('- Collections accessible: YES');
    console.log('\n⚠️ IF RENDER SERVICES STILL FAIL:');
    console.log('1. MongoDB Atlas IP whitelist may not include Render IPs');
    console.log('2. Need to add 0.0.0.0/0 to Network Access in MongoDB Atlas');
    console.log('3. Or add specific Render IP ranges\n');

  } catch (error) {
    console.error('❌ CONNECTION FAILED!');
    console.error('Error:', error.message);
    console.error('\n📝 COMMON CAUSES:');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('→ Network/DNS issue or IP not whitelisted');
    } else if (error.message.includes('Authentication failed')) {
      console.error('→ Invalid credentials');
    } else if (error.message.includes('timed out')) {
      console.error('→ Connection timeout - likely IP whitelist issue');
    }

    console.error('\n🔧 FIX:');
    console.error('1. Go to https://cloud.mongodb.com/');
    console.error('2. Select your cluster');
    console.error('3. Click "Network Access" in left menu');
    console.error('4. Click "Add IP Address"');
    console.error('5. Add: 0.0.0.0/0 (allow from anywhere)');
    console.error('6. Click "Confirm"');
    console.error('7. Wait 2-3 minutes for changes to apply\n');
  }
}

testAndDiagnose();
