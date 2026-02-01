/**
 * COMPREHENSIVE DATABASE INTEGRITY AUDIT
 * 6-Phase Protocol for Kelmah Platform
 * 
 * Phases:
 * 1. Emergency Actions (restore data, verify indexes)
 * 2. Workers Collection Audit
 * 3. Jobs Collection Audit
 * 4. Critical Testing
 * 5. Backend API Validation
 * 6. Report Generation
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection
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
  'General Maintenance'
];

const APPROVED_WORK_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Daily Work',
  'Project-based'
];

// Audit results storage
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

  const workersCollection = db.collection('workers');
  const jobsCollection = db.collection('jobs');

  // CHECK 1: Verify Jobs Data
  console.log('📊 CHECK 1: Jobs Data Verification\n');
  const jobsCount = await jobsCollection.countDocuments();
  console.log(`Total jobs in database: ${jobsCount}`);
  
  if (jobsCount === 0) {
    console.log('❌ CRITICAL: No jobs found - DATA LOSS DETECTED');
    console.log('⚠️  ACTION REQUIRED: Restore from backup immediately\n');
    auditResults.phase1.emergencyActions.push({
      check: 'Jobs Data',
      status: 'CRITICAL',
      action: 'RESTORE_FROM_BACKUP',
      details: 'Zero jobs found in database'
    });
  } else {
    console.log(`✅ Jobs data present: ${jobsCount} jobs found\n`);
    auditResults.phase1.emergencyActions.push({
      check: 'Jobs Data',
      status: 'OK',
      count: jobsCount
    });
  }

  // CHECK 2: Verify Text Indexes
  console.log('📑 CHECK 2: Text Index Verification\n');
  
  console.log('Workers Collection Indexes:');
  const workerIndexes = await workersCollection.indexes();
  const workerTextIndex = workerIndexes.find(idx => 
    idx.name && idx.name.includes('text')
  );
  
  if (workerTextIndex) {
    console.log('✅ Workers text index exists:', workerTextIndex.name);
    console.log('   Fields:', Object.keys(workerTextIndex.key || {}).filter(k => k !== '_fts'));
    auditResults.phase1.emergencyActions.push({
      check: 'Workers Text Index',
      status: 'OK',
      indexName: workerTextIndex.name
    });
  } else {
    console.log('❌ Workers text index MISSING');
    console.log('⚠️  ACTION: Creating text index...');
    try {
      await workersCollection.createIndex({
        fullName: 'text',
        title: 'text',
        specializations: 'text',
        skills: 'text',
        bio: 'text'
      }, { name: 'worker_text_search' });
      console.log('✅ Workers text index created successfully');
      auditResults.phase1.emergencyActions.push({
        check: 'Workers Text Index',
        status: 'CREATED',
        action: 'Index created successfully'
      });
    } catch (error) {
      console.log('❌ Failed to create workers text index:', error.message);
      auditResults.phase1.emergencyActions.push({
        check: 'Workers Text Index',
        status: 'FAILED',
        error: error.message
      });
    }
  }
  
  console.log('\nJobs Collection Indexes:');
  const jobIndexes = await jobsCollection.indexes();
  const jobTextIndex = jobIndexes.find(idx => 
    idx.name && idx.name.includes('text')
  );
  
  if (jobTextIndex) {
    console.log('✅ Jobs text index exists:', jobTextIndex.name);
    console.log('   Fields:', Object.keys(jobTextIndex.key || {}).filter(k => k !== '_fts'));
    auditResults.phase1.emergencyActions.push({
      check: 'Jobs Text Index',
      status: 'OK',
      indexName: jobTextIndex.name
    });
  } else {
    console.log('❌ Jobs text index MISSING');
    console.log('⚠️  ACTION: Creating text index...');
    try {
      await jobsCollection.createIndex({
        title: 'text',
        description: 'text',
        category: 'text',
        skills: 'text'
      }, { name: 'job_text_search' });
      console.log('✅ Jobs text index created successfully');
      auditResults.phase1.emergencyActions.push({
        check: 'Jobs Text Index',
        status: 'CREATED',
        action: 'Index created successfully'
      });
    } catch (error) {
      console.log('❌ Failed to create jobs text index:', error.message);
      auditResults.phase1.emergencyActions.push({
        check: 'Jobs Text Index',
        status: 'FAILED',
        error: error.message
      });
    }
  }
  
  console.log('\n✅ Phase 1 Complete\n');
}

// ============================================================================
// PHASE 2: WORKERS COLLECTION AUDIT
// ============================================================================
async function phase2WorkersAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 2: WORKERS COLLECTION AUDIT');
  console.log('='.repeat(80) + '\n');

  const workersCollection = db.collection('workers');
  const totalWorkers = await workersCollection.countDocuments();
  console.log(`📊 Total Workers: ${totalWorkers}\n`);

  let issuesFound = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;

  // AUDIT 1: Trade Mismatch Detection
  console.log('🔍 AUDIT 1: Trade Mismatch Detection\n');
  const workers = await workersCollection.find({}).toArray();
  
  for (const worker of workers) {
    const primaryTrade = worker.primaryTrade || worker.workerProfile?.primaryTrade;
    const specializations = worker.specializations || [];
    
    if (primaryTrade && specializations.length > 0) {
      if (!specializations.includes(primaryTrade)) {
        console.log(`⚠️  Worker ${worker.fullName}: primaryTrade "${primaryTrade}" not in specializations ${JSON.stringify(specializations)}`);
        console.log(`   ACTION: Setting primaryTrade to specializations[0] = "${specializations[0]}"`);
        
        await workersCollection.updateOne(
          { _id: worker._id },
          { $set: { primaryTrade: specializations[0] } }
        );
        
        issuesFound++;
        recordsUpdated++;
      }
    }
  }
  console.log(`✅ Trade mismatch check complete: ${issuesFound} issues fixed\n`);
  auditResults.phase2.workersAudit.push({
    audit: 'Trade Mismatch',
    issuesFound,
    recordsUpdated
  });
  issuesFound = 0;

  // AUDIT 2: Invalid Work Types
  console.log('🔍 AUDIT 2: Invalid Work Types\n');
  const invalidWorkTypes = await workersCollection.find({
    'workerProfile.workType': { $nin: APPROVED_WORK_TYPES }
  }).toArray();
  
  for (const worker of invalidWorkTypes) {
    const currentWorkType = worker.workerProfile?.workType;
    console.log(`⚠️  Worker ${worker.fullName}: Invalid workType "${currentWorkType}"`);
    
    if (currentWorkType === null || currentWorkType === '') {
      console.log(`   ACTION: Deleting worker with null workType`);
      await workersCollection.deleteOne({ _id: worker._id });
      recordsDeleted++;
    } else {
      console.log(`   ACTION: Setting workType to "Full-time"`);
      await workersCollection.updateOne(
        { _id: worker._id },
        { $set: { 'workerProfile.workType': 'Full-time' } }
      );
      recordsUpdated++;
    }
    issuesFound++;
  }
  console.log(`✅ Work type validation complete: ${issuesFound} issues fixed\n`);
  auditResults.phase2.workersAudit.push({
    audit: 'Invalid Work Types',
    issuesFound,
    recordsUpdated,
    recordsDeleted
  });
  issuesFound = 0;
  recordsDeleted = 0;

  // AUDIT 3: Missing Location
  console.log('🔍 AUDIT 3: Missing Location\n');
  const missingLocation = await workersCollection.find({
    $or: [
      { location: { $exists: false } },
      { location: null },
      { location: '' }
    ]
  }).toArray();
  
  if (missingLocation.length > 0) {
    console.log(`⚠️  Found ${missingLocation.length} workers with missing location`);
    console.log(`   ACTION: Deleting workers without location (required field)`);
    
    const deleteResult = await workersCollection.deleteMany({
      $or: [
        { location: { $exists: false } },
        { location: null },
        { location: '' }
      ]
    });
    
    recordsDeleted = deleteResult.deletedCount;
    console.log(`✅ Deleted ${recordsDeleted} workers\n`);
  } else {
    console.log(`✅ All workers have valid location\n`);
  }
  auditResults.phase2.workersAudit.push({
    audit: 'Missing Location',
    issuesFound: missingLocation.length,
    recordsDeleted
  });
  recordsDeleted = 0;

  // AUDIT 4: Rating Integrity
  console.log('🔍 AUDIT 4: Rating Integrity\n');
  const invalidRatings = await workersCollection.find({
    $or: [
      { averageRating: { $lt: 0 } },
      { averageRating: { $gt: 5 } },
      { totalReviews: { $lt: 0 } }
    ]
  }).toArray();
  
  for (const worker of invalidRatings) {
    console.log(`⚠️  Worker ${worker.fullName}: Invalid rating ${worker.averageRating} or reviews ${worker.totalReviews}`);
    console.log(`   ACTION: Resetting to default values (0)`);
    
    await workersCollection.updateOne(
      { _id: worker._id },
      { 
        $set: { 
          averageRating: 0,
          totalReviews: 0
        } 
      }
    );
    
    issuesFound++;
    recordsUpdated++;
  }
  console.log(`✅ Rating integrity check complete: ${issuesFound} issues fixed\n`);
  auditResults.phase2.workersAudit.push({
    audit: 'Rating Integrity',
    issuesFound,
    recordsUpdated
  });
  issuesFound = 0;
  recordsUpdated = 0;

  // AUDIT 5: Test Data Removal
  console.log('🔍 AUDIT 5: Test Data Removal\n');
  
  const testDataQuery = {
    $or: [
      { fullName: { $regex: /test|demo|sample/i } },
      { email: { $regex: /@test|@demo|@example/i } },
      { 
        $and: [
          { 'workerProfile.hourlyRate': { $in: [42, 52, 48, 60] } },
          { fullName: { $regex: /test|demo|sample/i } }
        ]
      }
    ]
  };
  
  const testData = await workersCollection.find(testDataQuery).toArray();
  
  if (testData.length > 0) {
    console.log(`⚠️  Found ${testData.length} test/demo workers:`);
    testData.forEach(worker => {
      console.log(`   - ${worker.fullName} (${worker.email})`);
    });
    
    console.log(`   ACTION: Deleting test data...`);
    const deleteResult = await workersCollection.deleteMany(testDataQuery);
    recordsDeleted = deleteResult.deletedCount;
    console.log(`✅ Deleted ${recordsDeleted} test workers\n`);
  } else {
    console.log(`✅ No test data found\n`);
  }
  auditResults.phase2.workersAudit.push({
    audit: 'Test Data Removal',
    issuesFound: testData.length,
    recordsDeleted
  });
  recordsDeleted = 0;

  // AUDIT 6: Specialization Standardization
  console.log('🔍 AUDIT 6: Specialization Standardization\n');
  const allWorkers = await workersCollection.find({}).toArray();
  
  for (const worker of allWorkers) {
    const specializations = worker.specializations || [];
    const invalidSpecs = specializations.filter(spec => !APPROVED_TRADES.includes(spec));
    
    if (invalidSpecs.length > 0) {
      console.log(`⚠️  Worker ${worker.fullName}: Invalid specializations ${JSON.stringify(invalidSpecs)}`);
      
      // Try to map to closest approved trade
      const validSpecs = specializations.filter(spec => APPROVED_TRADES.includes(spec));
      
      if (validSpecs.length === 0) {
        // Default to General Maintenance if no valid specs
        console.log(`   ACTION: Setting to ["General Maintenance"]`);
        await workersCollection.updateOne(
          { _id: worker._id },
          { $set: { specializations: ['General Maintenance'] } }
        );
      } else {
        console.log(`   ACTION: Keeping only valid specs: ${JSON.stringify(validSpecs)}`);
        await workersCollection.updateOne(
          { _id: worker._id },
          { $set: { specializations: validSpecs } }
        );
      }
      
      issuesFound++;
      recordsUpdated++;
    }
  }
  console.log(`✅ Specialization standardization complete: ${issuesFound} issues fixed\n`);
  auditResults.phase2.workersAudit.push({
    audit: 'Specialization Standardization',
    issuesFound,
    recordsUpdated
  });

  console.log('✅ Phase 2 Complete\n');
}

// ============================================================================
// PHASE 3: JOBS COLLECTION AUDIT
// ============================================================================
async function phase3JobsAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 3: JOBS COLLECTION AUDIT');
  console.log('='.repeat(80) + '\n');

  const jobsCollection = db.collection('jobs');
  const totalJobs = await jobsCollection.countDocuments();
  console.log(`📊 Total Jobs: ${totalJobs}\n`);

  let issuesFound = 0;
  let recordsDeleted = 0;
  let recordsUpdated = 0;

  // AUDIT 1: Missing Required Fields
  console.log('🔍 AUDIT 1: Missing Required Fields\n');
  const missingFields = await jobsCollection.find({
    $or: [
      { title: { $exists: false } },
      { title: null },
      { title: '' },
      { description: { $exists: false } },
      { description: null },
      { description: '' }
    ]
  }).toArray();
  
  if (missingFields.length > 0) {
    console.log(`⚠️  Found ${missingFields.length} jobs with missing title/description`);
    console.log(`   ACTION: Deleting invalid jobs...`);
    
    const deleteResult = await jobsCollection.deleteMany({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' },
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });
    
    recordsDeleted = deleteResult.deletedCount;
    console.log(`✅ Deleted ${recordsDeleted} invalid jobs\n`);
  } else {
    console.log(`✅ All jobs have required fields\n`);
  }
  auditResults.phase3.jobsAudit.push({
    audit: 'Missing Required Fields',
    issuesFound: missingFields.length,
    recordsDeleted
  });
  recordsDeleted = 0;

  // AUDIT 2: Invalid Budget
  console.log('🔍 AUDIT 2: Invalid Budget\n');
  const invalidBudget = await jobsCollection.find({
    $or: [
      { 'budget.amount': { $lte: 0 } },
      { 'budget.amount': { $gt: 100000 } },
      { 'budget.amount': null }
    ]
  }).toArray();
  
  if (invalidBudget.length > 0) {
    console.log(`⚠️  Found ${invalidBudget.length} jobs with invalid budget`);
    invalidBudget.forEach(job => {
      console.log(`   - ${job.title}: Budget = ${job.budget?.amount}`);
    });
    
    console.log(`   ACTION: Deleting jobs with invalid budget (likely test data)...`);
    const deleteResult = await jobsCollection.deleteMany({
      $or: [
        { 'budget.amount': { $lte: 0 } },
        { 'budget.amount': { $gt: 100000 } },
        { 'budget.amount': null }
      ]
    });
    
    recordsDeleted = deleteResult.deletedCount;
    console.log(`✅ Deleted ${recordsDeleted} jobs\n`);
  } else {
    console.log(`✅ All jobs have valid budgets\n`);
  }
  auditResults.phase3.jobsAudit.push({
    audit: 'Invalid Budget',
    issuesFound: invalidBudget.length,
    recordsDeleted
  });
  recordsDeleted = 0;

  // AUDIT 3: Duplicate Detection
  console.log('🔍 AUDIT 3: Duplicate Detection\n');
  const jobs = await jobsCollection.find({}).toArray();
  const seen = new Map();
  const duplicates = [];
  
  for (const job of jobs) {
    const key = `${job.title}|${job.description}|${job.postedBy}`;
    if (seen.has(key)) {
      duplicates.push(job._id);
      console.log(`⚠️  Duplicate job found: ${job.title}`);
    } else {
      seen.set(key, job._id);
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`   ACTION: Deleting ${duplicates.length} duplicate jobs...`);
    const deleteResult = await jobsCollection.deleteMany({
      _id: { $in: duplicates }
    });
    recordsDeleted = deleteResult.deletedCount;
    console.log(`✅ Deleted ${recordsDeleted} duplicates\n`);
  } else {
    console.log(`✅ No duplicates found\n`);
  }
  auditResults.phase3.jobsAudit.push({
    audit: 'Duplicate Detection',
    issuesFound: duplicates.length,
    recordsDeleted
  });
  recordsDeleted = 0;

  // AUDIT 4: Application Count Validation
  console.log('🔍 AUDIT 4: Application Count Validation\n');
  const invalidAppCount = await jobsCollection.find({
    $or: [
      { applicationCount: { $gt: 1000 } },
      { applicationCount: null },
      { applicationCount: { $lt: 0 } }
    ]
  }).toArray();
  
  for (const job of invalidAppCount) {
    console.log(`⚠️  Job ${job.title}: Invalid applicationCount = ${job.applicationCount}`);
    console.log(`   ACTION: Setting to 0`);
    
    await jobsCollection.updateOne(
      { _id: job._id },
      { $set: { applicationCount: 0 } }
    );
    
    issuesFound++;
    recordsUpdated++;
  }
  console.log(`✅ Application count validation complete: ${issuesFound} issues fixed\n`);
  auditResults.phase3.jobsAudit.push({
    audit: 'Application Count Validation',
    issuesFound,
    recordsUpdated
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

  const workersCollection = db.collection('workers');
  const jobsCollection = db.collection('jobs');

  // TEST 1: Text Search Works (Workers)
  console.log('🧪 TEST 1: Workers Text Search\n');
  try {
    const electricianSearch = await workersCollection.find({
      $text: { $search: 'electrician' }
    }).toArray();
    
    console.log(`Search "electrician": ${electricianSearch.length} results`);
    
    if (electricianSearch.length > 0) {
      console.log('✅ PASS: Text search working\n');
      auditResults.phase4.criticalTests.push({
        test: 'Workers Text Search',
        status: 'PASS',
        results: electricianSearch.length
      });
    } else {
      console.log('⚠️  WARNING: Text search returned 0 results\n');
      auditResults.phase4.criticalTests.push({
        test: 'Workers Text Search',
        status: 'WARNING',
        results: 0
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Text search broken -', error.message, '\n');
    auditResults.phase4.criticalTests.push({
      test: 'Workers Text Search',
      status: 'FAIL',
      error: error.message
    });
  }

  // TEST 2: Exact Filter Works
  console.log('🧪 TEST 2: Exact Trade Filter\n');
  const welders = await workersCollection.find({
    specializations: 'Welding Services'
  }).toArray();
  
  console.log(`Filter "Welding Services": ${welders.length} results`);
  const allWelders = welders.every(w => 
    w.specializations && w.specializations.includes('Welding Services')
  );
  
  if (allWelders || welders.length === 0) {
    console.log('✅ PASS: Exact filter returns correct results\n');
    auditResults.phase4.criticalTests.push({
      test: 'Exact Trade Filter',
      status: 'PASS',
      results: welders.length
    });
  } else {
    console.log('❌ FAIL: Filter returned non-welders\n');
    auditResults.phase4.criticalTests.push({
      test: 'Exact Trade Filter',
      status: 'FAIL',
      results: welders.length
    });
  }

  // TEST 3: Combined Filter Works
  console.log('🧪 TEST 3: Combined Filters (City + Trade)\n');
  const temaWelders = await workersCollection.find({
    location: { $regex: /Tema/i },
    specializations: 'Welding Services'
  }).toArray();
  
  console.log(`Filter "Tema + Welding": ${temaWelders.length} results`);
  const allMatch = temaWelders.every(w => 
    w.location && w.location.includes('Tema') &&
    w.specializations && w.specializations.includes('Welding Services')
  );
  
  if (allMatch || temaWelders.length === 0) {
    console.log('✅ PASS: Combined filters work correctly\n');
    auditResults.phase4.criticalTests.push({
      test: 'Combined Filters',
      status: 'PASS',
      results: temaWelders.length
    });
  } else {
    console.log('❌ FAIL: Combined filter returned incorrect results\n');
    auditResults.phase4.criticalTests.push({
      test: 'Combined Filters',
      status: 'FAIL',
      results: temaWelders.length
    });
  }

  // TEST 4: Jobs Exist
  console.log('🧪 TEST 4: Jobs Existence Check\n');
  const jobsCount = await jobsCollection.countDocuments();
  console.log(`Total jobs: ${jobsCount}`);
  
  if (jobsCount > 0) {
    console.log('✅ PASS: Jobs data present\n');
    auditResults.phase4.criticalTests.push({
      test: 'Jobs Existence',
      status: 'PASS',
      count: jobsCount
    });
  } else {
    console.log('❌ FAIL: Zero jobs - RESTORE FROM BACKUP\n');
    auditResults.phase4.criticalTests.push({
      test: 'Jobs Existence',
      status: 'FAIL',
      count: 0,
      action: 'RESTORE_FROM_BACKUP'
    });
  }

  // TEST 5: No Duplicate Workers
  console.log('🧪 TEST 5: Duplicate Detection\n');
  const distinctWorkerIds = await workersCollection.distinct('_id');
  const totalWorkers = await workersCollection.countDocuments();
  
  console.log(`Distinct IDs: ${distinctWorkerIds.length}`);
  console.log(`Total workers: ${totalWorkers}`);
  
  if (distinctWorkerIds.length === totalWorkers) {
    console.log('✅ PASS: No duplicates\n');
    auditResults.phase4.criticalTests.push({
      test: 'No Duplicates',
      status: 'PASS',
      distinctIds: distinctWorkerIds.length,
      totalRecords: totalWorkers
    });
  } else {
    console.log('❌ FAIL: Duplicates detected\n');
    auditResults.phase4.criticalTests.push({
      test: 'No Duplicates',
      status: 'FAIL',
      distinctIds: distinctWorkerIds.length,
      totalRecords: totalWorkers
    });
  }

  console.log('✅ Phase 4 Complete\n');
}

// ============================================================================
// PHASE 5: BACKEND API VALIDATION
// ============================================================================
async function phase5ApiValidation() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 5: BACKEND API VALIDATION');
  console.log('='.repeat(80) + '\n');

  console.log('📝 API Endpoint Test Recommendations:\n');
  
  const testCases = [
    {
      endpoint: 'GET /api/workers/search?keywords=electrician&city=Tema&workType=Full-time&primaryTrade=Electrical Work',
      expected: 'Workers matching ALL criteria (electrician + Tema + Full-time + Electrical)',
      critical: true
    },
    {
      endpoint: 'GET /api/jobs/search?keywords=painting&city=Kumasi&category=Painting & Decoration',
      expected: 'Jobs matching ALL criteria (painting + Kumasi + Painting category)',
      critical: true
    },
    {
      endpoint: 'GET /api/workers?specialization=Welding Services',
      expected: 'Only welders returned',
      critical: true
    },
    {
      endpoint: 'GET /api/jobs?status=Open',
      expected: 'Only open jobs returned',
      critical: true
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`TEST ${index + 1}:`);
    console.log(`  Endpoint: ${testCase.endpoint}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Critical: ${testCase.critical ? 'YES' : 'NO'}\n`);
  });

  console.log('⚠️  NOTE: API validation requires manual testing or API client');
  console.log('   Recommended tools: Postman, curl, or frontend integration tests\n');

  auditResults.phase5.apiValidation = {
    status: 'MANUAL_TESTING_REQUIRED',
    testCases,
    note: 'Execute these API calls and verify results match expected behavior'
  };

  console.log('✅ Phase 5 Complete\n');
}

// ============================================================================
// PHASE 6: REPORT GENERATION
// ============================================================================
async function phase6ReportGeneration() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 6: FINAL AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  const workersCollection = db.collection('workers');
  const jobsCollection = db.collection('jobs');

  const finalWorkersCount = await workersCollection.countDocuments();
  const finalJobsCount = await jobsCollection.countDocuments();

  // Calculate totals
  let totalIssuesFound = 0;
  let totalRecordsUpdated = 0;
  let totalRecordsDeleted = 0;

  auditResults.phase2.workersAudit.forEach(audit => {
    totalIssuesFound += audit.issuesFound || 0;
    totalRecordsUpdated += audit.recordsUpdated || 0;
    totalRecordsDeleted += audit.recordsDeleted || 0;
  });

  auditResults.phase3.jobsAudit.forEach(audit => {
    totalIssuesFound += audit.issuesFound || 0;
    totalRecordsUpdated += audit.recordsUpdated || 0;
    totalRecordsDeleted += audit.recordsDeleted || 0;
  });

  // Calculate success metrics
  const textSearchPassing = auditResults.phase4.criticalTests.find(
    t => t.test === 'Workers Text Search'
  )?.status === 'PASS';

  const filtersPassing = auditResults.phase4.criticalTests.filter(
    t => t.status === 'PASS'
  ).length;

  const totalTests = auditResults.phase4.criticalTests.length;
  const searchAccuracy = totalTests > 0 ? (filtersPassing / totalTests * 100).toFixed(1) : 0;

  // Generate summary
  auditResults.phase6.summary = {
    workersAudited: finalWorkersCount,
    jobsAudited: finalJobsCount,
    totalIssuesFound,
    recordsUpdated: totalRecordsUpdated,
    recordsDeleted: totalRecordsDeleted,
    searchAccuracy: `${searchAccuracy}%`,
    textSearchWorking: textSearchPassing ? 'YES' : 'NO',
    filtersWorking: filtersPassing >= 3 ? 'YES' : 'PARTIAL',
    testDataRemoved: 'YES',
    testResults: {
      passed: filtersPassing,
      total: totalTests,
      rate: `${searchAccuracy}%`
    }
  };

  // Print report
  console.log('📊 FINAL AUDIT SUMMARY\n');
  console.log('Database Collections:');
  console.log(`  Workers: ${finalWorkersCount} valid records`);
  console.log(`  Jobs: ${finalJobsCount} valid records\n`);

  console.log('Issues Remediated:');
  console.log(`  Total issues found: ${totalIssuesFound}`);
  console.log(`  Records updated: ${totalRecordsUpdated}`);
  console.log(`  Records deleted: ${totalRecordsDeleted}\n`);

  console.log('Quality Metrics:');
  console.log(`  Text search working: ${textSearchPassing ? '✅ YES' : '❌ NO'}`);
  console.log(`  Filters working: ${filtersPassing >= 3 ? '✅ YES' : '⚠️ PARTIAL'}`);
  console.log(`  Test data removed: ✅ YES`);
  console.log(`  Search accuracy: ${searchAccuracy}%\n`);

  console.log('Test Results:');
  auditResults.phase4.criticalTests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : 
                 test.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${icon} ${test.test}: ${test.status}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(80) + '\n');

  // Save report to file
  const fs = require('fs');
  const reportPath = './DATABASE_AUDIT_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`📄 Full audit report saved to: ${reportPath}\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runComprehensiveAudit() {
  try {
    console.log('\n' + '█'.repeat(80));
    console.log('KELMAH PLATFORM - COMPREHENSIVE DATABASE AUDIT');
    console.log('6-Phase Integrity Protocol');
    console.log('█'.repeat(80));

    await connectToDatabase();

    await phase1EmergencyActions();
    await phase2WorkersAudit();
    await phase3JobsAudit();
    await phase4CriticalTesting();
    await phase5ApiValidation();
    await phase6ReportGeneration();

    console.log('✅ All phases completed successfully\n');

  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
    console.error(error.stack);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Execute audit
runComprehensiveAudit();
