#!/usr/bin/env node
/**
 * Audit Job Ownership
 * Verifies that all jobs have valid hirer (owner) references
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, mongoose } = require('../config/db');

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');
  const usersCol = db.collection('users');

  const jobs = await jobsCol.find({}).toArray();
  const report = {
    totalJobs: jobs.length,
    jobsWithHirer: 0,
    jobsWithoutHirer: 0,
    jobsWithInvalidHirer: 0,
    orphanedJobs: [],
    hirerStats: {}
  };

  for (const job of jobs) {
    if (!job.hirer) {
      report.jobsWithoutHirer += 1;
      report.orphanedJobs.push({
        jobId: job._id.toString(),
        title: job.title || 'Untitled',
        reason: 'Missing hirer field'
      });
      continue;
    }

    report.jobsWithHirer += 1;

    // Check if hirer exists in users collection
    try {
      const hirerId = typeof job.hirer === 'string' 
        ? new mongoose.Types.ObjectId(job.hirer)
        : job.hirer;
      
      const hirer = await usersCol.findOne({ _id: hirerId });
      
      if (!hirer) {
        report.jobsWithInvalidHirer += 1;
        report.orphanedJobs.push({
          jobId: job._id.toString(),
          title: job.title || 'Untitled',
          hirerId: String(job.hirer),
          reason: 'Hirer reference does not exist in users collection'
        });
      } else {
        // Track hirer stats
        const hirerKey = String(job.hirer);
        if (!report.hirerStats[hirerKey]) {
          report.hirerStats[hirerKey] = {
            hirerId: hirerKey,
            hirerName: `${hirer.firstName || ''} ${hirer.lastName || ''}`.trim() || hirer.email || 'Unknown',
            hirerEmail: hirer.email || 'N/A',
            hirerRole: hirer.role || 'N/A',
            jobCount: 0,
            jobIds: []
          };
        }
        report.hirerStats[hirerKey].jobCount += 1;
        report.hirerStats[hirerKey].jobIds.push(job._id.toString());
      }
    } catch (error) {
      report.jobsWithInvalidHirer += 1;
      report.orphanedJobs.push({
        jobId: job._id.toString(),
        title: job.title || 'Untitled',
        hirerId: String(job.hirer),
        reason: `Invalid hirer reference: ${error.message}`
      });
    }
  }

  console.log('=== Job Ownership Audit Report ===');
  console.log(JSON.stringify(report, null, 2));
  
  if (report.orphanedJobs.length > 0) {
    console.log('\n⚠️  WARNING: Found orphaned jobs without valid owners!');
    console.log('Consider running the cleaner with --fix-orphaned flag to handle these.');
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

