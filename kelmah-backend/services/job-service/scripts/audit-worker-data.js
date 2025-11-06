#!/usr/bin/env node
/**
 * Database Integrity Audit & Cleanup Script
 * Fixes data inconsistencies in Workers collection
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Override with MongoDB Atlas URI if not in environment
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';
}

const { connectDB, mongoose } = require('../../user-service/config/db');

// Valid trade categories (must match frontend)
const VALID_TRADES = [
  'Electrical Work',
  'Plumbing Services',
  'Carpentry & Woodwork',
  'HVAC & Climate Control',
  'Construction & Building',
  'Painting & Decoration',
  'Roofing Services',
  'Masonry & Stonework',
  'Tiling',
  'Welding',
  'Landscaping',
  'General Construction',
  'Maintenance'
];

// Valid work types (must match frontend)
const VALID_WORK_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Daily Work',
  'Project-based'
];

// Valid Ghana cities
const GHANA_CITIES = [
  'Accra',
  'Kumasi',
  'Tema',
  'Takoradi',
  'Cape Coast',
  'Tamale',
  'Ho',
  'Koforidua',
  'Sekondi-Takoradi',
  'Obuasi',
  'Sunyani',
  'Wa'
];

async function auditWorkers() {
  console.log('\n🔍 STARTING WORKER DATABASE AUDIT');
  console.log('=====================================\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  
  // Get all worker users
  const workers = await usersCol.find({ role: 'worker' }).toArray();
  console.log(`📊 Found ${workers.length} worker accounts\n`);

  const issues = {
    tradeMismatch: [],
    invalidWorkType: [],
    invalidLocation: [],
    ratingIntegrity: [],
    invalidPricing: [],
    missingData: [],
    testData: [],
    newWorkerBadge: [],
    duplicates: [],
    emptySpecializations: []
  };

  for (const worker of workers) {
    const workerId = worker._id;
    const workerName = `${worker.firstName || ''} ${worker.lastName || ''}`.trim();

    // 1. TRADE MISMATCH CHECK
    const primaryTrade = worker.workerProfile?.title || worker.title;
    const specializations = worker.workerProfile?.specializations || worker.specializations || [];
    
    if (primaryTrade && specializations.length > 0) {
      const tradeInSpecializations = specializations.some(spec => 
        spec.toLowerCase().includes(primaryTrade.toLowerCase()) ||
        primaryTrade.toLowerCase().includes(spec.toLowerCase())
      );
      
      if (!tradeInSpecializations) {
        issues.tradeMismatch.push({
          workerId,
          workerName,
          primaryTrade,
          specializations,
          recommendation: 'Set primaryTrade to match first specialization'
        });
      }
    }

    // 2. INVALID WORK TYPE CHECK
    const workType = worker.workerProfile?.workType || worker.workType;
    if (workType && !VALID_WORK_TYPES.includes(workType)) {
      issues.invalidWorkType.push({
        workerId,
        workerName,
        currentWorkType: workType,
        recommendation: 'Map to closest valid work type or set to Full-time'
      });
    }

    // 3. LOCATION DATA VALIDATION
    const city = worker.workerProfile?.city || worker.city || worker.location?.city;
    if (!city || city === '') {
      issues.invalidLocation.push({
        workerId,
        workerName,
        problem: 'Missing city',
        recommendation: 'DELETE or set default city'
      });
    }

    // 4. RATING INTEGRITY CHECK
    const rating = worker.workerProfile?.averageRating || worker.averageRating || 0;
    const reviewCount = worker.workerProfile?.totalReviews || worker.totalReviews || 0;
    
    if (rating < 0 || rating > 5) {
      issues.ratingIntegrity.push({
        workerId,
        workerName,
        invalidRating: rating,
        recommendation: 'Set to 0 or 4.5 default'
      });
    }
    
    if (reviewCount < 0) {
      issues.ratingIntegrity.push({
        workerId,
        workerName,
        invalidReviewCount: reviewCount,
        recommendation: 'Set to 0'
      });
    }

    // 5. PRICING VALIDATION
    const hourlyRate = worker.workerProfile?.hourlyRate || worker.hourlyRate || 0;
    if (hourlyRate <= 0 || hourlyRate > 500) {
      issues.invalidPricing.push({
        workerId,
        workerName,
        invalidRate: hourlyRate,
        recommendation: hourlyRate <= 0 ? 'DELETE or set reasonable default' : 'Flag for review'
      });
    }

    // 6. MISSING ESSENTIAL DATA
    const hasEmail = worker.email && worker.email !== '';
    const hasName = worker.firstName && worker.lastName;
    
    if (!hasEmail || !hasName) {
      issues.missingData.push({
        workerId,
        workerName,
        missingFields: [],
        recommendation: 'DELETE - required fields missing'
      });
      if (!hasEmail) issues.missingData[issues.missingData.length - 1].missingFields.push('email');
      if (!hasName) issues.missingData[issues.missingData.length - 1].missingFields.push('name');
    }

    // 7. TEST/DEMO DATA DETECTION
    const isTestData = 
      workerName.toLowerCase().includes('test') ||
      workerName.toLowerCase().includes('demo') ||
      workerName.toLowerCase().includes('sample') ||
      (worker.email && (worker.email.includes('@test') || worker.email.includes('@example'))) ||
      (hourlyRate === 42 && workerName === 'Test User');
    
    if (isTestData) {
      issues.testData.push({
        workerId,
        workerName,
        email: worker.email,
        hourlyRate,
        recommendation: 'DELETE if not used in tests'
      });
    }

    // 8. NEW WORKER BADGE LOGIC
    const createdAt = worker.createdAt || worker.workerProfile?.createdAt;
    const isNewWorker = worker.workerProfile?.isNewWorker;
    
    if (createdAt && isNewWorker) {
      const accountAge = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAge > 30) {
        issues.newWorkerBadge.push({
          workerId,
          workerName,
          accountAgeDays: Math.floor(accountAge),
          recommendation: 'Set isNewWorker = false'
        });
      }
    }

    // 9. EMPTY SPECIALIZATIONS
    if (!specializations || specializations.length === 0) {
      issues.emptySpecializations.push({
        workerId,
        workerName,
        recommendation: 'Populate from skills OR delete if no skills'
      });
    }
  }

  // 10. DUPLICATE DETECTION (by email)
  const emailCounts = {};
  for (const worker of workers) {
    if (worker.email) {
      emailCounts[worker.email] = (emailCounts[worker.email] || 0) + 1;
    }
  }
  
  for (const [email, count] of Object.entries(emailCounts)) {
    if (count > 1) {
      const duplicateWorkers = workers.filter(w => w.email === email);
      issues.duplicates.push({
        email,
        count,
        workerIds: duplicateWorkers.map(w => w._id),
        workerNames: duplicateWorkers.map(w => `${w.firstName} ${w.lastName}`),
        recommendation: 'MERGE or DELETE duplicates'
      });
    }
  }

  // GENERATE REPORT
  console.log('\n📊 AUDIT RESULTS');
  console.log('=====================================\n');

  const reportIssue = (issueType, issueArray, severity) => {
    if (issueArray.length > 0) {
      console.log(`${severity === 'High' ? '🔴' : severity === 'Medium' ? '🟡' : '🟢'} ${issueType}: ${issueArray.length} issues`);
      console.log(`   Severity: ${severity}`);
      console.log(`   Examples:`);
      issueArray.slice(0, 3).forEach(issue => {
        console.log(`   - ${JSON.stringify(issue, null, 2)}`);
      });
      console.log('');
    }
  };

  reportIssue('Trade Mismatch', issues.tradeMismatch, 'High');
  reportIssue('Invalid Work Type', issues.invalidWorkType, 'High');
  reportIssue('Invalid Location', issues.invalidLocation, 'High');
  reportIssue('Rating Integrity', issues.ratingIntegrity, 'Medium');
  reportIssue('Invalid Pricing', issues.invalidPricing, 'Medium');
  reportIssue('Missing Essential Data', issues.missingData, 'High');
  reportIssue('Test/Demo Data', issues.testData, 'Low');
  reportIssue('New Worker Badge Incorrect', issues.newWorkerBadge, 'Low');
  reportIssue('Empty Specializations', issues.emptySpecializations, 'Medium');
  reportIssue('Duplicate Accounts', issues.duplicates, 'High');

  console.log('\n📈 SUMMARY');
  console.log('=====================================');
  console.log(`Total Workers: ${workers.length}`);
  console.log(`Total Issues Found: ${Object.values(issues).reduce((sum, arr) => sum + arr.length, 0)}`);
  console.log(`Database Health: ${((workers.length - issues.missingData.length - issues.testData.length) / workers.length * 100).toFixed(1)}%`);
  
  return issues;
}

async function fixIssues(issues) {
  console.log('\n🔧 APPLYING FIXES');
  console.log('=====================================\n');

  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  
  let fixedCount = 0;

  // FIX 1: Trade Mismatch
  for (const issue of issues.tradeMismatch) {
    const newTrade = issue.specializations[0];
    await usersCol.updateOne(
      { _id: issue.workerId },
      { $set: { 'workerProfile.title': newTrade } }
    );
    console.log(`✅ Fixed trade mismatch for ${issue.workerName}: ${issue.primaryTrade} → ${newTrade}`);
    fixedCount++;
  }

  // FIX 2: Invalid Work Type
  for (const issue of issues.invalidWorkType) {
    await usersCol.updateOne(
      { _id: issue.workerId },
      { $set: { 'workerProfile.workType': 'Full-time' } }
    );
    console.log(`✅ Fixed work type for ${issue.workerName}: ${issue.currentWorkType} → Full-time`);
    fixedCount++;
  }

  // FIX 3: New Worker Badge
  for (const issue of issues.newWorkerBadge) {
    await usersCol.updateOne(
      { _id: issue.workerId },
      { $set: { 'workerProfile.isNewWorker': false } }
    );
    console.log(`✅ Updated isNewWorker badge for ${issue.workerName}`);
    fixedCount++;
  }

  // FIX 4: Rating Integrity
  for (const issue of issues.ratingIntegrity) {
    const updates = {};
    if (issue.invalidRating !== undefined) {
      updates['workerProfile.averageRating'] = 4.5;
    }
    if (issue.invalidReviewCount !== undefined) {
      updates['workerProfile.totalReviews'] = 0;
    }
    await usersCol.updateOne({ _id: issue.workerId }, { $set: updates });
    console.log(`✅ Fixed ratings for ${issue.workerName}`);
    fixedCount++;
  }

  console.log(`\n✅ Applied ${fixedCount} fixes successfully\n`);

  // WARN about items requiring manual review
  if (issues.missingData.length > 0) {
    console.log(`⚠️  ${issues.missingData.length} workers with missing essential data - MANUAL REVIEW REQUIRED`);
  }
  if (issues.invalidPricing.length > 0) {
    console.log(`⚠️  ${issues.invalidPricing.length} workers with pricing issues - MANUAL REVIEW REQUIRED`);
  }
  if (issues.duplicates.length > 0) {
    console.log(`⚠️  ${issues.duplicates.length} duplicate accounts - MANUAL MERGE/DELETE REQUIRED`);
  }
  if (issues.testData.length > 0) {
    console.log(`⚠️  ${issues.testData.length} test/demo accounts - MANUAL DELETE RECOMMENDED`);
  }
}

async function main() {
  await connectDB();
  console.log('✅ Connected to MongoDB\n');

  try {
    const issues = await auditWorkers();
    
    // Ask for confirmation before applying fixes
    console.log('\n⚠️  Ready to apply auto-fixes?');
    console.log('   - Trade mismatches: auto-fix');
    console.log('   - Invalid work types: auto-fix');
    console.log('   - New worker badges: auto-fix');
    console.log('   - Rating integrity: auto-fix');
    console.log('   - Other issues: require manual review\n');

    // Auto-apply fixes (in production, you'd want confirmation)
    await fixIssues(issues);

    console.log('\n=====================================');
    console.log('✅ Database audit & cleanup complete!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
