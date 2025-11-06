/**
 * COMPREHENSIVE DATABASE VALIDATION TESTS
 * Kelmah Platform - Post-Audit Verification
 * 
 * Validates all 7 phases of the audit process
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

const APPROVED_TRADES = [
  "Electrical Work",
  "Plumbing Services",
  "Carpentry & Woodwork",
  "Painting & Decoration",
  "Masonry & Stonework",
  "Roofing Services",
  "HVAC & Climate Control",
  "Landscaping",
  "Construction & Building",
  "Welding Services",
  "Tiling & Flooring",
  "General Maintenance"
];

const APPROVED_WORK_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Daily Work",
  "Project-based"
];

const APPROVED_JOB_STATUSES = [
  "open",
  "Open",
  "OPEN",
  "in-progress",
  "In Progress",
  "IN-PROGRESS",
  "closed",
  "Closed",
  "CLOSED",
  "completed",
  "Completed",
  "COMPLETED"
];

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function logPass(test, details) {
  console.log(`✅ PASS: ${test}`);
  if (details) console.log(`   ${details}`);
  testResults.passed.push({ test, details });
}

function logFail(test, details) {
  console.log(`❌ FAIL: ${test}`);
  if (details) console.log(`   ${details}`);
  testResults.failed.push({ test, details });
}

function logWarning(test, details) {
  console.log(`⚠️ WARNING: ${test}`);
  if (details) console.log(`   ${details}`);
  testResults.warnings.push({ test, details });
}

async function runComprehensiveValidation() {
  console.log('================================================================================');
  console.log('🔍 COMPREHENSIVE DATABASE VALIDATION TESTS');
  console.log('Kelmah Jobs & Talents Marketplace - Post-Audit Verification');
  console.log('================================================================================\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;
    const workersCol = db.collection('users');
    const jobsCol = db.collection('jobs');

    // Get current counts
    const workerCount = await workersCol.countDocuments({ role: 'worker' });
    const jobCount = await jobsCol.countDocuments();

    console.log('📊 Current Database State:');
    console.log(`   Workers: ${workerCount}`);
    console.log(`   Jobs: ${jobCount}\n`);

    console.log('================================================================================');
    console.log('PHASE 1: TEXT INDEX VALIDATION');
    console.log('================================================================================\n');

    // Check indexes exist
    const workersIndexes = await workersCol.indexes();
    const jobsIndexes = await jobsCol.indexes();

    const hasWorkersText = workersIndexes.some(idx => idx.name && idx.name.includes('text'));
    const hasJobsText = jobsIndexes.some(idx => idx.name && idx.name.includes('text'));

    if (hasWorkersText) {
      logPass('Workers text index exists', `Index: ${workersIndexes.find(i => i.name.includes('text')).name}`);
    } else {
      logFail('Workers text index missing', 'Text search will not work');
    }

    if (hasJobsText) {
      logPass('Jobs text index exists', `Index: ${jobsIndexes.find(i => i.name.includes('text')).name}`);
    } else {
      logFail('Jobs text index missing', 'Text search will not work');
    }

    // Test 1: Text Search - Plumbing
    console.log('\n🧪 Test 1: Text Search - "plumbing"');
    const plumbingWorkers = await workersCol.countDocuments({
      role: 'worker',
      $text: { $search: "plumbing" }
    });
    const plumbingJobs = await jobsCol.countDocuments({
      $text: { $search: "plumbing" }
    });

    if (plumbingWorkers > 0) {
      logPass('Text search finds plumbing workers', `Found ${plumbingWorkers} workers`);
    } else {
      logWarning('Text search found no plumbing workers', 'May be no plumbing workers in database');
    }

    if (plumbingJobs > 0) {
      logPass('Text search finds plumbing jobs', `Found ${plumbingJobs} jobs`);
    } else {
      logWarning('Text search found no plumbing jobs', 'May be no plumbing jobs in database');
    }

    // Test 2: Text Search - Painting
    console.log('\n🧪 Test 2: Text Search - "painting"');
    const paintingWorkers = await workersCol.countDocuments({
      role: 'worker',
      $text: { $search: "painting" }
    });
    const paintingJobs = await jobsCol.countDocuments({
      $text: { $search: "painting" }
    });

    if (paintingWorkers > 0) {
      logPass('Text search finds painting workers', `Found ${paintingWorkers} workers`);
    } else {
      logWarning('Text search found no painting workers', 'May be no painting workers in database');
    }

    if (paintingJobs > 0) {
      logPass('Text search finds painting jobs', `Found ${paintingJobs} jobs`);
    } else {
      logWarning('Text search found no painting jobs', 'May be no painting jobs in database');
    }

    // Test 3: Text Search - Welding
    console.log('\n🧪 Test 3: Text Search - "welding"');
    const weldingWorkers = await workersCol.countDocuments({
      role: 'worker',
      $text: { $search: "welding" }
    });
    const weldingJobs = await jobsCol.countDocuments({
      $text: { $search: "welding" }
    });

    if (weldingWorkers > 0 || weldingJobs > 0) {
      logPass('Text search finds welding results', `Workers: ${weldingWorkers}, Jobs: ${weldingJobs}`);
    } else {
      logWarning('Text search found no welding results', 'May be no welding work in database');
    }

    console.log('\n================================================================================');
    console.log('PHASE 2: WORKERS COLLECTION VALIDATION');
    console.log('================================================================================\n');

    // Get all workers for validation
    const workers = await workersCol.find({ role: 'worker' }).toArray();

    // Test: Primary Trade Mismatches
    console.log('🧪 Test 4: Primary Trade Alignment');
    let tradeMismatches = 0;
    for (const worker of workers) {
      const primaryTrade = worker.primaryTrade || worker.workerProfile?.primaryTrade;
      const specializations = worker.specializations || worker.workerProfile?.specializations || [];
      
      if (primaryTrade && specializations.length > 0) {
        if (!specializations.includes(primaryTrade)) {
          tradeMismatches++;
        }
      }
    }

    if (tradeMismatches === 0) {
      logPass('All workers have aligned primary trade', `0 mismatches out of ${workers.length} workers`);
    } else {
      logFail('Workers have trade mismatches', `${tradeMismatches} workers need primary trade alignment`);
    }

    // Test: Invalid Work Types
    console.log('\n🧪 Test 5: Work Type Validation');
    let invalidWorkTypes = 0;
    for (const worker of workers) {
      const workType = worker.workerProfile?.workType;
      if (workType && !APPROVED_WORK_TYPES.includes(workType)) {
        invalidWorkTypes++;
      }
    }

    if (invalidWorkTypes === 0) {
      logPass('All workers have valid work types', `All ${workers.length} workers validated`);
    } else {
      logFail('Workers have invalid work types', `${invalidWorkTypes} workers need work type correction`);
    }

    // Test: Missing Location Data
    console.log('\n🧪 Test 6: Location Data Completeness');
    let missingLocation = 0;
    for (const worker of workers) {
      const city = worker.city || worker.location?.city;
      const region = worker.region || worker.location?.region;
      
      if (!city || !region) {
        missingLocation++;
      }
    }

    if (missingLocation === 0) {
      logPass('All workers have complete location data', `All ${workers.length} workers have city and region`);
    } else {
      logFail('Workers missing location data', `${missingLocation} workers need location information`);
    }

    // Test: Rating Integrity
    console.log('\n🧪 Test 7: Rating Integrity');
    let invalidRatings = 0;
    for (const worker of workers) {
      const rating = worker.rating || worker.workerProfile?.rating || 0;
      const totalReviews = worker.totalReviews || worker.workerProfile?.totalReviews || 0;
      
      if (rating < 0 || rating > 5) {
        invalidRatings++;
      }
      if (totalReviews < 0) {
        invalidRatings++;
      }
    }

    if (invalidRatings === 0) {
      logPass('All worker ratings are valid', `All ratings within 0-5 range, no negative reviews`);
    } else {
      logFail('Workers have invalid ratings', `${invalidRatings} issues found`);
    }

    // Test: Test Data Detection
    console.log('\n🧪 Test 8: Test Data Detection');
    const testPatterns = {
      names: /test|demo|sample|placeholder|dummy|fake|example/i,
      emails: /@test\.|@demo\.|@example\.|@fake\./i
    };

    let testDataFound = 0;
    for (const worker of workers) {
      const fullName = `${worker.firstName || ''} ${worker.lastName || ''}`.trim();
      const email = worker.email || '';
      
      if (testPatterns.names.test(fullName) || testPatterns.emails.test(email)) {
        testDataFound++;
        console.log(`   ⚠️ Possible test data: ${fullName} (${email})`);
      }
    }

    if (testDataFound === 0) {
      logPass('No test data detected in workers', 'Production database clean');
    } else {
      logFail('Test data found in workers collection', `${testDataFound} workers flagged`);
    }

    // Test: Trade Standardization
    console.log('\n🧪 Test 9: Trade Category Standardization');
    let nonStandardTrades = 0;
    for (const worker of workers) {
      const specializations = worker.specializations || worker.workerProfile?.specializations || [];
      
      for (const spec of specializations) {
        if (!APPROVED_TRADES.includes(spec)) {
          nonStandardTrades++;
          console.log(`   ⚠️ Non-standard trade: "${spec}" for worker ${worker._id}`);
          break; // Only count once per worker
        }
      }
    }

    if (nonStandardTrades === 0) {
      logPass('All workers use standardized trades', `All trades match approved list`);
    } else {
      logFail('Workers have non-standard trades', `${nonStandardTrades} workers need trade standardization`);
    }

    console.log('\n================================================================================');
    console.log('PHASE 3: JOBS COLLECTION VALIDATION');
    console.log('================================================================================\n');

    // Get all jobs for validation
    const jobs = await jobsCol.find().toArray();

    // Test: Empty Title/Description
    console.log('🧪 Test 10: Title and Description Completeness');
    let emptyFields = 0;
    for (const job of jobs) {
      if (!job.title || job.title.trim() === '' || !job.description || job.description.trim() === '') {
        emptyFields++;
      }
    }

    if (emptyFields === 0) {
      logPass('All jobs have title and description', `All ${jobs.length} jobs validated`);
    } else {
      logFail('Jobs missing title or description', `${emptyFields} jobs need content`);
    }

    // Test: Invalid Budget
    console.log('\n🧪 Test 11: Budget Validation');
    let invalidBudgets = 0;
    for (const job of jobs) {
      const budget = job.budget || job.pricing?.budget || 0;
      
      if (budget <= 0 || budget > 100000) {
        invalidBudgets++;
      }
    }

    if (invalidBudgets === 0) {
      logPass('All job budgets are valid', `All budgets > 0 and < 100,000 GHS`);
    } else {
      logFail('Jobs have invalid budgets', `${invalidBudgets} jobs need budget correction`);
    }

    // Test: Status Validation
    console.log('\n🧪 Test 12: Job Status Validation');
    let invalidStatuses = 0;
    for (const job of jobs) {
      const status = job.status || '';
      
      if (!APPROVED_JOB_STATUSES.includes(status)) {
        invalidStatuses++;
        console.log(`   ⚠️ Invalid status: "${status}" for job ${job._id}`);
      }
    }

    if (invalidStatuses === 0) {
      logPass('All job statuses are valid', `All statuses in approved list`);
    } else {
      logFail('Jobs have invalid statuses', `${invalidStatuses} jobs need status correction`);
    }

    // Test: Duplicate Jobs Detection
    console.log('\n🧪 Test 13: Duplicate Job Detection');
    const jobGroups = await jobsCol.aggregate([
      {
        $group: {
          _id: { title: '$title', hirer: '$hirer' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (jobGroups.length === 0) {
      logPass('No duplicate jobs found', 'All jobs are unique');
    } else {
      logFail('Duplicate jobs detected', `${jobGroups.length} duplicate groups found`);
      jobGroups.forEach(group => {
        console.log(`   ⚠️ Duplicate: "${group._id.title}" posted ${group.count} times`);
      });
    }

    // Test: Application Count Validation
    console.log('\n🧪 Test 14: Application Count Validation');
    let unrealisticCounts = 0;
    for (const job of jobs) {
      const appCount = job.applicationCount || 0;
      
      if (appCount > 1000) {
        unrealisticCounts++;
      }
    }

    if (unrealisticCounts === 0) {
      logPass('All application counts are realistic', `All counts < 1000`);
    } else {
      logFail('Jobs have unrealistic application counts', `${unrealisticCounts} jobs need investigation`);
    }

    // Test: Trade Standardization in Jobs
    console.log('\n🧪 Test 15: Job Trade Standardization');
    let nonStandardJobTrades = 0;
    for (const job of jobs) {
      const category = job.category || job.requirements?.primaryTrade || '';
      
      if (category && !APPROVED_TRADES.includes(category)) {
        nonStandardJobTrades++;
        console.log(`   ⚠️ Non-standard trade: "${category}" for job ${job._id}`);
      }
    }

    if (nonStandardJobTrades === 0) {
      logPass('All jobs use standardized trades', `All trades match approved list`);
    } else {
      logFail('Jobs have non-standard trades', `${nonStandardJobTrades} jobs need trade standardization`);
    }

    console.log('\n================================================================================');
    console.log('PHASE 4: CROSS-COLLECTION VALIDATION');
    console.log('================================================================================\n');

    // Test: Broken Job References
    console.log('🧪 Test 16: Job Reference Integrity');
    const allUserIds = new Set((await workersCol.find({}, { projection: { _id: 1 } }).toArray()).map(u => u._id.toString()));
    let brokenRefs = 0;
    
    for (const job of jobs) {
      const hirerId = job.hirer || job.postedBy;
      if (hirerId && !allUserIds.has(hirerId.toString())) {
        brokenRefs++;
      }
    }

    if (brokenRefs === 0) {
      logPass('All job references are valid', 'No orphaned jobs');
    } else {
      logFail('Jobs have broken references', `${brokenRefs} jobs reference non-existent users`);
    }

    console.log('\n================================================================================');
    console.log('PHASE 5: COMPREHENSIVE FUNCTIONAL TESTS');
    console.log('================================================================================\n');

    // Test: Combined Filters
    console.log('🧪 Test 17: Combined Search Filters');
    
    // Get a sample worker to test with
    const sampleWorker = workers[0];
    if (sampleWorker) {
      const city = sampleWorker.city || sampleWorker.location?.city;
      const trade = sampleWorker.primaryTrade || sampleWorker.workerProfile?.primaryTrade;
      
      if (city && trade) {
        const combinedResults = await workersCol.countDocuments({
          role: 'worker',
          $or: [
            { city: city },
            { 'location.city': city }
          ],
          $or: [
            { primaryTrade: trade },
            { 'workerProfile.primaryTrade': trade }
          ]
        });
        
        if (combinedResults > 0) {
          logPass('Combined filters work correctly', `Found ${combinedResults} workers in ${city} with ${trade}`);
        } else {
          logWarning('Combined filters returned no results', 'Query structure may need adjustment');
        }
      }
    }

    // Test: Sort Functionality
    console.log('\n🧪 Test 18: Sort by Rating');
    const topWorkers = await workersCol.find({ role: 'worker' })
      .sort({ rating: -1, totalReviews: -1 })
      .limit(5)
      .toArray();

    if (topWorkers.length > 0) {
      const ratings = topWorkers.map(w => w.rating || 0);
      const isSorted = ratings.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
      
      if (isSorted) {
        logPass('Sort by rating works correctly', `Top rating: ${ratings[0]}`);
      } else {
        logFail('Sort by rating not working', 'Results not in descending order');
      }
    }

    // Test: Pagination
    console.log('\n🧪 Test 19: Pagination Functionality');
    const page1 = await workersCol.find({ role: 'worker' }).limit(5).toArray();
    const page2 = await workersCol.find({ role: 'worker' }).skip(5).limit(5).toArray();
    
    if (page1.length > 0 && page2.length > 0) {
      const page1Ids = page1.map(w => w._id.toString());
      const page2Ids = page2.map(w => w._id.toString());
      const overlap = page1Ids.some(id => page2Ids.includes(id));
      
      if (!overlap) {
        logPass('Pagination works correctly', 'No overlap between pages');
      } else {
        logFail('Pagination has overlap', 'Same workers appearing on multiple pages');
      }
    }

    console.log('\n================================================================================');
    console.log('PHASE 6: FINAL VALIDATION SUMMARY');
    console.log('================================================================================\n');

    // Calculate success rate
    const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
    const passRate = ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(1);

    console.log('📊 TEST RESULTS SUMMARY:\n');
    console.log(`   ✅ Passed: ${testResults.passed.length}`);
    console.log(`   ❌ Failed: ${testResults.failed.length}`);
    console.log(`   ⚠️ Warnings: ${testResults.warnings.length}`);
    console.log(`   📈 Pass Rate: ${passRate}%\n`);

    if (testResults.failed.length > 0) {
      console.log('❌ FAILED TESTS:');
      testResults.failed.forEach(({ test, details }) => {
        console.log(`   - ${test}`);
        if (details) console.log(`     ${details}`);
      });
      console.log('');
    }

    if (testResults.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      testResults.warnings.forEach(({ test, details }) => {
        console.log(`   - ${test}`);
        if (details) console.log(`     ${details}`);
      });
      console.log('');
    }

    // Overall assessment
    console.log('================================================================================');
    if (testResults.failed.length === 0) {
      console.log('✅ DATABASE VALIDATION COMPLETE - ALL TESTS PASSED');
    } else if (passRate >= 90) {
      console.log('✅ DATABASE VALIDATION COMPLETE - EXCELLENT (Minor issues found)');
    } else if (passRate >= 75) {
      console.log('⚠️ DATABASE VALIDATION COMPLETE - GOOD (Some issues need attention)');
    } else {
      console.log('❌ DATABASE VALIDATION COMPLETE - NEEDS IMPROVEMENT');
    }
    console.log('================================================================================\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('Connection closed.');

    process.exit(testResults.failed.length === 0 ? 0 : 1);

  } catch (error) {
    console.error('❌ Error during validation:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run validation
runComprehensiveValidation();
