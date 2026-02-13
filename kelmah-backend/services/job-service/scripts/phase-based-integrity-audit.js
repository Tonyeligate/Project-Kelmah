/**
 * PHASE-BASED COMPREHENSIVE DATABASE INTEGRITY AUDIT
 * Kelmah Jobs & Talents Marketplace
 * 
 * Mission: Audit and repair data inconsistencies causing broken search/filter functionality
 * 
 * Phases:
 * 1. Text Index Verification
 * 2. Workers Collection Audit
 * 3. Jobs Collection Audit
 * 4. Cross-Collection Validation
 * 5. Functional Testing
 * 6. Data Quality Report
 * 7. Backend API Validation
 */

require('dotenv').config({ path: '../../../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.JOB_MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MongoDB connection string. Set JOB_MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

// Approved trade categories (standardized)
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

// Mapping for trade standardization
const TRADE_MAPPING = {
  "electrical": "Electrical Work",
  "electrician": "Electrical Work",
  "electrical work": "Electrical Work",
  "plumbing": "Plumbing Services",
  "plumber": "Plumbing Services",
  "plumbing services": "Plumbing Services",
  "carpentry": "Carpentry & Woodwork",
  "carpenter": "Carpentry & Woodwork",
  "woodwork": "Carpentry & Woodwork",
  "painting": "Painting & Decoration",
  "painter": "Painting & Decoration",
  "paint": "Painting & Decoration",
  "masonry": "Masonry & Stonework",
  "mason": "Masonry & Stonework",
  "bricklayer": "Masonry & Stonework",
  "roofing": "Roofing Services",
  "roofer": "Roofing Services",
  "hvac": "HVAC & Climate Control",
  "heating": "HVAC & Climate Control",
  "cooling": "HVAC & Climate Control",
  "landscaping": "Landscaping",
  "landscaper": "Landscaping",
  "gardening": "Landscaping",
  "construction": "Construction & Building",
  "builder": "Construction & Building",
  "welding": "Welding Services",
  "welder": "Welding Services",
  "tiling": "Tiling & Flooring",
  "tiler": "Tiling & Flooring",
  "flooring": "Tiling & Flooring",
  "general work": "General Maintenance",
  "maintenance": "General Maintenance",
  "handyman": "General Maintenance"
};

// Approved work types
const APPROVED_WORK_TYPES = ["Full-time", "Part-time", "Contract", "Daily Work", "Project-based"];

// Test data patterns
const TEST_PATTERNS = {
  names: /test|demo|sample|placeholder|dummy|fake|example/i,
  emails: /@test\.|@demo\.|@example\.|@fake\./i,
  suspiciousRates: [42, 52, 48, 60] // Common test fixture values
};

// Results tracking
const auditResults = {
  timestamp: new Date().toISOString(),
  phases: {},
  issues: [],
  fixes: [],
  deletions: [],
  summary: {},
  testResults: {}
};

// Helper functions
function logPhase(phase, message) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${phase}: ${message}`);
  console.log('='.repeat(80) + '\n');
  
  if (!auditResults.phases[phase]) {
    auditResults.phases[phase] = { start: new Date(), logs: [] };
  }
  auditResults.phases[phase].logs.push(message);
}

function logIssue(category, description, recordId = null, severity = 'WARNING') {
  const issue = {
    category,
    description,
    recordId,
    severity,
    timestamp: new Date().toISOString()
  };
  auditResults.issues.push(issue);
  
  const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '⚠️';
  console.log(`   ${icon} [${category}] ${description}${recordId ? ` (ID: ${recordId})` : ''}`);
}

function logFix(category, description, recordId = null) {
  const fix = {
    category,
    description,
    recordId,
    timestamp: new Date().toISOString()
  };
  auditResults.fixes.push(fix);
  console.log(`   ✅ [${category}] ${description}${recordId ? ` (ID: ${recordId})` : ''}`);
}

function logDeletion(category, description, recordId) {
  const deletion = {
    category,
    description,
    recordId,
    timestamp: new Date().toISOString()
  };
  auditResults.deletions.push(deletion);
  console.log(`   🗑️  [${category}] ${description} (ID: ${recordId})`);
}

function standardizeTrade(trade) {
  if (!trade) return null;
  
  const tradeLower = trade.toLowerCase().trim();
  
  // Check if already standardized
  if (APPROVED_TRADES.includes(trade)) {
    return trade;
  }
  
  // Check mapping
  if (TRADE_MAPPING[tradeLower]) {
    return TRADE_MAPPING[tradeLower];
  }
  
  // Return original if no mapping found
  return trade;
}

async function phaseBasedAudit() {
  let db, workersCol, jobsCol;
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 PHASE-BASED COMPREHENSIVE DATABASE INTEGRITY AUDIT');
    console.log('Kelmah Jobs & Talents Marketplace');
    console.log('='.repeat(80) + '\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    db = mongoose.connection.db;
    workersCol = db.collection('users'); // Workers are users with role='worker'
    jobsCol = db.collection('jobs');

    // Get initial counts
    const totalWorkers = await workersCol.countDocuments({ role: 'worker' });
    const totalJobs = await jobsCol.countDocuments({});
    console.log(`📊 Initial Database State:`);
    console.log(`   Workers: ${totalWorkers}`);
    console.log(`   Jobs: ${totalJobs}\n`);

    // ============================================================================
    // PHASE 1: TEXT INDEX VERIFICATION
    // ============================================================================
    logPhase('PHASE 1', 'TEXT INDEX VERIFICATION');

    try {
      // Check existing indexes
      const workersIndexes = await workersCol.indexes();
      const jobsIndexes = await jobsCol.indexes();

      console.log('📋 Current Indexes:');
      console.log('   Workers:', workersIndexes.map(i => i.name).join(', '));
      console.log('   Jobs:', jobsIndexes.map(i => i.name).join(', '));

      // Test text search before any changes
      console.log('\n🧪 Testing Current Text Search:');
      
      let plumbingWorkers = 0;
      let plumbingJobs = 0;
      let paintingJobs = 0;
      
      try {
        plumbingWorkers = await workersCol.countDocuments({ 
          role: 'worker',
          $text: { $search: "plumbing" } 
        });
        console.log(`   Workers with "plumbing": ${plumbingWorkers}`);
      } catch (err) {
        console.log(`   ⚠️ Workers text search failed: ${err.message}`);
        logIssue('TEXT_INDEX', 'Workers text search not functional', null, 'CRITICAL');
      }

      try {
        plumbingJobs = await jobsCol.countDocuments({ 
          $text: { $search: "plumbing" } 
        });
        console.log(`   Jobs with "plumbing": ${plumbingJobs}`);
      } catch (err) {
        console.log(`   ⚠️ Jobs text search failed: ${err.message}`);
      }

      try {
        paintingJobs = await jobsCol.countDocuments({ 
          $text: { $search: "painting" } 
        });
        console.log(`   Jobs with "painting": ${paintingJobs}`);
      } catch (err) {
        console.log(`   ⚠️ Jobs text search failed: ${err.message}`);
      }

      // Create/recreate indexes if needed
      const hasWorkersText = workersIndexes.some(i => i.name && i.name.includes('text'));
      const hasJobsText = jobsIndexes.some(i => i.name && i.name.includes('text'));

      if (!hasWorkersText || plumbingWorkers === 0) {
        console.log('\n⚙️  Creating workers text index...');
        try {
          await workersCol.createIndex({
            firstName: "text",
            lastName: "text",
            "workerProfile.title": "text",
            specializations: "text",
            skills: "text",
            bio: "text"
          }, { 
            name: "worker_full_text_search",
            weights: {
              "workerProfile.title": 10,
              specializations: 8,
              skills: 5,
              firstName: 3,
              lastName: 3,
              bio: 1
            }
          });
          logFix('TEXT_INDEX', 'Created comprehensive text index on workers collection');
        } catch (err) {
          logIssue('TEXT_INDEX', `Failed to create workers index: ${err.message}`, null, 'CRITICAL');
        }
      } else {
        console.log('✅ Workers text index exists');
      }

      if (!hasJobsText) {
        console.log('⚙️  Creating jobs text index...');
        try {
          await jobsCol.createIndex({
            title: "text",
            description: "text",
            requiredSkills: "text",
            category: "text",
            skills: "text"
          }, { 
            name: "job_full_text_search",
            weights: {
              title: 10,
              category: 8,
              requiredSkills: 5,
              skills: 5,
              description: 1
            }
          });
          logFix('TEXT_INDEX', 'Created comprehensive text index on jobs collection');
        } catch (err) {
          logIssue('TEXT_INDEX', `Failed to create jobs index: ${err.message}`, null, 'CRITICAL');
        }
      } else {
        console.log('✅ Jobs text index exists');
      }

      // Re-test after index creation
      console.log('\n🔄 Re-testing Text Search:');
      plumbingWorkers = await workersCol.countDocuments({ 
        role: 'worker',
        $text: { $search: "plumbing" } 
      });
      plumbingJobs = await jobsCol.countDocuments({ 
        $text: { $search: "plumbing" } 
      });
      paintingJobs = await jobsCol.countDocuments({ 
        $text: { $search: "painting" } 
      });

      console.log(`   ✓ Workers with "plumbing": ${plumbingWorkers}`);
      console.log(`   ✓ Jobs with "plumbing": ${plumbingJobs}`);
      console.log(`   ✓ Jobs with "painting": ${paintingJobs}`);

    } catch (error) {
      logIssue('TEXT_INDEX', `Phase 1 error: ${error.message}`, null, 'CRITICAL');
    }

    // ============================================================================
    // PHASE 2: WORKERS COLLECTION AUDIT
    // ============================================================================
    logPhase('PHASE 2', 'WORKERS COLLECTION AUDIT');

    const workers = await workersCol.find({ role: 'worker' }).toArray();
    console.log(`📊 Auditing ${workers.length} workers...\n`);

    // ISSUE #1: Trade Mismatch Detection
    console.log('🔍 Issue #1: Trade Mismatch Detection');
    let tradeMismatchCount = 0;
    
    for (const worker of workers) {
      const workerId = worker._id;
      const primaryTrade = worker.workerProfile?.title || worker.profession || worker.primaryTrade;
      const specializations = worker.specializations || [];

      if (primaryTrade && specializations.length > 0) {
        if (!specializations.includes(primaryTrade)) {
          logIssue('TRADE_MISMATCH', 
            `Primary trade "${primaryTrade}" not in specializations [${specializations.join(', ')}]`, 
            workerId, 'HIGH');
          
          // FIX: Set to first specialization
          const newTrade = specializations[0];
          await workersCol.updateOne(
            { _id: workerId },
            { $set: { 'workerProfile.title': newTrade, primaryTrade: newTrade } }
          );
          logFix('TRADE_MISMATCH', `Updated to "${newTrade}"`, workerId);
          tradeMismatchCount++;
        }
      }
    }
    console.log(`   📊 Trade mismatches fixed: ${tradeMismatchCount}\n`);

    // ISSUE #2: Invalid Work Types
    console.log('🔍 Issue #2: Invalid Work Types');
    let invalidWorkTypeCount = 0;
    let nullWorkTypeCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const workType = worker.workerProfile?.workType;

      if (!workType || workType === null) {
        logIssue('WORK_TYPE', 'Work type is null', workerId);
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { 'workerProfile.workType': 'Full-time' } }
        );
        logFix('WORK_TYPE', 'Set to Full-time', workerId);
        nullWorkTypeCount++;
      } else if (!APPROVED_WORK_TYPES.includes(workType)) {
        logIssue('WORK_TYPE', `Invalid work type: "${workType}"`, workerId);
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { 'workerProfile.workType': 'Full-time' } }
        );
        logFix('WORK_TYPE', `Changed to Full-time`, workerId);
        invalidWorkTypeCount++;
      }
    }
    console.log(`   📊 Null: ${nullWorkTypeCount}, Invalid: ${invalidWorkTypeCount}\n`);

    // ISSUE #3: Location Gaps
    console.log('🔍 Issue #3: Location Gaps');
    let missingCityCount = 0;
    let missingRegionCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const location = worker.location;
      
      if (!location) {
        logIssue('LOCATION', 'Missing location entirely', workerId, 'HIGH');
        missingCityCount++;
        continue;
      }

      // Check if location has city
      const hasCity = typeof location === 'string' ? location.length > 0 : 
                      (location.city || location.name);
      
      if (!hasCity) {
        logIssue('LOCATION', 'Missing city', workerId, 'HIGH');
        missingCityCount++;
      }

      // Check if location has region
      const hasRegion = typeof location === 'string' ? location.includes(',') :
                        (location.region || location.state);
      
      if (!hasRegion) {
        logIssue('LOCATION', 'Missing region', workerId, 'WARNING');
        missingRegionCount++;
      }
    }
    console.log(`   📊 Missing city: ${missingCityCount}, Missing region: ${missingRegionCount}\n`);

    // ISSUE #4: Rating Integrity
    console.log('🔍 Issue #4: Rating Integrity');
    let invalidRatingCount = 0;
    let negativeReviewCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const rating = worker.rating || worker.averageRating;
      const totalReviews = worker.totalReviews || 0;

      if (rating !== undefined && rating !== null && (rating < 0 || rating > 5)) {
        logIssue('RATING', `Invalid rating: ${rating}`, workerId);
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { rating: 0, averageRating: 0 } }
        );
        logFix('RATING', 'Reset to 0', workerId);
        invalidRatingCount++;
      }

      if (totalReviews < 0) {
        logIssue('REVIEWS', `Negative review count: ${totalReviews}`, workerId);
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { totalReviews: 0 } }
        );
        logFix('REVIEWS', 'Reset to 0', workerId);
        negativeReviewCount++;
      }
    }
    console.log(`   📊 Invalid ratings: ${invalidRatingCount}, Negative reviews: ${negativeReviewCount}\n`);

    // ISSUE #5: Hourly Rate Validation
    console.log('🔍 Issue #5: Hourly Rate Validation');
    let invalidRateCount = 0;
    let suspiciousRateCount = 0;

    for (const worker of workers) {
      const workerId = worker._id;
      const hourlyRate = worker.hourlyRate || worker.workerProfile?.hourlyRate;

      if (hourlyRate !== undefined && hourlyRate !== null) {
        if (hourlyRate <= 0 || hourlyRate > 500) {
          logIssue('HOURLY_RATE', `Invalid rate: ${hourlyRate} GHS`, workerId);
          invalidRateCount++;
        } else if (TEST_PATTERNS.suspiciousRates.includes(hourlyRate)) {
          logIssue('HOURLY_RATE', `Suspicious test rate: ${hourlyRate} GHS`, workerId, 'WARNING');
          suspiciousRateCount++;
        }
      }
    }
    console.log(`   📊 Invalid rates: ${invalidRateCount}, Suspicious rates: ${suspiciousRateCount}\n`);

    // ISSUE #6: Duplicate/Test Data
    console.log('🔍 Issue #6: Duplicate/Test Data Detection');
    let testDataCount = 0;
    const testUserIds = [];

    for (const worker of workers) {
      const workerId = worker._id;
      const fullName = `${worker.firstName || ''} ${worker.lastName || ''}`;
      const email = worker.email || '';
      const hourlyRate = worker.hourlyRate || worker.workerProfile?.hourlyRate;

      let isTestData = false;
      let reason = '';

      // Check name
      if (TEST_PATTERNS.names.test(fullName)) {
        isTestData = true;
        reason = 'test name pattern';
      }

      // Check email
      if (TEST_PATTERNS.emails.test(email)) {
        isTestData = true;
        reason += (reason ? ' + ' : '') + 'test email domain';
      }

      // Check suspicious rate + name combination
      if (TEST_PATTERNS.suspiciousRates.includes(hourlyRate) && TEST_PATTERNS.names.test(fullName)) {
        isTestData = true;
        reason += (reason ? ' + ' : '') + 'test rate + test name';
      }

      if (isTestData) {
        logIssue('TEST_DATA', `Test worker detected: ${fullName} (${email}) - ${reason}`, workerId, 'CRITICAL');
        testUserIds.push(workerId);
        testDataCount++;
        
        // DELETE test users
        await workersCol.deleteOne({ _id: workerId });
        logDeletion('TEST_DATA', `Deleted test worker: ${fullName}`, workerId);
      }
    }
    console.log(`   📊 Test users found and deleted: ${testDataCount}\n`);

    // ============================================================================
    // PHASE 3: JOBS COLLECTION AUDIT
    // ============================================================================
    logPhase('PHASE 3', 'JOBS COLLECTION AUDIT');

    const jobs = await jobsCol.find({}).toArray();
    console.log(`📊 Auditing ${jobs.length} jobs...\n`);

    // ISSUE #7: Title/Description Empty
    console.log('🔍 Issue #7: Title/Description Validation');
    let emptyTitleCount = 0;
    let emptyDescCount = 0;
    let shortDescCount = 0;

    for (const job of jobs) {
      const jobId = job._id;
      let shouldDelete = false;

      if (!job.title || job.title.trim() === '') {
        logIssue('JOB_TITLE', 'Empty title', jobId, 'CRITICAL');
        shouldDelete = true;
        emptyTitleCount++;
      }

      if (!job.description || job.description.trim() === '') {
        logIssue('JOB_DESCRIPTION', 'Empty description', jobId, 'CRITICAL');
        shouldDelete = true;
        emptyDescCount++;
      } else if (job.description.length < 20) {
        logIssue('JOB_DESCRIPTION', `Short description: ${job.description.length} chars`, jobId, 'WARNING');
        shortDescCount++;
      }

      if (shouldDelete) {
        await jobsCol.deleteOne({ _id: jobId });
        logDeletion('JOB_INCOMPLETE', 'Deleted incomplete job', jobId);
      }
    }
    console.log(`   📊 Empty titles: ${emptyTitleCount}, Empty desc: ${emptyDescCount}, Short desc: ${shortDescCount}\n`);

    // Refresh jobs list after deletions
    const jobsAfterCleanup = await jobsCol.find({}).toArray();

    // ISSUE #8: Required Skills Validation
    console.log('🔍 Issue #8: Required Skills Validation');
    let emptySkillsCount = 0;

    for (const job of jobsAfterCleanup) {
      const jobId = job._id;
      const requiredSkills = job.requiredSkills || job.skills || [];

      if (requiredSkills.length === 0) {
        logIssue('REQUIRED_SKILLS', 'Empty required skills', jobId, 'WARNING');
        emptySkillsCount++;
      }
    }
    console.log(`   📊 Jobs with empty skills: ${emptySkillsCount}\n`);

    // ISSUE #9: Budget Validation
    console.log('🔍 Issue #9: Budget Validation');
    let invalidBudgetCount = 0;

    for (const job of jobsAfterCleanup) {
      const jobId = job._id;
      const budget = job.budget || job.salary;

      if (budget !== undefined && budget !== null) {
        if (budget <= 0 || budget > 100000) {
          logIssue('BUDGET', `Invalid budget: ${budget} GHS`, jobId);
          invalidBudgetCount++;
        }
      }
    }
    console.log(`   📊 Invalid budgets: ${invalidBudgetCount}\n`);

    // ISSUE #10: Application Count Issues
    console.log('🔍 Issue #10: Application Count Validation');
    let nullAppCountCount = 0;
    let unrealisticAppCountCount = 0;

    for (const job of jobsAfterCleanup) {
      const jobId = job._id;
      const appCount = job.applicationCount || job.applicantsCount || job.proposalCount;

      if (appCount === null || appCount === undefined) {
        await jobsCol.updateOne(
          { _id: jobId },
          { $set: { applicationCount: 0, applicantsCount: 0 } }
        );
        logFix('APP_COUNT', 'Set to 0', jobId);
        nullAppCountCount++;
      } else if (appCount > 1000) {
        logIssue('APP_COUNT', `Unrealistic count: ${appCount}`, jobId, 'WARNING');
        unrealisticAppCountCount++;
      }
    }
    console.log(`   📊 Null counts fixed: ${nullAppCountCount}, Unrealistic: ${unrealisticAppCountCount}\n`);

    // ISSUE #11: Duplicate Jobs
    console.log('🔍 Issue #11: Duplicate Job Detection');
    
    const jobGroups = await jobsCol.aggregate([
      {
        $group: {
          _id: { title: '$title', hirer: '$hirer' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          dates: { $push: '$createdAt' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    let duplicatesDeleted = 0;
    for (const group of jobGroups) {
      logIssue('DUPLICATE_JOB', 
        `"${group._id.title}" posted ${group.count} times`, 
        null, 'HIGH');
      
      // Keep the first (oldest), delete others
      const [keep, ...deleteIds] = group.ids;
      
      for (const deleteId of deleteIds) {
        await jobsCol.deleteOne({ _id: deleteId });
        logDeletion('DUPLICATE_JOB', `Deleted duplicate of "${group._id.title}"`, deleteId);
        duplicatesDeleted++;
      }
    }
    console.log(`   📊 Duplicate jobs deleted: ${duplicatesDeleted}\n`);

    // ISSUE #12: Job Status Validation
    console.log('🔍 Issue #12: Job Status Validation');
    const validStatuses = ['open', 'Open', 'OPEN', 'in-progress', 'In Progress', 'closed', 'Closed', 'completed', 'Completed'];
    let invalidStatusCount = 0;

    for (const job of jobsAfterCleanup) {
      const jobId = job._id;
      const status = job.status;

      if (!status || !validStatuses.includes(status)) {
        logIssue('JOB_STATUS', `Invalid status: "${status}"`, jobId);
        await jobsCol.updateOne(
          { _id: jobId },
          { $set: { status: 'open' } }
        );
        logFix('JOB_STATUS', 'Set to "open"', jobId);
        invalidStatusCount++;
      }
    }
    console.log(`   📊 Invalid statuses fixed: ${invalidStatusCount}\n`);

    // ============================================================================
    // PHASE 4: CROSS-COLLECTION VALIDATION
    // ============================================================================
    logPhase('PHASE 4', 'CROSS-COLLECTION VALIDATION');

    // ISSUE #13: Broken References
    console.log('🔍 Issue #13: Broken Job References');
    const finalJobs = await jobsCol.find({}).toArray();
    let orphanedJobsCount = 0;

    for (const job of finalJobs) {
      const jobId = job._id;
      const hirerId = job.hirer;

      if (hirerId) {
        const hirerExists = await workersCol.findOne({ _id: hirerId });
        if (!hirerExists) {
          logIssue('BROKEN_REF', `Job references non-existent hirer`, jobId, 'HIGH');
          orphanedJobsCount++;
        }
      }
    }
    console.log(`   📊 Orphaned jobs: ${orphanedJobsCount}\n`);

    // ISSUE #14: Trade Category Standardization
    console.log('🔍 Issue #14: Trade Category Standardization');
    let workersStandardized = 0;
    let jobsStandardized = 0;

    // Standardize worker trades
    const finalWorkers = await workersCol.find({ role: 'worker' }).toArray();
    for (const worker of finalWorkers) {
      const workerId = worker._id;
      const specializations = worker.specializations || [];
      
      let updated = false;
      const standardizedSpecs = specializations.map(spec => {
        const standardized = standardizeTrade(spec);
        if (standardized !== spec) {
          updated = true;
        }
        return standardized;
      });

      if (updated) {
        await workersCol.updateOne(
          { _id: workerId },
          { $set: { specializations: standardizedSpecs } }
        );
        logFix('TRADE_STD', 
          `Standardized: [${specializations.join(', ')}] → [${standardizedSpecs.join(', ')}]`, 
          workerId);
        workersStandardized++;
      }
    }

    // Standardize job trades
    for (const job of finalJobs) {
      const jobId = job._id;
      const category = job.category || job.primaryTrade;
      
      if (category) {
        const standardized = standardizeTrade(category);
        if (standardized !== category) {
          await jobsCol.updateOne(
            { _id: jobId },
            { $set: { category: standardized } }
          );
          logFix('TRADE_STD', `"${category}" → "${standardized}"`, jobId);
          jobsStandardized++;
        }
      }
    }
    console.log(`   📊 Workers: ${workersStandardized}, Jobs: ${jobsStandardized} standardized\n`);

    // ============================================================================
    // PHASE 5: FUNCTIONAL TESTING
    // ============================================================================
    logPhase('PHASE 5', 'FUNCTIONAL TESTING');

    console.log('🧪 Running Comprehensive Tests...\n');

    // Test 1: Text search
    const test1Workers = await workersCol.countDocuments({ 
      role: 'worker',
      $text: { $search: "plumbing" } 
    });
    const test1Jobs = await jobsCol.countDocuments({ 
      $text: { $search: "painting" } 
    });
    console.log(`✓ Test 1 - Text Search:`);
    console.log(`   Workers with "plumbing": ${test1Workers} ${test1Workers > 0 ? '✅' : '❌'}`);
    console.log(`   Jobs with "painting": ${test1Jobs} ${test1Jobs > 0 ? '✅' : '❌'}\n`);
    
    auditResults.testResults.textSearch = {
      plumbingWorkers: test1Workers,
      paintingJobs: test1Jobs,
      passed: test1Workers > 0 || test1Jobs > 0
    };

    // Test 2: Filter by trade
    const test2Workers = await workersCol.countDocuments({ 
      role: 'worker',
      specializations: { $in: APPROVED_TRADES }
    });
    const test2Jobs = await jobsCol.countDocuments({ 
      category: { $in: APPROVED_TRADES }
    });
    console.log(`✓ Test 2 - Filter by Trade:`);
    console.log(`   Workers with approved trades: ${test2Workers} ${test2Workers > 0 ? '✅' : '❌'}`);
    console.log(`   Jobs with approved trades: ${test2Jobs} ${test2Jobs > 0 ? '✅' : '❌'}\n`);
    
    auditResults.testResults.tradeFilter = {
      workers: test2Workers,
      jobs: test2Jobs,
      passed: test2Workers > 0 && test2Jobs > 0
    };

    // Test 3: Sort by rating
    const test3 = await workersCol.find({ role: 'worker' })
      .sort({ rating: -1, totalReviews: -1 })
      .limit(5)
      .toArray();
    console.log(`✓ Test 3 - Sort by Rating (Top 5):`);
    test3.forEach((w, i) => {
      console.log(`   ${i+1}. ${w.firstName} ${w.lastName} - ${w.rating || 0} ⭐ (${w.totalReviews || 0} reviews)`);
    });
    console.log();

    // Test 4: Sort by popularity
    const test4 = await jobsCol.find()
      .sort({ applicationCount: -1, applicantsCount: -1 })
      .limit(5)
      .toArray();
    console.log(`✓ Test 4 - Sort by Popularity (Top 5):`);
    test4.forEach((j, i) => {
      const count = j.applicationCount || j.applicantsCount || 0;
      console.log(`   ${i+1}. ${j.title} - ${count} applicants`);
    });
    console.log();

    // Test 5: No test data remains
    const test5 = await workersCol.countDocuments({ 
      role: 'worker',
      hourlyRate: { $in: TEST_PATTERNS.suspiciousRates }
    });
    console.log(`✓ Test 5 - Test Data Cleanup:`);
    console.log(`   Workers with test rates: ${test5} ${test5 === 0 ? '✅' : '⚠️'}\n`);

    // Test 6: No duplicates
    const test6Groups = await jobsCol.aggregate([
      {
        $group: {
          _id: { title: '$title', hirer: '$hirer' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    console.log(`✓ Test 6 - Duplicate Detection:`);
    console.log(`   Duplicate jobs remaining: ${test6Groups.length} ${test6Groups.length === 0 ? '✅' : '⚠️'}\n`);

    // ============================================================================
    // PHASE 6: DATA QUALITY REPORT
    // ============================================================================
    logPhase('PHASE 6', 'DATA QUALITY REPORT');

    const finalWorkerCount = await workersCol.countDocuments({ role: 'worker' });
    const finalJobCount = await jobsCol.countDocuments({});

    console.log('📊 FINAL DATABASE STATE:\n');
    console.log(`   Workers: ${finalWorkerCount} (was ${totalWorkers})`);
    console.log(`   Jobs: ${finalJobCount} (was ${totalJobs})`);
    console.log(`   Workers deleted: ${totalWorkers - finalWorkerCount}`);
    console.log(`   Jobs deleted: ${totalJobs - finalJobCount}\n`);

    console.log('📋 SUMMARY BY CATEGORY:\n');
    
    const issuesByCategory = {};
    auditResults.issues.forEach(issue => {
      issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
    });

    const fixesByCategory = {};
    auditResults.fixes.forEach(fix => {
      fixesByCategory[fix.category] = (fixesByCategory[fix.category] || 0) + 1;
    });

    console.log('   Issues Found:');
    Object.entries(issuesByCategory).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count}`);
    });

    console.log('\n   Fixes Applied:');
    Object.entries(fixesByCategory).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count}`);
    });

    console.log(`\n   Total Deletions: ${auditResults.deletions.length}\n`);

    // Calculate integrity metrics
    const workersWithValidData = await workersCol.countDocuments({
      role: 'worker',
      'workerProfile.workType': { $in: APPROVED_WORK_TYPES },
      location: { $exists: true, $ne: null }
    });

    const jobsWithValidData = await jobsCol.countDocuments({
      title: { $exists: true, $ne: '' },
      description: { $exists: true, $ne: '' },
      status: { $in: validStatuses }
    });

    const workersIntegrity = ((workersWithValidData / finalWorkerCount) * 100).toFixed(1);
    const jobsIntegrity = ((jobsWithValidData / finalJobCount) * 100).toFixed(1);

    console.log('📈 DATA INTEGRITY METRICS:\n');
    console.log(`   Workers with valid data: ${workersIntegrity}%`);
    console.log(`   Jobs with valid data: ${jobsIntegrity}%\n`);

    auditResults.summary = {
      initialState: {
        workers: totalWorkers,
        jobs: totalJobs
      },
      finalState: {
        workers: finalWorkerCount,
        jobs: finalJobCount
      },
      changes: {
        workersDeleted: totalWorkers - finalWorkerCount,
        jobsDeleted: totalJobs - finalJobCount,
        totalIssues: auditResults.issues.length,
        totalFixes: auditResults.fixes.length,
        totalDeletions: auditResults.deletions.length
      },
      integrity: {
        workersIntegrity: parseFloat(workersIntegrity),
        jobsIntegrity: parseFloat(jobsIntegrity)
      }
    };

    // Save detailed report
    const reportPath = path.join(__dirname, `phase-audit-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`💾 Detailed report saved: ${reportPath}\n`);

    // ============================================================================
    // PHASE 7: BACKEND API VALIDATION
    // ============================================================================
    logPhase('PHASE 7', 'BACKEND API VALIDATION RECOMMENDATIONS');

    console.log('📋 Required API Endpoints:\n');
    console.log('GET /api/workers/search');
    console.log('   Params: keywords, city, workType, primaryTrade, sortBy, page, limit');
    console.log('   ✓ Must use $text search for keywords');
    console.log('   ✓ Must apply exact filters for dropdowns');
    console.log('   ✓ Must support sorting (relevance, rating, price, date)');
    console.log('   ✓ Must return accurate count\n');

    console.log('GET /api/jobs/search');
    console.log('   Params: keywords, city, primaryTrade, maxBudget, sortBy, page, limit');
    console.log('   ✓ Must use $text search for keywords');
    console.log('   ✓ Must apply exact filters for dropdowns');
    console.log('   ✓ Must support sorting (relevance, budget, date)');
    console.log('   ✓ Must handle pagination correctly\n');

    console.log('='.repeat(80));
    console.log('✅ PHASE-BASED AUDIT COMPLETE');
    console.log('='.repeat(80) + '\n');

    console.log('📊 CRITICAL SUCCESS CRITERIA:\n');
    console.log(`   ✓ Text search functional: ${auditResults.testResults.textSearch.passed ? '✅' : '❌'}`);
    console.log(`   ✓ Trade filtering working: ${auditResults.testResults.tradeFilter.passed ? '✅' : '❌'}`);
    console.log(`   ✓ No duplicate jobs: ${test6Groups.length === 0 ? '✅' : '❌'}`);
    console.log(`   ✓ No test data: ${test5 === 0 ? '✅' : '⚠️'}`);
    console.log(`   ✓ Data integrity >90%: ${workersIntegrity > 90 && jobsIntegrity > 90 ? '✅' : '⚠️'}\n`);

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Connection closed.');
    }
  }
}

// Run phase-based audit
phaseBasedAudit().catch(console.error);
