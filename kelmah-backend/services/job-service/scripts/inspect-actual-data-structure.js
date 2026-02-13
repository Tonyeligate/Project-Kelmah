/**
 * INSPECT ACTUAL DATABASE STRUCTURE
 * Understand the real schema before making fixes
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI = process.env.JOB_MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MongoDB connection string. Set JOB_MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

async function inspectData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    const workersCollection = db.collection('users');
    const jobsCollection = db.collection('jobs');
    
    // Get sample worker
    console.log('='.repeat(80));
    console.log('SAMPLE WORKER DOCUMENT:');
    console.log('='.repeat(80));
    const sampleWorker = await workersCollection.findOne({ role: 'worker' });
    console.log(JSON.stringify(sampleWorker, null, 2));
    
    // Get sample job
    console.log('\n' + '='.repeat(80));
    console.log('SAMPLE JOB DOCUMENT:');
    console.log('='.repeat(80));
    const sampleJob = await jobsCollection.findOne({});
    console.log(JSON.stringify(sampleJob, null, 2));
    
    // Check city field variations
    console.log('\n' + '='.repeat(80));
    console.log('CITY FIELD ANALYSIS:');
    console.log('='.repeat(80));
    
    const workersWithCity = await workersCollection.countDocuments({ 
      role: 'worker', 
      city: { $exists: true, $ne: null, $ne: '' } 
    });
    const workersWithProfileCity = await workersCollection.countDocuments({ 
      role: 'worker', 
      'workerProfile.city': { $exists: true, $ne: null, $ne: '' } 
    });
    const workersWithLocation = await workersCollection.countDocuments({ 
      role: 'worker', 
      location: { $exists: true, $ne: null, $ne: '' } 
    });
    const workersWithProfileLocation = await workersCollection.countDocuments({ 
      role: 'worker', 
      'workerProfile.location': { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`Workers with city field: ${workersWithCity}`);
    console.log(`Workers with workerProfile.city: ${workersWithProfileCity}`);
    console.log(`Workers with location field: ${workersWithLocation}`);
    console.log(`Workers with workerProfile.location: ${workersWithProfileLocation}`);
    
    // Check job city variations
    const jobsWithCity = await jobsCollection.countDocuments({ 
      city: { $exists: true, $ne: null, $ne: '' } 
    });
    const jobsWithLocationCity = await jobsCollection.countDocuments({ 
      'locationDetails.city': { $exists: true, $ne: null, $ne: '' } 
    });
    const jobsWithRegion = await jobsCollection.countDocuments({ 
      'locationDetails.region': { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`\nJobs with city field: ${jobsWithCity}`);
    console.log(`Jobs with locationDetails.city: ${jobsWithLocationCity}`);
    console.log(`Jobs with locationDetails.region: ${jobsWithRegion}`);
    
    // Check primaryTrade variations
    console.log('\n' + '='.repeat(80));
    console.log('PRIMARY TRADE ANALYSIS:');
    console.log('='.repeat(80));
    
    const workersPrimaryTrade = await workersCollection.countDocuments({ 
      role: 'worker', 
      'workerProfile.primaryTrade': { $exists: true, $ne: null, $ne: '' } 
    });
    const workersSpecializations = await workersCollection.countDocuments({ 
      role: 'worker', 
      'workerProfile.specializations': { $exists: true, $ne: null } 
    });
    
    console.log(`Workers with workerProfile.primaryTrade: ${workersPrimaryTrade}`);
    console.log(`Workers with workerProfile.specializations: ${workersSpecializations}`);
    
    // Sample trade values
    const tradesSample = await workersCollection.aggregate([
      { $match: { role: 'worker' } },
      { $group: { 
        _id: '$workerProfile.primaryTrade', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\nPrimary Trade Distribution:');
    tradesSample.forEach(t => {
      console.log(`  ${t._id || '(null)'}: ${t.count} workers`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

inspectData();
