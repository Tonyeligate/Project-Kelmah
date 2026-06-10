#!/usr/bin/env node
/**
 * Compute platform statistics for Jobs page widgets
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, mongoose } = require('../config/db');

async function main() {
  await connectDB();
  // Use native driver to avoid any model buffering issues
  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');
  const usersCol = db.collection('users');

  const now = new Date();
  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [availableJobs, activeEmployersAgg, skilledWorkers] = await Promise.all([
    jobsCol.countDocuments({ status: 'open', expiresAt: { $gt: now } }),
    jobsCol.aggregate([
      { $match: { createdAt: { $gte: THIRTY_DAYS_AGO }, status: { $in: ['open','in-progress','completed'] } } },
      { $group: { _id: '$hirer' } },
      { $count: 'count' }
    ]).toArray(),
    usersCol.countDocuments({ role: 'worker', isActive: true })
  ]);

  // Success rate approximation from completed vs cancelled jobs
  const [completed, cancelled] = await Promise.all([
    jobsCol.countDocuments({ status: 'completed' }),
    jobsCol.countDocuments({ status: 'cancelled' })
  ]);

  const denom = completed + cancelled;
  const successRate = denom > 0 ? Math.round((completed / denom) * 1000) / 10 : 0; // percentage with 0.1 precision

  const stats = {
    availableJobs,
    activeEmployers: activeEmployersAgg?.[0]?.count || 0,
    skilledWorkers,
    successRate, // percentage
    generatedAt: new Date().toISOString()
  };

  console.log(JSON.stringify(stats, null, 2));
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Stats computation failed:', err);
  process.exit(1);
});


