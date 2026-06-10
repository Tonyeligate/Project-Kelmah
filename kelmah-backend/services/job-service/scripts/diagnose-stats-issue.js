/**
 * DIAGNOSTIC SCRIPT: Platform Statistics Issue
 * 
 * Purpose: Investigate why /api/jobs/stats returns all zeros
 * 
 * Tests:
 * 1. Database connection
 * 2. Jobs collection structure and data
 * 3. Users collection structure and data
 * 4. Applications collection structure and data
 * 5. Field names and status values
 * 6. Actual query results for each stat
 */

require('dotenv').config({ path: '../../../.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.JOB_MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MongoDB connection string. Set JOB_MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

async function diagnoseStatsIssue() {
  try {
    console.log('🔍 DIAGNOSTIC: Platform Statistics Issue Investigation\n');
    console.log('=' .repeat(70));
    
    // Connect to MongoDB
    console.log('\n📡 Step 1: Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    const jobsCol = db.collection('jobs');
    const usersCol = db.collection('users');
    const applicationsCol = db.collection('applications');
    
    // Check collections exist
    console.log('\n📊 Step 2: Checking Collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // Count documents in each collection
    const jobsCount = await jobsCol.countDocuments({});
    const usersCount = await usersCol.countDocuments({});
    const applicationsCount = await applicationsCol.countDocuments({});
    
    console.log(`\n📈 Document Counts:`);
    console.log(`   Jobs: ${jobsCount}`);
    console.log(`   Users: ${usersCount}`);
    console.log(`   Applications: ${applicationsCount}`);
    
    // Analyze Jobs Collection
    console.log('\n' + '='.repeat(70));
    console.log('🔍 JOBS COLLECTION ANALYSIS');
    console.log('='.repeat(70));
    
    // Get sample job to see structure
    const sampleJob = await jobsCol.findOne({});
    console.log('\n📄 Sample Job Structure:');
    if (sampleJob) {
      console.log('   Fields:', Object.keys(sampleJob));
      console.log('   Status field:', sampleJob.status);
      console.log('   Status type:', typeof sampleJob.status);
      console.log('   Hirer field:', sampleJob.hirer || sampleJob.hirerId || sampleJob.employer);
      console.log('   CreatedAt:', sampleJob.createdAt);
    } else {
      console.log('   ❌ No jobs found in database!');
    }
    
    // Check all unique status values
    const statusValues = await jobsCol.distinct('status');
    console.log('\n📌 All Status Values in Database:', statusValues);
    
    // Count by status
    console.log('\n📊 Jobs by Status:');
    for (const status of statusValues) {
      const count = await jobsCol.countDocuments({ status });
      console.log(`   ${status}: ${count}`);
    }
    
    // Test the actual query from getPlatformStats
    console.log('\n🧪 Testing getPlatformStats Queries:');
    
    // Query 1: Available jobs
    const availableJobsQuery = { status: { $in: ['open', 'Open', 'OPEN'] } };
    const availableJobs = await jobsCol.countDocuments(availableJobsQuery);
    console.log(`\n   ✓ Available Jobs Query:`, availableJobsQuery);
    console.log(`     Result: ${availableJobs}`);
    
    // Try alternative queries
    const alternativeQueries = [
      { status: 'active' },
      { status: 'Active' },
      { status: { $regex: /^open$/i } },
      { status: { $regex: /^active$/i } },
      {} // All jobs
    ];
    
    console.log('\n   🔄 Trying Alternative Queries:');
    for (const query of alternativeQueries) {
      const count = await jobsCol.countDocuments(query);
      console.log(`     Query: ${JSON.stringify(query)} → ${count} jobs`);
    }
    
    // Query 2: Active employers
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeEmployersResult = await jobsCol.aggregate([
      { 
        $match: { 
          createdAt: { $gte: THIRTY_DAYS_AGO }, 
          status: { $in: ['open', 'in-progress', 'completed', 'active', 'Active'] } 
        } 
      },
      { $group: { _id: '$hirer' } },
      { $count: 'count' }
    ]).toArray();
    console.log(`\n   ✓ Active Employers Query Result:`, activeEmployersResult);
    
    // Check what hirer field is actually called
    const sampleHirerFields = await jobsCol.findOne({}, { projection: { hirer: 1, hirerId: 1, employer: 1, postedBy: 1, userId: 1 } });
    console.log('     Hirer Field Names in Sample:', sampleHirerFields);
    
    // Analyze Users Collection
    console.log('\n' + '='.repeat(70));
    console.log('👥 USERS COLLECTION ANALYSIS');
    console.log('='.repeat(70));
    
    // Get sample user to see structure
    const sampleUser = await usersCol.findOne({ role: 'worker' });
    console.log('\n📄 Sample Worker Structure:');
    if (sampleUser) {
      console.log('   Fields:', Object.keys(sampleUser));
      console.log('   Role:', sampleUser.role);
      console.log('   isActive:', sampleUser.isActive);
      console.log('   isEmailVerified:', sampleUser.isEmailVerified);
      console.log('   emailVerified:', sampleUser.emailVerified);
    } else {
      console.log('   ❌ No workers found in database!');
    }
    
    // Count users by role
    const roles = await usersCol.distinct('role');
    console.log('\n📊 Users by Role:');
    for (const role of roles) {
      const count = await usersCol.countDocuments({ role });
      console.log(`   ${role}: ${count}`);
    }
    
    // Test skilled workers query
    console.log('\n🧪 Testing Skilled Workers Queries:');
    
    const skilledWorkersQueries = [
      { role: 'worker', isActive: { $ne: false } },
      { role: 'worker' },
      { role: 'worker', isActive: true },
      { role: 'worker', isEmailVerified: true },
      { userType: 'worker' }
    ];
    
    for (const query of skilledWorkersQueries) {
      const count = await usersCol.countDocuments(query);
      console.log(`   Query: ${JSON.stringify(query)} → ${count} users`);
    }
    
    // Analyze Applications Collection
    console.log('\n' + '='.repeat(70));
    console.log('📝 APPLICATIONS COLLECTION ANALYSIS');
    console.log('='.repeat(70));
    
    if (applicationsCount > 0) {
      const sampleApp = await applicationsCol.findOne({});
      console.log('\n📄 Sample Application Structure:');
      console.log('   Fields:', Object.keys(sampleApp));
      console.log('   Status:', sampleApp.status);
      
      // Count by status
      const appStatuses = await applicationsCol.distinct('status');
      console.log('\n📊 Applications by Status:');
      for (const status of appStatuses) {
        const count = await applicationsCol.countDocuments({ status });
        console.log(`   ${status}: ${count}`);
      }
    } else {
      console.log('\n   ⚠️  No applications in database yet');
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(70));
    
    console.log('\n🔑 KEY FINDINGS:');
    console.log(`   1. Database has ${jobsCount} jobs`);
    console.log(`   2. Job status values: ${statusValues.join(', ')}`);
    console.log(`   3. Database has ${usersCount} users`);
    console.log(`   4. Worker count varies based on query conditions`);
    console.log(`   5. Database has ${applicationsCount} applications`);
    
    console.log('\n💡 RECOMMENDED FIXES:');
    if (!statusValues.includes('open') && !statusValues.includes('Open')) {
      console.log('   ⚠️  No "open" status found - update query to match actual status values');
      console.log(`   ✓  Suggestion: Use status values: ${statusValues.join(' or ')}`);
    }
    
    if (jobsCount > 0 && availableJobs === 0) {
      console.log('   ⚠️  Jobs exist but availableJobs query returns 0');
      console.log('   ✓  Update status filter in getPlatformStats');
    }
    
    console.log('\n✅ Diagnostic Complete!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

// Run diagnostic
diagnoseStatsIssue().catch(console.error);
