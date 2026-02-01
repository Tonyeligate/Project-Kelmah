#!/usr/bin/env node

/**
 * Fix Job Hirers Script
 * Assigns real user IDs to jobs that have invalid/placeholder hirer references
 */

const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

async function fixJobHirers() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const jobsCollection = db.collection('jobs');

    // Find Gifty user (our test hirer)
    console.log('\nFinding test hirer user...');
    const giftyUser = await usersCollection.findOne({ 
      email: 'giftyafisa@gmail.com' 
    });

    if (!giftyUser) {
      console.error('❌ Gifty user not found! Please run create-gifty-user.js first');
      process.exit(1);
    }

    console.log('✅ Found hirer user:', {
      _id: giftyUser._id,
      email: giftyUser.email,
      firstName: giftyUser.firstName,
      lastName: giftyUser.lastName,
      role: giftyUser.role
    });

    // Ensure Gifty is a hirer
    if (giftyUser.role !== 'hirer') {
      console.log('\n⚠️ Updating Gifty user role to hirer...');
      await usersCollection.updateOne(
        { _id: giftyUser._id },
        { $set: { role: 'hirer' } }
      );
      console.log('✅ Role updated to hirer');
    }

    // Find all jobs with null or invalid hirer references
    console.log('\n📊 Analyzing jobs...');
    const allJobs = await jobsCollection.find({}).toArray();
    console.log(`Total jobs in database: ${allJobs.length}`);

    // Count jobs with null hirer
    const nullHirerJobs = allJobs.filter(job => !job.hirer);
    console.log(`Jobs with null hirer: ${nullHirerJobs.length}`);

    // Check jobs with hirer IDs that don't match any users
    let invalidHirerJobs = [];
    for (const job of allJobs) {
      if (job.hirer) {
        const hirerExists = await usersCollection.findOne({ _id: job.hirer });
        if (!hirerExists) {
          invalidHirerJobs.push(job);
        }
      }
    }
    console.log(`Jobs with invalid hirer references: ${invalidHirerJobs.length}`);

    const jobsToFix = [...nullHirerJobs, ...invalidHirerJobs];
    console.log(`\n🔧 Total jobs to fix: ${jobsToFix.length}`);

    if (jobsToFix.length === 0) {
      console.log('✅ All jobs have valid hirer references!');
      await mongoose.disconnect();
      return;
    }

    // Fix all jobs by assigning Gifty as hirer
    console.log('\n🔧 Assigning Gifty as hirer for all invalid jobs...');
    const jobIdsToFix = jobsToFix.map(job => job._id);

    const updateResult = await jobsCollection.updateMany(
      { _id: { $in: jobIdsToFix } },
      { $set: { hirer: giftyUser._id } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} jobs`);

    // Verify the fix
    console.log('\n✅ Verification:');
    const verifyJobs = await jobsCollection.find({
      _id: { $in: jobIdsToFix }
    }).limit(3).toArray();

    for (const job of verifyJobs) {
      const hirer = await usersCollection.findOne({ _id: job.hirer });
      console.log(`  - Job: "${job.title}" -> Hirer: ${hirer.firstName} ${hirer.lastName} (${hirer.email})`);
    }

    console.log('\n✅ Database fix complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Backend will now populate hirer data correctly');
    console.log('   2. Frontend will show "Gifty Afisa" as employer for all jobs');
    console.log('   3. Logos and verification badges will display (if set in user profile)');
    console.log('   4. Test the API: curl https://kelmah-api-gateway-qlyk.onrender.com/api/jobs?limit=1');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
fixJobHirers();
