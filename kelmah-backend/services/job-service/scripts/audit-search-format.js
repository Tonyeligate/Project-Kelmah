#!/usr/bin/env node
/**
 * Audit Search Response Format
 * Verifies that search endpoints return data in the format expected by frontend
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, mongoose } = require('../config/db');

// Expected frontend fields (from jobsService.js transformJobListItem)
const REQUIRED_FIELDS = [
  'id', '_id',
  'title',
  'description',
  'category',
  'budget', // Should be object: { min, max, type, amount, currency }
  'location',
  'skills',
  'employer', // Should have: name, logo, verified, rating, id
  'hirer_name', // String fallback
  'created_at', 'createdAt', 'postedDate',
  'deadline', 'endDate',
  'status',
  'paymentType',
  'currency'
];

const OPTIONAL_FIELDS = [
  'hirer', // Full object
  'proposalCount',
  'viewCount',
  'rating',
  'urgent',
  'verified',
  'duration'
];

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');
  const usersCol = db.collection('users');

  // Get a sample job
  const sampleJob = await jobsCol.findOne({ status: 'open' });
  
  if (!sampleJob) {
    console.log('⚠️ No open jobs found to audit');
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log('=== Search Format Audit ===\n');
  console.log('Sample Job from DB:', JSON.stringify(sampleJob, null, 2).substring(0, 500) + '...\n');

  // Check what fields are present
  const report = {
    sampleJobId: sampleJob._id.toString(),
    dbFields: Object.keys(sampleJob),
    missingRequired: [],
    missingOptional: [],
    formatIssues: [],
    recommendations: []
  };

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!(field in sampleJob)) {
      report.missingRequired.push(field);
    }
  });

  // Check format issues
  if (sampleJob.budget && typeof sampleJob.budget !== 'object') {
    report.formatIssues.push('budget should be object { min, max, type, amount, currency }');
  }

  if (sampleJob.hirer && typeof sampleJob.hirer === 'string') {
    report.formatIssues.push('hirer should be populated object, not ObjectId string');
  }

  if (!sampleJob.hirer_name && !sampleJob.employerName) {
    report.formatIssues.push('Missing hirer_name or employerName for frontend display');
  }

  if (!sampleJob.salary && !sampleJob.budget) {
    report.formatIssues.push('Missing salary or budget field');
  }

  // Recommendations
  if (report.missingRequired.length > 0) {
    report.recommendations.push('Add transformation layer in search endpoints to include all required fields');
  }

  if (report.formatIssues.length > 0) {
    report.recommendations.push('Standardize response format across all search endpoints');
    report.recommendations.push('Ensure advancedJobSearch returns same format as getJobs');
  }

  console.log('Audit Report:', JSON.stringify(report, null, 2));

  // Check if hirer is populated
  if (sampleJob.hirer) {
    const hirerId = typeof sampleJob.hirer === 'string' 
      ? new mongoose.Types.ObjectId(sampleJob.hirer)
      : sampleJob.hirer;
    const hirer = await usersCol.findOne({ _id: hirerId });
    if (hirer) {
      console.log('\n✅ Hirer exists in users collection');
      console.log('Hirer name:', `${hirer.firstName || ''} ${hirer.lastName || ''}`.trim());
    } else {
      console.log('\n⚠️ Hirer reference invalid');
    }
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

