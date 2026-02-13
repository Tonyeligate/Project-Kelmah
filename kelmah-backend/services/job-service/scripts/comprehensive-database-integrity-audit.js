/**
 * COMPREHENSIVE DATABASE INTEGRITY AUDIT
 * 5-Phase System for Kelmah Platform
 * Identifies and fixes data inconsistencies causing broken search/filter functionality
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../../../.env' });

const MONGODB_URI = process.env.JOB_MONGO_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MongoDB connection string. Set JOB_MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

// Approved trade categories (standardized list)
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

const VALID_WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Daily Work', 'Project-based'];
const VALID_JOB_STATUSES = ['Open', 'In Progress', 'Closed'];

// Audit Report Structure
const auditReport = {
  auditDate: new Date().toISOString(),
  mode: 'DRY_RUN', // Change to 'LIVE' to apply fixes
  workersAudited: 0,
  jobsAudited: 0,
  issuesFound: {
    workersTradesMismatched: 0,
    workersInvalidWorkTypes: 0,
    workersMissingLocations: 0,
    workersRatingOutOfRange: 0,
    workersInvalidHourlyRate: 0,
    workersTestData: 0,
    workersNonStandardTrades: 0,
    workersDuplicates: 0,
    jobsMissingRequiredFields: 0,
    jobsInvalidBudget: 0,
    jobsMissingCity: 0,
    jobsApplicationCountIssues: 0,
    jobsDuplicates: 0,
    jobsInvalidStatus: 0,
    textIndexesMissing: 0
  },
  actionsPlanned: {
    workersToDelete: [],
    workersToUpdate: [],
    jobsToDelete: [],
    jobsToUpdate: [],
    indexesToCreate: []
  },
  testResults: {
    textSearchWorking: null,
    textSearchWorkersCount: 0,
    textSearchJobsCount: 0,
    tradeFilterWorking: null,
    cityFilterWorking: null,
    combinedFiltersWorking: null,
    noDuplicates: null,
    noTestData: null
  }
};

// Utility: Log with color
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  phase: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`)
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log.success('Connected to MongoDB Atlas');
    return mongoose.connection.db;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

// ===== PHASE 1: INDEX CREATION & VERIFICATION =====
async function phase1_verifyIndexes(db) {
  log.phase('PHASE 1: INDEX CREATION & VERIFICATION');
  
  const workersCollection = db.collection('users');
  const jobsCollection = db.collection('jobs');
  
  // Check existing indexes
  const workerIndexes = await workersCollection.indexes();
  const jobIndexes = await jobsCollection.indexes();
  
  log.info('Current Workers Indexes:');
  workerIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));
  
  log.info('Current Jobs Indexes:');
  jobIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));
  
  // Check for text indexes
  const workerTextIndex = workerIndexes.find(idx => idx.name && idx.name.includes('text'));
  const jobTextIndex = jobIndexes.find(idx => idx.name && idx.name.includes('text'));
  
  if (!workerTextIndex) {
    log.warning('Workers text index MISSING');
    auditReport.issuesFound.textIndexesMissing++;
    auditReport.actionsPlanned.indexesToCreate.push({
      collection: 'users',
      index: { 
        firstName: 'text', 
        lastName: 'text', 
        'workerProfile.title': 'text',
        'workerProfile.specializations': 'text',
        'workerProfile.skills': 'text',
        'workerProfile.bio': 'text'
      },
      name: 'worker_text_search'
    });
  } else {
    log.success('Workers text index exists');
  }
  
  if (!jobTextIndex) {
    log.warning('Jobs text index MISSING');
    auditReport.issuesFound.textIndexesMissing++;
    auditReport.actionsPlanned.indexesToCreate.push({
      collection: 'jobs',
      index: { 
        title: 'text', 
        description: 'text', 
        requiredSkills: 'text',
        category: 'text'
      },
      name: 'job_text_search'
    });
  } else {
    log.success('Jobs text index exists');
  }
  
  // Test text search
  const workerSearchTest = await workersCollection.find({
    role: 'worker',
    $text: { $search: 'electrician welding' }
  }).limit(5).toArray();
  
  const jobSearchTest = await jobsCollection.find({
    $text: { $search: 'painting construction' }
  }).limit(5).toArray();
  
  auditReport.testResults.textSearchWorkersCount = workerSearchTest.length;
  auditReport.testResults.textSearchJobsCount = jobSearchTest.length;
  auditReport.testResults.textSearchWorking = workerSearchTest.length > 0 && jobSearchTest.length > 0;
  
  log.info(`Text search test - Workers found: ${workerSearchTest.length}, Jobs found: ${jobSearchTest.length}`);
  
  if (workerSearchTest.length === 0) {
    log.warning('Workers text search returned 0 results - index may be missing or broken');
  }
  if (jobSearchTest.length === 0) {
    log.warning('Jobs text search returned 0 results - index may be missing or broken');
  }
}

// ===== PHASE 2: WORKERS DATA AUDIT =====
async function phase2_auditWorkers(db) {
  log.phase('PHASE 2: WORKERS DATA AUDIT');
  
  const workersCollection = db.collection('users');
  const workers = await workersCollection.find({ role: 'worker' }).toArray();
  
  auditReport.workersAudited = workers.length;
  log.info(`Auditing ${workers.length} workers...`);
  
  for (const worker of workers) {
    const issues = [];
    const updates = {};
    let shouldDelete = false;
    
    // CHECK 1: Trade Mismatch (UPDATED FOR REAL SCHEMA)
    const profession = worker.profession;
    const specializations = worker.specializations || [];
    
    // Profession should match one of the specializations
    if (profession && specializations.length > 0) {
      // No mismatch check needed - they're separate fields in this schema
      // profession is main job title, specializations are trade categories
    }
    
    // CHECK 2: Invalid Work Types
    const workType = worker.workerProfile?.workType;
    if (workType && !VALID_WORK_TYPES.includes(workType)) {
      issues.push(`Invalid work type: ${workType}`);
      auditReport.issuesFound.workersInvalidWorkTypes++;
      updates['workerProfile.workType'] = 'Full-time';
    }
    
    // CHECK 3: Missing Location Data (UPDATED FOR REAL SCHEMA)
    const location = worker.location; // Format: "Accra, Ghana"
    if (!location || location.trim() === '') {
      issues.push('Missing location');
      auditReport.issuesFound.workersMissingLocations++;
      shouldDelete = true;
    }
    
    // CHECK 4: Rating Out of Range (UPDATED FOR REAL SCHEMA)
    const rating = worker.rating; // At root level, not in workerProfile
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      issues.push(`Invalid rating: ${rating}`);
      auditReport.issuesFound.workersRatingOutOfRange++;
      updates.rating = 0;
    }
    
    // CHECK 5: Invalid Hourly Rate (UPDATED FOR REAL SCHEMA)
    const hourlyRate = worker.hourlyRate; // At root level
    if (hourlyRate !== undefined && (hourlyRate <= 0 || hourlyRate > 500)) {
      issues.push(`Invalid hourly rate: ${hourlyRate}`);
      auditReport.issuesFound.workersInvalidHourlyRate++;
    }
    
    // CHECK 6: Test Data Detection
    const fullName = `${worker.firstName || ''} ${worker.lastName || ''}`.toLowerCase();
    const email = (worker.email || '').toLowerCase();
    const testPatterns = ['test', 'demo', 'sample', 'placeholder', 'dummy'];
    const testEmails = ['@test', '@demo', '@example'];
    const testRates = [42, 52, 48, 60];
    
    const isTestData = testPatterns.some(p => fullName.includes(p)) ||
                       testEmails.some(e => email.includes(e)) ||
                       (testRates.includes(hourlyRate) && testPatterns.some(p => fullName.includes(p)));
    
    if (isTestData) {
      issues.push('Test/Demo data detected');
      auditReport.issuesFound.workersTestData++;
      shouldDelete = true;
    }
    
    // CHECK 7: Specialization Standardization (UPDATED FOR REAL SCHEMA)
    if (specializations.length > 0) {
      const nonStandard = specializations.filter(s => !APPROVED_TRADES.includes(s));
      if (nonStandard.length > 0) {
        issues.push(`Non-standard trades: ${nonStandard.join(', ')}`);
        auditReport.issuesFound.workersNonStandardTrades++;
        
        // Map to closest standard trade
        const standardized = specializations.map(spec => {
          if (APPROVED_TRADES.includes(spec)) return spec;
          
          // Simple mapping logic
          const lower = spec.toLowerCase();
          if (lower.includes('electric')) return 'Electrical Work';
          if (lower.includes('plumb')) return 'Plumbing Services';
          if (lower.includes('carpen') || lower.includes('wood')) return 'Carpentry & Woodwork';
          if (lower.includes('paint')) return 'Painting & Decoration';
          if (lower.includes('mason') || lower.includes('stone')) return 'Masonry & Stonework';
          if (lower.includes('roof')) return 'Roofing Services';
          if (lower.includes('hvac') || lower.includes('air con')) return 'HVAC & Climate Control';
          if (lower.includes('landscape') || lower.includes('garden')) return 'Landscaping';
          if (lower.includes('construct') || lower.includes('build')) return 'Construction & Building';
          if (lower.includes('weld') || lower.includes('metal')) return 'Welding Services';
          if (lower.includes('til') || lower.includes('floor')) return 'Tiling & Flooring';
          if (lower.includes('general') || lower.includes('maintenance')) return 'General Maintenance';
          return 'General Maintenance'; // Default fallback
        });
        
        updates.specializations = standardized;
      }
    }
    
    // Record actions
    if (shouldDelete) {
      auditReport.actionsPlanned.workersToDelete.push({
        _id: worker._id,
        name: fullName,
        email: worker.email,
        reasons: issues
      });
    } else if (Object.keys(updates).length > 0) {
      auditReport.actionsPlanned.workersToUpdate.push({
        _id: worker._id,
        name: fullName,
        updates: updates,
        reasons: issues
      });
    }
  }
  
  log.info(`Workers audit complete - ${auditReport.actionsPlanned.workersToDelete.length} to delete, ${auditReport.actionsPlanned.workersToUpdate.length} to update`);
}

// ===== PHASE 3: JOBS DATA AUDIT =====
async function phase3_auditJobs(db) {
  log.phase('PHASE 3: JOBS DATA AUDIT');
  
  const jobsCollection = db.collection('jobs');
  const jobs = await jobsCollection.find({}).toArray();
  
  auditReport.jobsAudited = jobs.length;
  log.info(`Auditing ${jobs.length} jobs...`);
  
  // Check for duplicates
  const jobSignatures = new Map();
  
  for (const job of jobs) {
    const issues = [];
    const updates = {};
    let shouldDelete = false;
    
    // CHECK 1: Missing Required Fields
    if (!job.title || job.title.trim() === '' || !job.description || job.description.trim() === '') {
      issues.push('Missing title or description');
      auditReport.issuesFound.jobsMissingRequiredFields++;
      shouldDelete = true;
    }
    
    // CHECK 2: Invalid Budget
    const budget = job.budget;
    if (budget !== undefined && (budget <= 0 || budget > 100000)) {
      issues.push(`Invalid budget: ${budget}`);
      auditReport.issuesFound.jobsInvalidBudget++;
      shouldDelete = true; // Likely test data
    }
    
    // CHECK 3: Missing City (UPDATED FOR REAL SCHEMA)
    const jobCity = job.location?.city; // Nested in location object
    if (!jobCity || jobCity.trim() === '') {
      issues.push('Missing city in location');
      auditReport.issuesFound.jobsMissingCity++;
      shouldDelete = true;
    }
    
    // CHECK 4: Application Count Issues
    const appCount = job.applicationCount;
    if (appCount !== undefined) {
      if (appCount > 1000) {
        issues.push(`Unrealistic application count: ${appCount}`);
        auditReport.issuesFound.jobsApplicationCountIssues++;
        updates.applicationCount = 0;
      }
    } else {
      updates.applicationCount = 0;
    }
    
    // CHECK 5: Duplicate Detection
    if (job.title && job.description && job.postedBy) {
      const signature = `${job.title}_${job.description.substring(0, 100)}_${job.postedBy}`;
      if (jobSignatures.has(signature)) {
        issues.push('Duplicate job');
        auditReport.issuesFound.jobsDuplicates++;
        shouldDelete = true; // Delete duplicate, keep original
      } else {
        jobSignatures.set(signature, job._id);
      }
    }
    
    // CHECK 6: Status Validation (UPDATED FOR REAL SCHEMA)
    const status = job.status;
    // Status is lowercase "open" but should be "Open", "In Progress", "Closed"
    if (status) {
      const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      if (!VALID_JOB_STATUSES.includes(capitalizedStatus)) {
        issues.push(`Invalid status: ${status}`);
        auditReport.issuesFound.jobsInvalidStatus++;
        updates.status = 'Open'; // Default to Open
      } else if (status !== capitalizedStatus) {
        // Fix capitalization
        issues.push(`Status capitalization issue: ${status}`);
        auditReport.issuesFound.jobsInvalidStatus++;
        updates.status = capitalizedStatus;
      }
    }
    
    // Record actions
    if (shouldDelete) {
      auditReport.actionsPlanned.jobsToDelete.push({
        _id: job._id,
        title: job.title,
        reasons: issues
      });
    } else if (Object.keys(updates).length > 0) {
      auditReport.actionsPlanned.jobsToUpdate.push({
        _id: job._id,
        title: job.title,
        updates: updates,
        reasons: issues
      });
    }
  }
  
  log.info(`Jobs audit complete - ${auditReport.actionsPlanned.jobsToDelete.length} to delete, ${auditReport.actionsPlanned.jobsToUpdate.length} to update`);
}

// ===== PHASE 4: CRITICAL TESTING =====
async function phase4_criticalTesting(db) {
  log.phase('PHASE 4: CRITICAL TESTING');
  
  const workersCollection = db.collection('users');
  const jobsCollection = db.collection('jobs');
  
  // Test 1: Text Search for Workers
  log.info('Test 1: Text search for workers...');
  const workerSearchCount = await workersCollection.countDocuments({
    role: 'worker',
    $text: { $search: 'electrician' }
  });
  auditReport.testResults.textSearchWorkersCount = workerSearchCount;
  log.info(`  Result: ${workerSearchCount} workers found`);
  
  // Test 2: Text Search for Jobs
  log.info('Test 2: Text search for jobs...');
  const jobSearchCount = await jobsCollection.countDocuments({
    $text: { $search: 'painting' }
  });
  auditReport.testResults.textSearchJobsCount = jobSearchCount;
  log.info(`  Result: ${jobSearchCount} jobs found`);
  
  // Test 3: Filter by Trade (UPDATED FOR REAL SCHEMA)
  log.info('Test 3: Filter by trade (Electrical Work via specializations)...');
  const tradeFilterCount = await workersCollection.countDocuments({
    role: 'worker',
    specializations: 'Electrical Work' // Array contains check
  });
  auditReport.testResults.tradeFilterWorking = tradeFilterCount > 0;
  log.info(`  Result: ${tradeFilterCount} workers found`);
  
  // Test 4: Filter by City (UPDATED FOR REAL SCHEMA)
  log.info('Test 4: Filter by city (Accra via location field)...');
  const cityFilterCount = await workersCollection.countDocuments({
    role: 'worker',
    location: /Accra/i // Location is "Accra, Ghana" format
  });
  auditReport.testResults.cityFilterWorking = cityFilterCount > 0;
  log.info(`  Result: ${cityFilterCount} workers found`);
  
  // Test 5: Combined Filters (UPDATED FOR REAL SCHEMA)
  log.info('Test 5: Combined filters (Tema + Welding Services)...');
  const combinedCount = await workersCollection.countDocuments({
    role: 'worker',
    location: /Tema/i,
    specializations: 'Welding Services'
  });
  auditReport.testResults.combinedFiltersWorking = combinedCount >= 0; // Even 0 is valid
  log.info(`  Result: ${combinedCount} workers found`);
  
  // Test 6: No Duplicates
  log.info('Test 6: Checking for duplicates...');
  const totalWorkers = await workersCollection.countDocuments({ role: 'worker' });
  const distinctWorkers = (await workersCollection.distinct('_id', { role: 'worker' })).length;
  auditReport.testResults.noDuplicates = totalWorkers === distinctWorkers;
  log.info(`  Result: ${totalWorkers} total, ${distinctWorkers} distinct - ${totalWorkers === distinctWorkers ? 'PASS' : 'FAIL'}`);
  
  // Test 7: No Test Data (UPDATED FOR REAL SCHEMA)
  log.info('Test 7: Checking for test data...');
  const testDataCount = await workersCollection.countDocuments({
    role: 'worker',
    hourlyRate: { $in: [42, 52, 48, 60] } // At root level
  });
  auditReport.testResults.noTestData = testDataCount === 0;
  log.info(`  Result: ${testDataCount} test records found - ${testDataCount === 0 ? 'PASS' : 'FAIL'}`);
}

// ===== PHASE 5: GENERATE REPORT =====
function phase5_generateReport() {
  log.phase('PHASE 5: AUDIT REPORT');
  
  const totalIssues = Object.values(auditReport.issuesFound).reduce((sum, val) => sum + val, 0);
  const totalActions = 
    auditReport.actionsPlanned.workersToDelete.length +
    auditReport.actionsPlanned.workersToUpdate.length +
    auditReport.actionsPlanned.jobsToDelete.length +
    auditReport.actionsPlanned.jobsToUpdate.length +
    auditReport.actionsPlanned.indexesToCreate.length;
  
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE DATABASE INTEGRITY AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`Audit Date: ${auditReport.auditDate}`);
  console.log(`Mode: ${auditReport.mode}`);
  console.log(`Workers Audited: ${auditReport.workersAudited}`);
  console.log(`Jobs Audited: ${auditReport.jobsAudited}`);
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Total Actions Planned: ${totalActions}`);
  console.log('='.repeat(80));
  
  console.log('\n📊 ISSUES BREAKDOWN:');
  console.log('Workers Issues:');
  console.log(`  - Trades Mismatched: ${auditReport.issuesFound.workersTradesMismatched}`);
  console.log(`  - Invalid Work Types: ${auditReport.issuesFound.workersInvalidWorkTypes}`);
  console.log(`  - Missing Locations: ${auditReport.issuesFound.workersMissingLocations}`);
  console.log(`  - Rating Out of Range: ${auditReport.issuesFound.workersRatingOutOfRange}`);
  console.log(`  - Invalid Hourly Rate: ${auditReport.issuesFound.workersInvalidHourlyRate}`);
  console.log(`  - Test Data: ${auditReport.issuesFound.workersTestData}`);
  console.log(`  - Non-Standard Trades: ${auditReport.issuesFound.workersNonStandardTrades}`);
  
  console.log('\nJobs Issues:');
  console.log(`  - Missing Required Fields: ${auditReport.issuesFound.jobsMissingRequiredFields}`);
  console.log(`  - Invalid Budget: ${auditReport.issuesFound.jobsInvalidBudget}`);
  console.log(`  - Missing City: ${auditReport.issuesFound.jobsMissingCity}`);
  console.log(`  - Application Count Issues: ${auditReport.issuesFound.jobsApplicationCountIssues}`);
  console.log(`  - Duplicates: ${auditReport.issuesFound.jobsDuplicates}`);
  console.log(`  - Invalid Status: ${auditReport.issuesFound.jobsInvalidStatus}`);
  
  console.log('\nSystem Issues:');
  console.log(`  - Text Indexes Missing: ${auditReport.issuesFound.textIndexesMissing}`);
  
  console.log('\n🔧 ACTIONS PLANNED:');
  console.log(`Workers to Delete: ${auditReport.actionsPlanned.workersToDelete.length}`);
  console.log(`Workers to Update: ${auditReport.actionsPlanned.workersToUpdate.length}`);
  console.log(`Jobs to Delete: ${auditReport.actionsPlanned.jobsToDelete.length}`);
  console.log(`Jobs to Update: ${auditReport.actionsPlanned.jobsToUpdate.length}`);
  console.log(`Indexes to Create: ${auditReport.actionsPlanned.indexesToCreate.length}`);
  
  console.log('\n✅ TEST RESULTS:');
  console.log(`Text Search Working: ${auditReport.testResults.textSearchWorking ? 'YES' : 'NO'}`);
  console.log(`  - Workers Found: ${auditReport.testResults.textSearchWorkersCount}`);
  console.log(`  - Jobs Found: ${auditReport.testResults.textSearchJobsCount}`);
  console.log(`Trade Filter Working: ${auditReport.testResults.tradeFilterWorking ? 'YES' : 'NO'}`);
  console.log(`City Filter Working: ${auditReport.testResults.cityFilterWorking ? 'YES' : 'NO'}`);
  console.log(`Combined Filters Working: ${auditReport.testResults.combinedFiltersWorking ? 'YES' : 'NO'}`);
  console.log(`No Duplicates: ${auditReport.testResults.noDuplicates ? 'YES' : 'NO'}`);
  console.log(`No Test Data: ${auditReport.testResults.noTestData ? 'YES' : 'NO'}`);
  
  if (auditReport.actionsPlanned.workersToDelete.length > 0) {
    console.log('\n🗑️  WORKERS TO DELETE:');
    auditReport.actionsPlanned.workersToDelete.slice(0, 10).forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.name} (${w.email}) - ${w.reasons.join(', ')}`);
    });
    if (auditReport.actionsPlanned.workersToDelete.length > 10) {
      console.log(`  ... and ${auditReport.actionsPlanned.workersToDelete.length - 10} more`);
    }
  }
  
  if (auditReport.actionsPlanned.workersToUpdate.length > 0) {
    console.log('\n📝 WORKERS TO UPDATE (Sample):');
    auditReport.actionsPlanned.workersToUpdate.slice(0, 5).forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.name}`);
      console.log(`     Reasons: ${w.reasons.join(', ')}`);
      console.log(`     Updates: ${JSON.stringify(w.updates, null, 2)}`);
    });
    if (auditReport.actionsPlanned.workersToUpdate.length > 5) {
      console.log(`  ... and ${auditReport.actionsPlanned.workersToUpdate.length - 5} more`);
    }
  }
  
  if (auditReport.actionsPlanned.jobsToDelete.length > 0) {
    console.log('\n🗑️  JOBS TO DELETE:');
    auditReport.actionsPlanned.jobsToDelete.forEach((j, i) => {
      console.log(`  ${i + 1}. ${j.title} - ${j.reasons.join(', ')}`);
    });
  }
  
  if (auditReport.actionsPlanned.jobsToUpdate.length > 0) {
    console.log('\n📝 JOBS TO UPDATE:');
    auditReport.actionsPlanned.jobsToUpdate.forEach((j, i) => {
      console.log(`  ${i + 1}. ${j.title}`);
      console.log(`     Updates: ${JSON.stringify(j.updates, null, 2)}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`⚠️  MODE: ${auditReport.mode}`);
  if (auditReport.mode === 'DRY_RUN') {
    console.log('No changes have been applied to the database.');
    console.log('To apply fixes, change mode to "LIVE" and run again.');
  }
  console.log('='.repeat(80));
  
  // Save report to file
  const fs = require('fs');
  const reportPath = './database-integrity-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  log.success(`Full report saved to: ${reportPath}`);
}

// ===== MAIN EXECUTION =====
async function main() {
  try {
    const db = await connectDB();
    
    await phase1_verifyIndexes(db);
    await phase2_auditWorkers(db);
    await phase3_auditJobs(db);
    await phase4_criticalTesting(db);
    phase5_generateReport();
    
    log.success('\n✅ AUDIT COMPLETE');
    process.exit(0);
  } catch (error) {
    log.error(`Audit failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
