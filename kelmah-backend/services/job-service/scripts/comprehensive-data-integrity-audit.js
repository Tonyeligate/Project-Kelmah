/**
 * COMPREHENSIVE DATA INTEGRITY AUDIT & REPAIR SCRIPT
 * Kelmah Jobs & Talents Marketplace Database
 * 
 * Purpose: Audit and repair data inconsistencies affecting search, filter, and sort functionality
 * 
 * Priority Checks:
 * 1. Text search field indexing
 * 2. Trade category mismatch (workers)
 * 3. Work type validation
 * 4. Job title/description null check
 * 5. Location completeness
 * 6. Budget validation (jobs)
 * 7. Rating integrity
 * 8. Duplicate detection
 * 9. Test/dummy data removal
 * 10. Active status check
 * 11. Search query validation
 * 12. Specialization standardization
 */

require('dotenv').config({ path: '../../../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Standardized specializations list
const APPROVED_SPECIALIZATIONS = [
  "Plumbing", "Electrical Work", "Carpentry", "Painting", "Masonry", 
  "Roofing", "HVAC", "Landscaping", "Construction", "Welding", 
  "Tiling", "General Maintenance"
];

// Mapping for typos and variations
const SPECIALIZATION_MAPPING = {
  "plumber": "Plumbing",
  "plumbing services": "Plumbing",
  "electrician": "Electrical Work",
  "electrical": "Electrical Work",
  "carpenter": "Carpentry",
  "woodwork": "Carpentry",
  "painter": "Painting",
  "mason": "Masonry",
  "bricklayer": "Masonry",
  "roofer": "Roofing",
  "hvac technician": "HVAC",
  "landscaper": "Landscaping",
  "gardener": "Landscaping",
  "welder": "Welding",
  "tiler": "Tiling",
  "general labor": "General Maintenance"
};

// Approved work types
const APPROVED_WORK_TYPES = ["Full-time", "Part-time", "Contract", "Daily Work", "Project-based"];

// Approved Ghana cities
const APPROVED_GHANA_CITIES = [
  "Accra", "Kumasi", "Tema", "Takoradi", "Cape Coast", 
  "Tamale", "Ho", "Koforidua", "Sunyani", "Wa"
];

// Results tracking
const auditResults = {
  timestamp: new Date().toISOString(),
  issues: {},
  fixes: {},
  validationTests: {},
  summary: {}
};

// Helper to log and track issues
function logIssue(category, issue, recordId = null) {
  if (!auditResults.issues[category]) {
    auditResults.issues[category] = [];
  }
  auditResults.issues[category].push({ issue, recordId, timestamp: new Date().toISOString() });
  console.log(`   ❌ [${category}] ${issue}${recordId ? ` (ID: ${recordId})` : ''}`);
}

// Helper to log and track fixes
function logFix(category, fix, recordId = null) {
  if (!auditResults.fixes[category]) {
    auditResults.fixes[category] = [];
  }
  auditResults.fixes[category].push({ fix, recordId, timestamp: new Date().toISOString() });
  console.log(`   ✅ [${category}] ${fix}${recordId ? ` (ID: ${recordId})` : ''}`);
}

async function comprehensiveDataIntegrityAudit() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPREHENSIVE DATA INTEGRITY AUDIT & REPAIR');
    console.log('Kelmah Jobs & Talents Marketplace Database');
    console.log('='.repeat(80) + '\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;
    const workersCol = db.collection('users'); // Workers are in users collection
    const jobsCol = db.collection('jobs');

    // Get initial counts
    const totalWorkers = await workersCol.countDocuments({ role: 'worker' });
    const totalJobs = await jobsCol.countDocuments({});
    console.log(`📊 Database Overview:`);
    console.log(`   Total Workers: ${totalWorkers}`);
    console.log(`   Total Jobs: ${totalJobs}\n`);

    // ========================================================================
    // PRIORITY CHECK 1: TEXT SEARCH FIELD INDEXING
    // ========================================================================
    console.log('='.repeat(80));
    console.log('1️⃣  TEXT SEARCH FIELD INDEXING');
    console.log('='.repeat(80) + '\n');

    try {
      // Check existing indexes
      const workersIndexes = await workersCol.indexes();
      const jobsIndexes = await jobsCol.indexes();

      console.log('📋 Existing Indexes:');
      console.log(`   Workers: ${workersIndexes.map(i => i.name).join(', ')}`);
      console.log(`   Jobs: ${jobsIndexes.map(i => i.name).join(', ')}\n`);

      // Check if text indexes exist
      const hasWorkersTextIndex = workersIndexes.some(i => i.name.includes('text'));
      const hasJobsTextIndex = jobsIndexes.some(i => i.name.includes('text'));

      if (!hasWorkersTextIndex) {
        console.log('⚠️  Workers collection missing text index. Creating...');
        await workersCol.createIndex({
          firstName: "text",
          lastName: "text",
          "workerProfile.title": "text",
          specializations: "text",
          skills: "text",
          bio: "text"
        }, { name: "worker_text_search" });
        logFix('TEXT_INDEX', 'Created text index on workers collection');
      } else {
        console.log('✅ Workers text index exists');
      }

      if (!hasJobsTextIndex) {
        console.log('⚠️  Jobs collection missing text index. Creating...');
        await jobsCol.createIndex({
          title: "text",
          description: "text",
          requiredSkills: "text",
          category: "text"
        }, { name: "job_text_search" });
        logFix('TEXT_INDEX', 'Created text index on jobs collection');
      } else {
        console.log('✅ Jobs text index exists');
      }

      // Test text search
      console.log('\n🧪 Testing Text Search:');
      const plumbingWorkers = await workersCol.countDocuments({ 
        role: 'worker',
        $text: { $search: "plumbing" } 
      });
      console.log(`   Workers with "plumbing": ${plumbingWorkers}`);

      const plumbingJobs = await jobsCol.countDocuments({ 
        $text: { $search: "plumbing" } 
      });
      console.log(`   Jobs with "plumbing": ${plumbingJobs}`);

      auditResults.validationTests.textSearch = {
        workersTextIndex: hasWorkersTextIndex,
        jobsTextIndex: hasJobsTextIndex,
        plumbingWorkersFound: plumbingWorkers,
        plumbingJobsFound: plumbingJobs
      };

    } catch (error) {
      logIssue('TEXT_INDEX', `Error managing indexes: ${error.message}`);
    }

    // ========================================================================
    // PRIORITY CHECK 2: TRADE CATEGORY MISMATCH (WORKERS)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('2️⃣  TRADE CATEGORY MISMATCH (WORKERS)');
    console.log('='.repeat(80) + '\n');

    const workers = await workersCol.find({ role: 'worker' }).toArray();
    let tradeMismatchCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const primaryTrade = worker.workerProfile?.title || worker.profession || worker.primaryTrade;
      const specializations = worker.specializations || [];

      if (primaryTrade && specializations.length > 0) {
        // Check if primaryTrade is in specializations
        if (!specializations.includes(primaryTrade)) {
          logIssue('TRADE_MISMATCH', 
            `Primary trade "${primaryTrade}" not in specializations [${specializations.join(', ')}]`, 
            workerId);
          
          // FIX: Set primaryTrade to first specialization
          const newPrimaryTrade = specializations[0];
          await workersCol.updateOne(
            { _id: workerId },
            { $set: { 'workerProfile.title': newPrimaryTrade } }
          );
          logFix('TRADE_MISMATCH', 
            `Updated primaryTrade from "${primaryTrade}" to "${newPrimaryTrade}"`, 
            workerId);
          tradeMismatchCount++;
        }
      }
    }

    console.log(`\n📊 Trade Mismatch Summary: ${tradeMismatchCount} mismatches found and corrected\n`);

    // ========================================================================
    // PRIORITY CHECK 3: WORK TYPE VALIDATION
    // ========================================================================
    console.log('='.repeat(80));
    console.log('3️⃣  WORK TYPE VALIDATION');
    console.log('='.repeat(80) + '\n');

    let invalidWorkTypeCount = 0;
    let nullWorkTypeCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const workType = worker.workerProfile?.workType;

      if (!workType || workType === null || workType === undefined) {
        logIssue('WORK_TYPE', 'Work type is null/undefined', workerId);
        
        // FIX: Set to Full-time (most common)
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { 'workerProfile.workType': 'Full-time' } }
        );
        logFix('WORK_TYPE', 'Set work type to "Full-time"', workerId);
        nullWorkTypeCount++;
      } else if (!APPROVED_WORK_TYPES.includes(workType)) {
        logIssue('WORK_TYPE', `Invalid work type: "${workType}"`, workerId);
        
        // FIX: Set to Full-time
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { 'workerProfile.workType': 'Full-time' } }
        );
        logFix('WORK_TYPE', `Changed invalid work type "${workType}" to "Full-time"`, workerId);
        invalidWorkTypeCount++;
      }
    }

    console.log(`\n📊 Work Type Summary: ${nullWorkTypeCount} null, ${invalidWorkTypeCount} invalid (all fixed)\n`);

    // ========================================================================
    // PRIORITY CHECK 4: JOB TITLE/DESCRIPTION NULL CHECK
    // ========================================================================
    console.log('='.repeat(80));
    console.log('4️⃣  JOB TITLE/DESCRIPTION NULL CHECK');
    console.log('='.repeat(80) + '\n');

    const jobs = await jobsCol.find({}).toArray();
    let jobsWithNullTitle = 0;
    let jobsWithNullDescription = 0;
    let jobsWithShortDescription = 0;

    for (const job of jobs) {
      const jobId = job._id;
      let shouldDelete = false;

      if (!job.title || job.title === '' || job.title === null) {
        logIssue('JOB_TITLE', 'Job has null/empty title', jobId);
        shouldDelete = true;
        jobsWithNullTitle++;
      }

      if (!job.description || job.description === '' || job.description === null) {
        logIssue('JOB_DESCRIPTION', 'Job has null/empty description', jobId);
        shouldDelete = true;
        jobsWithNullDescription++;
      } else if (job.description.length < 20) {
        logIssue('JOB_DESCRIPTION', `Job has short description (${job.description.length} chars)`, jobId);
        jobsWithShortDescription++;
      }

      if (shouldDelete) {
        // SAFETY: Don't auto-delete in this script, just flag
        logIssue('JOB_DELETE', 'Job flagged for deletion (incomplete)', jobId);
      }
    }

    console.log(`\n📊 Job Validation Summary:`);
    console.log(`   Null titles: ${jobsWithNullTitle}`);
    console.log(`   Null descriptions: ${jobsWithNullDescription}`);
    console.log(`   Short descriptions: ${jobsWithShortDescription}\n`);

    // ========================================================================
    // PRIORITY CHECK 5: LOCATION COMPLETENESS
    // ========================================================================
    console.log('='.repeat(80));
    console.log('5️⃣  LOCATION COMPLETENESS');
    console.log('='.repeat(80) + '\n');

    let workersMissingLocation = 0;
    let workersInvalidLocation = 0;
    let jobsMissingLocation = 0;
    let jobsInvalidLocation = 0;

    // Check workers
    for (const worker of workers) {
      const workerId = worker._id;
      const location = worker.location || worker.city || worker.workerProfile?.location;

      if (!location || location === '') {
        logIssue('LOCATION', 'Worker missing location', workerId);
        workersMissingLocation++;
      } else {
        // Extract city name (handle "City, Region" format)
        const cityName = location.split(',')[0].trim();
        if (!APPROVED_GHANA_CITIES.includes(cityName)) {
          logIssue('LOCATION', `Worker has invalid city: "${location}"`, workerId);
          workersInvalidLocation++;
        }
      }
    }

    // Check jobs
    for (const job of jobs) {
      const jobId = job._id;
      const location = job.location || job.city;

      if (!location || location === '') {
        logIssue('LOCATION', 'Job missing location', jobId);
        jobsMissingLocation++;
      } else {
        // Handle both string and object location formats
        let cityName;
        if (typeof location === 'string') {
          cityName = location.split(',')[0].trim();
        } else if (typeof location === 'object' && location.city) {
          cityName = location.city;
        } else if (typeof location === 'object' && location.name) {
          cityName = location.name.split(',')[0].trim();
        }
        
        if (cityName && !APPROVED_GHANA_CITIES.includes(cityName)) {
          logIssue('LOCATION', `Job has invalid city: "${cityName}"`, jobId);
          jobsInvalidLocation++;
        }
      }
    }

    console.log(`\n📊 Location Summary:`);
    console.log(`   Workers - Missing: ${workersMissingLocation}, Invalid: ${workersInvalidLocation}`);
    console.log(`   Jobs - Missing: ${jobsMissingLocation}, Invalid: ${jobsInvalidLocation}\n`);

    // ========================================================================
    // PRIORITY CHECK 6: BUDGET VALIDATION (JOBS)
    // ========================================================================
    console.log('='.repeat(80));
    console.log('6️⃣  BUDGET VALIDATION (JOBS)');
    console.log('='.repeat(80) + '\n');

    let invalidBudgetCount = 0;
    let invalidBudgetTypeCount = 0;

    for (const job of jobs) {
      const jobId = job._id;
      const budget = job.budget || job.salary;
      const budgetType = job.budgetType || job.paymentType;

      // Check budget value
      if (budget !== undefined && budget !== null) {
        if (budget <= 0 || budget > 100000) {
          logIssue('BUDGET', `Invalid budget amount: ${budget} GHS`, jobId);
          invalidBudgetCount++;
        }
      }

      // Check budget type
      if (budgetType && !['fixed', 'hourly', 'negotiable'].includes(budgetType)) {
        logIssue('BUDGET_TYPE', `Invalid budget type: "${budgetType}"`, jobId);
        
        // FIX: Set to fixed
        await jobsCol.updateOne(
          { _id: jobId },
          { $set: { paymentType: 'fixed' } }
        );
        logFix('BUDGET_TYPE', `Changed budget type from "${budgetType}" to "fixed"`, jobId);
        invalidBudgetTypeCount++;
      }
    }

    console.log(`\n📊 Budget Summary:`);
    console.log(`   Invalid amounts: ${invalidBudgetCount}`);
    console.log(`   Invalid types: ${invalidBudgetTypeCount} (fixed)\n`);

    // ========================================================================
    // PRIORITY CHECK 7: RATING INTEGRITY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('7️⃣  RATING INTEGRITY');
    console.log('='.repeat(80) + '\n');

    let invalidRatingCount = 0;
    let negativeReviewCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const rating = worker.rating || worker.averageRating;
      const totalReviews = worker.totalReviews || 0;

      // Check rating range
      if (rating !== undefined && rating !== null) {
        if (rating < 0 || rating > 5) {
          logIssue('RATING', `Invalid rating: ${rating}`, workerId);
          
          // FIX: Set to 0
          await workersCol.updateOne(
            { _id: workerId },
            { $set: { rating: 0, averageRating: 0 } }
          );
          logFix('RATING', `Reset invalid rating ${rating} to 0`, workerId);
          invalidRatingCount++;
        }
      }

      // Check negative review count
      if (totalReviews < 0) {
        logIssue('REVIEWS', `Negative review count: ${totalReviews}`, workerId);
        
        // FIX: Set to 0
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { totalReviews: 0 } }
        );
        logFix('REVIEWS', 'Reset negative review count to 0', workerId);
        negativeReviewCount++;
      }
    }

    console.log(`\n📊 Rating Summary:`);
    console.log(`   Invalid ratings: ${invalidRatingCount} (fixed)`);
    console.log(`   Negative review counts: ${negativeReviewCount} (fixed)\n`);

    // ========================================================================
    // PRIORITY CHECK 8: DUPLICATE DETECTION
    // ========================================================================
    console.log('='.repeat(80));
    console.log('8️⃣  DUPLICATE DETECTION');
    console.log('='.repeat(80) + '\n');

    // Find duplicate emails in workers
    const emailAggregation = await workersCol.aggregate([
      { $match: { role: 'worker', email: { $exists: true, $ne: null } } },
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log(`🔍 Found ${emailAggregation.length} duplicate email addresses\n`);
    for (const dup of emailAggregation) {
      logIssue('DUPLICATE', 
        `Email "${dup._id}" used by ${dup.count} workers: ${dup.ids.join(', ')}`);
    }

    // Find duplicate jobs (same title + hirer)
    const jobDuplicates = await jobsCol.aggregate([
      { $group: { 
          _id: { title: '$title', hirer: '$hirer' }, 
          count: { $sum: 1 }, 
          ids: { $push: '$_id' } 
        } 
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log(`\n🔍 Found ${jobDuplicates.length} potential duplicate jobs\n`);
    for (const dup of jobDuplicates) {
      logIssue('DUPLICATE_JOB', 
        `Job "${dup._id.title}" posted multiple times by same hirer: ${dup.ids.join(', ')}`);
    }

    // ========================================================================
    // PRIORITY CHECK 9: TEST/DUMMY DATA REMOVAL
    // ========================================================================
    console.log('='.repeat(80));
    console.log('9️⃣  TEST/DUMMY DATA REMOVAL');
    console.log('='.repeat(80) + '\n');

    // Find test workers
    const testPatterns = [
      /test/i, /demo/i, /sample/i, /placeholder/i, /dummy/i, /fake/i
    ];

    let testWorkersCount = 0;
    let testJobsCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const fullName = `${worker.firstName || ''} ${worker.lastName || ''}`.toLowerCase();
      const email = (worker.email || '').toLowerCase();

      // Check name
      const hasTestName = testPatterns.some(pattern => pattern.test(fullName));
      
      // Check email
      const hasTestEmail = email.includes('@test') || email.includes('@demo') || email.includes('@example');

      if (hasTestName || hasTestEmail) {
        logIssue('TEST_DATA', `Test/demo worker detected: ${fullName} (${email})`, workerId);
        testWorkersCount++;
      }
    }

    for (const job of jobs) {
      const jobId = job._id;
      const title = (job.title || '').toLowerCase();

      const hasTestTitle = testPatterns.some(pattern => pattern.test(title));

      if (hasTestTitle) {
        logIssue('TEST_DATA', `Test/demo job detected: ${job.title}`, jobId);
        testJobsCount++;
      }
    }

    console.log(`\n📊 Test Data Summary:`);
    console.log(`   Test workers: ${testWorkersCount}`);
    console.log(`   Test jobs: ${testJobsCount}\n`);

    // ========================================================================
    // PRIORITY CHECK 10: ACTIVE STATUS CHECK
    // ========================================================================
    console.log('='.repeat(80));
    console.log('🔟 ACTIVE STATUS CHECK');
    console.log('='.repeat(80) + '\n');

    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let staleNewWorkerCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const isNewWorker = worker.workerProfile?.isNewWorker || worker.isNewWorker;
      const createdAt = worker.createdAt;

      if (isNewWorker === true && createdAt && new Date(createdAt) < THIRTY_DAYS_AGO) {
        logIssue('NEW_WORKER_BADGE', 
          `Worker marked as "new" but account is ${Math.floor((Date.now() - new Date(createdAt)) / (24*60*60*1000))} days old`, 
          workerId);
        
        // FIX: Remove new worker badge
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { 'workerProfile.isNewWorker': false, isNewWorker: false } }
        );
        logFix('NEW_WORKER_BADGE', 'Removed stale "new worker" badge', workerId);
        staleNewWorkerCount++;
      }
    }

    console.log(`\n📊 Active Status Summary:`);
    console.log(`   Stale "new worker" badges: ${staleNewWorkerCount} (fixed)\n`);

    // ========================================================================
    // PRIORITY CHECK 11: SEARCH QUERY VALIDATION
    // ========================================================================
    console.log('='.repeat(80));
    console.log('1️⃣1️⃣  SEARCH QUERY VALIDATION');
    console.log('='.repeat(80) + '\n');

    console.log('🧪 Running Search Tests:\n');

    // Test 1: Plumbing workers in Accra
    const test1 = await workersCol.countDocuments({
      role: 'worker',
      specializations: /plumb/i,
      location: /Accra/i
    });
    console.log(`   ✓ Test 1: Plumbing workers in Accra: ${test1}`);
    auditResults.validationTests.plumbingInAccra = test1;

    // Test 2: Jobs for plumbing services
    const test2 = await jobsCol.countDocuments({
      $or: [
        { title: /plumb/i },
        { description: /plumb/i },
        { category: /plumb/i }
      ]
    });
    console.log(`   ✓ Test 2: Plumbing jobs: ${test2}`);
    auditResults.validationTests.plumbingJobs = test2;

    // Test 3: Sort by rating (get top 5)
    const test3 = await workersCol.find({ role: 'worker' })
      .sort({ rating: -1 })
      .limit(5)
      .toArray();
    console.log(`   ✓ Test 3: Top 5 highest rated workers:`);
    test3.forEach((w, i) => {
      console.log(`      ${i+1}. ${w.firstName} ${w.lastName} - Rating: ${w.rating || 0}`);
    });

    // Test 4: Sort jobs by budget
    const test4 = await jobsCol.find({ budget: { $gt: 0 } })
      .sort({ budget: 1 })
      .limit(5)
      .toArray();
    console.log(`   ✓ Test 4: Lowest price jobs:`);
    test4.forEach((j, i) => {
      console.log(`      ${i+1}. ${j.title} - Budget: ${j.budget} GHS`);
    });

    // Test 5: Filter by trade
    const test5 = await workersCol.countDocuments({
      role: 'worker',
      specializations: 'Electrical Work'
    });
    console.log(`   ✓ Test 5: Electrical workers: ${test5}\n`);
    auditResults.validationTests.electricalWorkers = test5;

    // ========================================================================
    // PRIORITY CHECK 12: SPECIALIZATION STANDARDIZATION
    // ========================================================================
    console.log('='.repeat(80));
    console.log('1️⃣2️⃣  SPECIALIZATION STANDARDIZATION');
    console.log('='.repeat(80) + '\n');

    let specializationFixCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const specializations = worker.specializations || [];
      
      if (specializations.length === 0) continue;

      const standardized = [];
      let needsUpdate = false;

      for (const spec of specializations) {
        const specLower = spec.toLowerCase().trim();
        
        // Check if already standardized
        if (APPROVED_SPECIALIZATIONS.includes(spec)) {
          standardized.push(spec);
        } 
        // Check mapping
        else if (SPECIALIZATION_MAPPING[specLower]) {
          const corrected = SPECIALIZATION_MAPPING[specLower];
          standardized.push(corrected);
          needsUpdate = true;
          logIssue('SPECIALIZATION', `Non-standard specialization: "${spec}" → "${corrected}"`, workerId);
        } 
        // Keep original if not in mapping
        else {
          standardized.push(spec);
        }
      }

      // Remove duplicates
      const uniqueStandardized = [...new Set(standardized)];

      if (needsUpdate || uniqueStandardized.length !== specializations.length) {
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { specializations: uniqueStandardized } }
        );
        logFix('SPECIALIZATION', 
          `Standardized specializations: [${specializations.join(', ')}] → [${uniqueStandardized.join(', ')}]`, 
          workerId);
        specializationFixCount++;
      }
    }

    console.log(`\n📊 Specialization Summary: ${specializationFixCount} workers updated\n`);

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('📋 FINAL AUDIT SUMMARY');
    console.log('='.repeat(80) + '\n');

    // Count issues and fixes
    let totalIssues = 0;
    let totalFixes = 0;

    for (const category in auditResults.issues) {
      totalIssues += auditResults.issues[category].length;
    }

    for (const category in auditResults.fixes) {
      totalFixes += auditResults.fixes[category].length;
    }

    auditResults.summary = {
      totalWorkersScanned: totalWorkers,
      totalJobsScanned: totalJobs,
      totalIssuesFound: totalIssues,
      totalFixesApplied: totalFixes,
      issueBreakdown: Object.keys(auditResults.issues).map(cat => ({
        category: cat,
        count: auditResults.issues[cat].length
      })),
      fixBreakdown: Object.keys(auditResults.fixes).map(cat => ({
        category: cat,
        count: auditResults.fixes[cat].length
      }))
    };

    console.log(`📊 Overall Statistics:`);
    console.log(`   Workers Scanned: ${totalWorkers}`);
    console.log(`   Jobs Scanned: ${totalJobs}`);
    console.log(`   Total Issues Found: ${totalIssues}`);
    console.log(`   Total Fixes Applied: ${totalFixes}\n`);

    console.log(`📋 Issues by Category:`);
    for (const item of auditResults.summary.issueBreakdown) {
      console.log(`   ${item.category}: ${item.count}`);
    }

    console.log(`\n✅ Fixes by Category:`);
    for (const item of auditResults.summary.fixBreakdown) {
      console.log(`   ${item.category}: ${item.count}`);
    }

    // Save detailed report
    const reportPath = path.join(__dirname, `audit-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ AUDIT COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

// Run audit
comprehensiveDataIntegrityAudit().catch(console.error);
