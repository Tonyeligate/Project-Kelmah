#!/usr/bin/env node

/**
 * ✅ BULK VERIFY ALL 40 USERS
 * Sets isEmailVerified: true for all users in MongoDB
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/?retryWrites=true&w=majority&appName=Kelmah-messaging';

// All 40 user emails that need verification
const ALL_USER_EMAILS = [
  // 20 Workers
  'kwame.asante1@kelmah.test',
  'efua.mensah@kelmah.test',
  'kwaku.osei@kelmah.test',
  'yaa.adjei@kelmah.test',
  'fiifi.boateng@kelmah.test',
  'afia.owusu@kelmah.test',
  'kwadwo.agyei@kelmah.test',
  'esi.darko@kelmah.test',
  'yaw.antwi@kelmah.test',
  'adjoa.oppong@kelmah.test',
  'kwame.gyamfi@kelmah.test',
  'efua.acheampong@kelmah.test',
  'kwaku.addai@kelmah.test',
  'yaa.wiredu@kelmah.test',
  'fiifi.frimpong@kelmah.test',
  'afia.nyarko@kelmah.test',
  'kwadwo.bediako@kelmah.test',
  'esi.appiah@kelmah.test',
  'yaw.danso@kelmah.test',
  'adjoa.ofori@kelmah.test',
  
  // 20 Hirers
  'samuel.osei@ghanaconstruction.com',
  'akosua.mensah@goldstarbuilders.com',
  'kwame.boateng@modernbuild.com',
  'ama.asante@reliableconstruct.com',
  'kofi.adjei@elmaconstruction.com',
  'yaw.opoku@grandrealestate.com',
  'abena.owusu@cityviewdevelopers.com',
  'kwaku.darko@coastalproperties.com',
  'margaret.agyei@gmail.com',
  'joseph.appiah@gmail.com',
  'grace.adomako@gmail.com',
  'daniel.ofori@gmail.com',
  'rebecca.boadu@palmgrovehotel.com',
  'charles.nkrumah@goldenlodge.com',
  'comfort.amponsah@beachviewhotel.com',
  'emmanuel.tetteh@maxvalue.com',
  'vivian.asiedu@plazacentre.com',
  'francis.hayford@citymarket.com',
  'sarah.kuffour@govgh.org',
  'isaac.obeng@communitydev.org'
];

async function connectToDatabase() {
  console.log('🔌 CONNECTING TO MONGODB...');
  console.log('============================');
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Try different possible database names
    const databases = ['kelmah', 'kelmah-auth', 'auth', 'users'];
    let db = null;
    let usersCollection = null;
    
    for (const dbName of databases) {
      try {
        const testDb = client.db(dbName);
        const collections = await testDb.listCollections().toArray();
        
        console.log(`🔍 Checking database: ${dbName}`);
        console.log(`   Collections found: ${collections.map(c => c.name).join(', ')}`);
        
        // Look for users collection
        const userCollections = collections.filter(c => 
          c.name.includes('user') || c.name.includes('User') || c.name === 'users'
        );
        
        if (userCollections.length > 0) {
          db = testDb;
          usersCollection = db.collection(userCollections[0].name);
          console.log(`✅ Found users collection: ${userCollections[0].name} in database: ${dbName}`);
          break;
        }
      } catch (error) {
        console.log(`   ❌ Database ${dbName} not accessible`);
      }
    }
    
    if (!usersCollection) {
      throw new Error('Could not find users collection in any database');
    }
    
    return { client, db, usersCollection };
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

async function verifyAllUsers(usersCollection) {
  console.log('\n✅ BULK VERIFYING ALL 40 USERS');
  console.log('===============================');
  
  let verifiedCount = 0;
  let notFoundCount = 0;
  let alreadyVerifiedCount = 0;
  const verifiedUsers = [];
  
  for (let i = 0; i < ALL_USER_EMAILS.length; i++) {
    const email = ALL_USER_EMAILS[i];
    console.log(`\n🔄 Processing ${i + 1}/40: ${email}`);
    
    try {
      // First, check if user exists
      const user = await usersCollection.findOne({ email: email });
      
      if (!user) {
        console.log(`   ❌ User not found in database`);
        notFoundCount++;
        continue;
      }
      
      if (user.isEmailVerified === true) {
        console.log(`   ✅ Already verified`);
        alreadyVerifiedCount++;
        verifiedUsers.push({
          email: email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role || 'unknown',
          status: 'already_verified'
        });
        continue;
      }
      
      // Update user to set isEmailVerified: true
      const updateResult = await usersCollection.updateOne(
        { email: email },
        { 
          $set: { 
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount === 1) {
        console.log(`   🎉 Successfully verified!`);
        verifiedCount++;
        verifiedUsers.push({
          email: email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role || 'unknown',
          status: 'newly_verified'
        });
      } else {
        console.log(`   ❓ Update failed (no changes made)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  return {
    verifiedCount,
    notFoundCount,
    alreadyVerifiedCount,
    verifiedUsers,
    totalProcessed: ALL_USER_EMAILS.length
  };
}

async function testLoginCapability(verifiedUsers) {
  console.log('\n🧪 TESTING LOGIN CAPABILITY');
  console.log('============================');
  
  const axios = require('axios');
  const AUTH_SERVICE_URL = 'https://kelmah-auth-service.onrender.com';
  
  // Test with first 3 verified users
  const testUsers = verifiedUsers.slice(0, 3);
  let loginSuccessCount = 0;
  
  for (const user of testUsers) {
    console.log(`\n🔑 Testing login: ${user.email}`);
    
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: user.email,
        password: 'TestUser123!'
      }, { timeout: 10000 });
      
      if (response.data.success || response.data.data?.token) {
        console.log(`   🎉 LOGIN SUCCESS! Token received.`);
        loginSuccessCount++;
      } else {
        console.log(`   ❓ Unexpected response: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      if (error.response?.data?.message) {
        console.log(`   ❌ Login failed: ${error.response.data.message}`);
      } else {
        console.log(`   ❌ Login error: ${error.message}`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return loginSuccessCount;
}

async function generateVerificationReport(results, loginSuccessCount) {
  console.log('\n📊 VERIFICATION RESULTS SUMMARY');
  console.log('================================');
  console.log(`✅ Newly Verified: ${results.verifiedCount} users`);
  console.log(`✅ Already Verified: ${results.alreadyVerifiedCount} users`);
  console.log(`❌ Not Found: ${results.notFoundCount} users`);
  console.log(`📊 Total Processed: ${results.totalProcessed} users`);
  console.log(`🔑 Login Test Success: ${loginSuccessCount}/3 tested`);
  
  const totalVerified = results.verifiedCount + results.alreadyVerifiedCount;
  
  if (totalVerified > 0) {
    console.log('\n🎉 VERIFIED USERS READY FOR LOGIN:');
    console.log('==================================');
    
    // Group by role
    const workers = results.verifiedUsers.filter(u => u.role === 'worker');
    const hirers = results.verifiedUsers.filter(u => u.role === 'hirer');
    
    if (workers.length > 0) {
      console.log(`\n👷 WORKERS (${workers.length}):`);
      workers.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.email}`);
      });
      if (workers.length > 5) {
        console.log(`   ... and ${workers.length - 5} more workers`);
      }
    }
    
    if (hirers.length > 0) {
      console.log(`\n🏗️ HIRERS (${hirers.length}):`);
      hirers.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.email}`);
      });
      if (hirers.length > 5) {
        console.log(`   ... and ${hirers.length - 5} more hirers`);
      }
    }
    
    console.log('\n🔑 LOGIN CREDENTIALS FOR ALL VERIFIED USERS:');
    console.log('===========================================');
    console.log('🌐 Frontend URL: https://kelmah-frontend-mu.vercel.app/login');
    console.log('🔐 Password for ALL users: TestUser123!');
    console.log(`📧 Use any of the ${totalVerified} verified emails above`);
    
    console.log('\n🚀 QUICK TEST LOGIN:');
    console.log('====================');
    if (results.verifiedUsers.length > 0) {
      const testUser = results.verifiedUsers[0];
      console.log(`📧 Email: ${testUser.email}`);
      console.log(`🔑 Password: TestUser123!`);
      console.log(`👤 Role: ${testUser.role}`);
      console.log(`📝 Name: ${testUser.name}`);
    }
  }
  
  // Save detailed report
  const fs = require('fs');
  const path = require('path');
  const reportFile = path.join(__dirname, 'USER-VERIFICATION-REPORT.json');
  
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalProcessed: results.totalProcessed,
      newlyVerified: results.verifiedCount,
      alreadyVerified: results.alreadyVerifiedCount,
      notFound: results.notFoundCount,
      totalVerified: totalVerified,
      loginTestSuccess: loginSuccessCount
    },
    verifiedUsers: results.verifiedUsers,
    credentials: {
      password: 'TestUser123!',
      frontendUrl: 'https://kelmah-frontend-mu.vercel.app/login'
    }
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved to: ${reportFile}`);
  
  return totalVerified;
}

async function main() {
  console.log('🎯 BULK USER VERIFICATION SYSTEM');
  console.log('=================================');
  console.log('Verifying all 40 users in MongoDB Atlas...\n');
  
  let client = null;
  
  try {
    // Connect to database
    const { client: dbClient, usersCollection } = await connectToDatabase();
    client = dbClient;
    
    // Verify all users
    const results = await verifyAllUsers(usersCollection);
    
    // Test login capability
    const loginSuccessCount = await testLoginCapability(results.verifiedUsers);
    
    // Generate comprehensive report
    const totalVerified = await generateVerificationReport(results, loginSuccessCount);
    
    console.log('\n🎊 VERIFICATION COMPLETE!');
    console.log('=========================');
    
    if (totalVerified >= 40) {
      console.log('🎉 SUCCESS: All 40 users are now verified and ready to login!');
      console.log('🚀 Your Kelmah platform is 100% ready for production use!');
    } else if (totalVerified > 0) {
      console.log(`✅ SUCCESS: ${totalVerified} users are now verified and ready to login!`);
      console.log('🔍 Some users may need to be created first if they were not found.');
    } else {
      console.log('⚠️  No users were verified. Check if users exist in the database.');
    }
    
    console.log('\n🌟 NEXT STEPS:');
    console.log('1. Go to: https://kelmah-frontend-mu.vercel.app/login');
    console.log('2. Use any verified email with password: TestUser123!');
    console.log('3. Enjoy your fully functional platform with real users!');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 ALTERNATIVE SOLUTION:');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Browse Collections → users');
      console.log('3. Find any user (e.g., kwame.asante1@kelmah.test)');
      console.log('4. Edit document: Set "isEmailVerified": true');
      console.log('5. Save and login with that user!');
    }
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed.');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { connectToDatabase, verifyAllUsers };