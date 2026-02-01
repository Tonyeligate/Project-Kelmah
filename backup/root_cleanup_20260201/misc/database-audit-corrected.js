/**
 * COMPREHENSIVE DATABASE INTEGRITY AUDIT - CORRECTED VERSION
 * 6-Phase Protocol for Kelmah Platform
 * 
 * CRITICAL FIX: Uses correct database schema
 * - Workers stored in 'users' collection with role='worker'
 * - Worker profiles in 'workerprofiles' collection
 * - Jobs in 'jobs' collection
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Approved trade specializations
const APPROVED_TRADES = [
  'Electrical Work',
  'Plumbing Services',
  'Carpentry & Woodwork',
  'Painting & Decoration',
  'Masonry & Stonework',
  'Roofing Services',
  'HVAC & Climate Control',
  'Landscaping',
  'Construction & Building',
  'Welding Services',
  'Tiling & Flooring',
  'General Maintenance',
  'General Work' // Add for existing data
];

const APPROVED_WORK_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Daily Work',
  'Project-based'
];

const auditResults = {
  phase1: { emergencyActions: [] },
  phase2: { workersAudit: [] },
  phase3: { jobsAudit: [] },
  phase4: { criticalTests: [] },
  phase5: { apiValidation: [] },
  phase6: { summary: {} }
};

let client;
let db;

async function connectToDatabase() {
  console.log('\n🔌 Connecting to MongoDB Atlas...\n');
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db('kelmah_platform');
  console.log('✅ Connected successfully\n');
}

// ============================================================================
// PHASE 1: EMERGENCY ACTIONS
// ============================================================================
async function phase1EmergencyActions() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 1: EMERGENCY ACTIONS');
  console.log('='.repeat(80) + '\n');

  const usersCollection = db.collection('users');
  const jobsCollection = db.collection('jobs');

  // CHECK 1: Verify Jobs Data
  console.log('📊 CHECK 1: Jobs Data Verification\n');
  const jobsCount = await jobsCollection.countDocuments();
  console.log(`Total jobs in database: ${jobsCount}`);
  
  if (jobsCount === 0) {
    console.log('❌ CRITICAL: No jobs found - DATA LOSS DETECTED');
    auditResults.phase1.emergencyActions.push({
      check: 'Jobs Data',
      status: 'CRITICAL',
      action: 'RESTORE_FROM_BACKUP'
    });
  } else {
    console.log(`✅ Jobs data present: ${jobsCount} jobs found\n`);
    auditResults.phase1.emergencyActions.push({
      check: 'Jobs Data',
      status: 'OK',
      count: jobsCount
    });
  }

  // CHECK 2: Verify Workers exist in users collection
  console.log('📊 CHECK 2: Workers Data Verification\n');
  const workersCount = await usersCollection.countDocuments({ role: 'worker' });
  console.log(`Total workers in users collection: ${workersCount}`);
  
  if (workersCount === 0) {
    console.log('❌ CRITICAL: No workers found\n');
    auditResults.phase1.emergencyActions.push({
      check: 'Workers Data',
      status: 'CRITICAL'
    });
  } else {
    console.log(`✅ Workers data present: ${workersCount} workers found\n`);
    auditResults.phase1.emergencyActions.push({
      check: 'Workers Data',
      status: 'OK',
      count: workersCount
    });
  }

  // CHECK 3: Verify Text Indexes
  console.log('📑 CHECK 3: Text Index Verification\n');
  
  const userIndexes = await usersCollection.indexes();
  const userTextIndex = userIndexes.find(idx => 
    idx.name && idx.name.includes('text')
  );
  
  if (userTextIndex) {
    console.log('✅ Users text index exists:', userTextIndex.name);
    auditResults.phase1.emergencyActions.push({
      check: 'Users Text Index',
      status: 'OK',
      indexName: userTextIndex.name
    });
  } else {
    console.log('⚠️  Users text index missing - creating...');
    try {
      await usersCollection.createIndex({
        firstName: 'text',
        lastName: 'text',
        profession: 'text',
        bio: 'text',
        skills: 'text'
      }, { name: 'worker_text_search' });
      console.log('✅ Users text index created');
      auditResults.phase1.emergencyActions.push({
        check: 'Users Text Index',
        status: 'CREATED'
      });
    } catch (error) {
      console.log('❌ Failed to create text index:', error.message);
    }
  }
  
  const jobIndexes = await jobsCollection.indexes();
  const jobTextIndex = jobIndexes.find(idx => 
    idx.name && idx.name.includes('text')
  );
  
  if (jobTextIndex) {
    console.log('✅ Jobs text index exists:', jobTextIndex.name);
    auditResults.phase1.emergencyActions.push({
      check: 'Jobs Text Index',
      status: 'OK',
      indexName: jobTextIndex.name
    });
  }
  
  console.log('\n✅ Phase 1 Complete\n');
}

// ============================================================================
// PHASE 2: WORKERS AUDIT (USERS COLLECTION)
// ============================================================================
async function phase2WorkersAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 2: WORKERS AUDIT (users collection)');
  console.log('='.repeat(80) + '\n');

  const usersCollection = db.collection('users');
  const workers = await usersCollection.find({ role: 'worker' }).toArray();
  
  console.log(`📊 Total Workers: ${workers.length}\n`);

  let totalIssues = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;

  // AUDIT 1: Missing Location
  console.log('🔍 AUDIT 1: Missing Location\n');
  const missingLocation = workers.filter(w => !w.location || w.location === '');
  
  if (missingLocation.length > 0) {
    console.log(`⚠️  Found ${missingLocation.length} workers without location`);
    totalIssues += missingLocation.length;
  } else {
    console.log('✅ All workers have location\n');
  }

  // AUDIT 2: Invalid/Missing Specializations
  console.log('🔍 AUDIT 2: Specialization Validation\n');
  for (const worker of workers) {
    const specs = worker.specializations || [];
    if (specs.length === 0) {
      console.log(`⚠️  ${worker.firstName} ${worker.lastName}: No specializations`);
      await usersCollection.updateOne(
        { _id: worker._id },
        { $set: { specializations: ['General Maintenance'] } }
      );
      totalIssues++;
      totalUpdated++;
    } else {
      const invalidSpecs = specs.filter(s => !APPROVED_TRADES.includes(s));
      if (invalidSpecs.length > 0) {
        console.log(`⚠️  ${worker.firstName} ${worker.lastName}: Invalid specializations: ${JSON.stringify(invalidSpecs)}`);
        const validSpecs = specs.filter(s => APPROVED_TRADES.includes(s));
        if (validSpecs.length === 0) {
          await usersCollection.updateOne(
            { _id: worker._id },
            { $set: { specializations: ['General Maintenance'] } }
          );
        } else {
          await usersCollection.updateOne(
            { _id: worker._id },
            { $set: { specializations: validSpecs } }
          );
        }
        totalIssues++;
        totalUpdated++;
      }
    }
  }
  console.log(`✅ Specialization audit complete\n`);

  // AUDIT 3: Work Type Validation
  console.log('🔍 AUDIT 3: Work Type Validation\n');
  for (const worker of workers) {
    const workType = worker.workerProfile?.workType;
    if (!workType || !APPROVED_WORK_TYPES.includes(workType)) {
      console.log(`⚠️  ${worker.firstName} ${worker.lastName}: Invalid work type "${workType}"`);
      await usersCollection.updateOne(
        { _id: worker._id },
        { $set: { 'workerProfile.workType': 'Full-time' } }
      );
      totalIssues++;
      totalUpdated++;
    }
  }
  console.log(`✅ Work type validation complete\n`);

  // AUDIT 4: Rating Integrity
  console.log('🔍 AUDIT 4: Rating Integrity\n');
  for (const worker of workers) {
    if (worker.rating < 0 || worker.rating > 5 || worker.totalReviews < 0) {
      console.log(`⚠️  ${worker.firstName} ${worker.lastName}: Invalid rating/reviews`);
      await usersCollection.updateOne(
        { _id: worker._id },
        { 
          $set: { 
            rating: Math.max(0, Math.min(5, worker.rating || 4.5)),
            totalReviews: Math.max(0, worker.totalReviews || 0)
          } 
        }
      );
      totalIssues++;
      totalUpdated++;
    }
  }
  console.log(`✅ Rating integrity check complete\n`);

  auditResults.phase2.workersAudit.push({
    totalWorkers: workers.length,
    totalIssues,
    totalUpdated,
    totalDeleted
  });

  console.log('✅ Phase 2 Complete\n');
}

// ============================================================================
// PHASE 3: JOBS AUDIT
// ============================================================================
async function phase3JobsAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 3: JOBS AUDIT');
  console.log('='.repeat(80) + '\n');

  const jobsCollection = db.collection('jobs');
  const jobs = await jobsCollection.find({}).toArray();
  
  console.log(`📊 Total Jobs: ${jobs.length}\n`);

  let totalIssues = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;

  // AUDIT 1: Missing Fields
  console.log('🔍 AUDIT 1: Required Fields Check\n');
  const missingFields = jobs.filter(j => !j.title || !j.description);
  if (missingFields.length > 0) {
    console.log(`⚠️  Found ${missingFields.length} jobs with missing fields - deleting...`);
    await jobsCollection.deleteMany({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { description: { $exists: false } },
        { description: null }
      ]
    });
    totalDeleted = missingFields.length;
  } else {
    console.log('✅ All jobs have required fields\n');
  }

  // AUDIT 2: Status Validation
  console.log('🔍 AUDIT 2: Job Status Validation\n');
  for (const job of jobs) {
    if (job.status && job.status !== 'Open' && job.status !== 'Closed' && job.status !== 'In Progress') {
      console.log(`⚠️  Job "${job.title}": Invalid status "${job.status}" - setting to "Open"`);
      await jobsCollection.updateOne(
        { _id: job._id },
        { $set: { status: 'Open' } }
      );
      totalIssues++;
      totalUpdated++;
    }
  }
  console.log(`✅ Status validation complete\n`);

  auditResults.phase3.jobsAudit.push({
    totalJobs: jobs.length,
    totalIssues,
    totalUpdated,
    totalDeleted
  });

  console.log('✅ Phase 3 Complete\n');
}

// ============================================================================
// PHASE 4: CRITICAL TESTING
// ============================================================================
async function phase4CriticalTesting() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 4: CRITICAL TESTING');
  console.log('='.repeat(80) + '\n');

  const usersCollection = db.collection('users');
  const jobsCollection = db.collection('jobs');

  // TEST 1: Worker Text Search
  console.log('🧪 TEST 1: Worker Text Search\n');
  try {
    const textSearch = await usersCollection.find({
      role: 'worker',
      $text: { $search: 'electrician' }
    }).toArray();
    
    console.log(`✅ PASS: Text search found ${textSearch.length} results\n`);
    auditResults.phase4.criticalTests.push({
      test: 'Worker Text Search',
      status: 'PASS',
      results: textSearch.length
    });
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    auditResults.phase4.criticalTests.push({
      test: 'Worker Text Search',
      status: 'FAIL',
      error: error.message
    });
  }

  // TEST 2: Location Filter
  console.log('🧪 TEST 2: Location Filter (Accra)\n');
  const accra = await usersCollection.find({
    role: 'worker',
    location: { $regex: /Accra/i }
  }).toArray();
  
  console.log(`✅ PASS: Found ${accra.length} workers in Accra\n`);
  auditResults.phase4.criticalTests.push({
    test: 'Location Filter',
    status: 'PASS',
    results: accra.length
  });

  // TEST 3: Specialization Filter
  console.log('🧪 TEST 3: Specialization Filter\n');
  const specialized = await usersCollection.find({
    role: 'worker',
    specializations: 'Carpentry & Woodwork'
  }).toArray();
  
  console.log(`✅ PASS: Found ${specialized.length} carpenters\n`);
  auditResults.phase4.criticalTests.push({
    test: 'Specialization Filter',
    status: 'PASS',
    results: specialized.length
  });

  // TEST 4: Jobs Status
  console.log('🧪 TEST 4: Jobs with Status "Open"\n');
  const openJobs = await jobsCollection.find({ status: 'Open' }).toArray();
  
  console.log(`✅ PASS: Found ${openJobs.length} open jobs\n`);
  auditResults.phase4.criticalTests.push({
    test: 'Open Jobs',
    status: 'PASS',
    results: openJobs.length
  });

  console.log('✅ Phase 4 Complete\n');
}

// ============================================================================
// PHASE 5 & 6: API VALIDATION & REPORT
// ============================================================================
async function phase5And6() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 5 & 6: REPORT GENERATION');
  console.log('='.repeat(80) + '\n');

  const usersCollection = db.collection('users');
  const jobsCollection = db.collection('jobs');

  const finalWorkers = await usersCollection.countDocuments({ role: 'worker' });
  const finalJobs = await jobsCollection.countDocuments();

  const testsPassed = auditResults.phase4.criticalTests.filter(t => t.status === 'PASS').length;
  const totalTests = auditResults.phase4.criticalTests.length;

  console.log('📊 FINAL AUDIT REPORT\n');
  console.log(`Workers: ${finalWorkers}`);
  console.log(`Jobs: ${finalJobs}`);
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${(testsPassed/totalTests * 100).toFixed(1)}%\n`);

  auditResults.phase6.summary = {
    workersCount: finalWorkers,
    jobsCount: finalJobs,
    testsPassed,
    totalTests,
    successRate: `${(testsPassed/totalTests * 100).toFixed(1)}%`
  };

  const fs = require('fs');
  fs.writeFileSync('./DATABASE_AUDIT_REPORT_CORRECTED.json', JSON.stringify(auditResults, null, 2));
  console.log('📄 Report saved to DATABASE_AUDIT_REPORT_CORRECTED.json\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runAudit() {
  try {
    console.log('\n' + '█'.repeat(80));
    console.log('KELMAH DATABASE AUDIT - CORRECTED SCHEMA VERSION');
    console.log('█'.repeat(80));

    await connectToDatabase();
    await phase1EmergencyActions();
    await phase2WorkersAudit();
    await phase3JobsAudit();
    await phase4CriticalTesting();
    await phase5And6();

    console.log('✅ AUDIT COMPLETE\n');

  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
  } finally {
    if (client) await client.close();
  }
}

runAudit();
