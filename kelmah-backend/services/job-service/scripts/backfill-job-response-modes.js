#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * One-time backfill script for canonical job response metadata.
 *
 * Recomputes and stores for each job:
 * - responseMode: 'bids' | 'applications'
 * - responseCount: number
 * - responseCounts: { bids, applications }
 * - compatibility counters used by legacy clients
 *
 * Usage:
 *   node scripts/backfill-job-response-modes.js                  # dry run
 *   node scripts/backfill-job-response-modes.js --apply          # write updates
 *   node scripts/backfill-job-response-modes.js --apply --limit=100
 *   node scripts/backfill-job-response-modes.js --apply --job-id=<jobObjectId>
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, mongoose } = require('../config/db');

const ALLOWED_RESPONSE_MODES = new Set(['bids', 'applications']);

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const hasFlag = (flag) => rawArgs.includes(flag);
  const getOption = (name) => {
    const prefix = `--${name}=`;
    const entry = rawArgs.find((arg) => arg.startsWith(prefix));
    return entry ? entry.slice(prefix.length) : null;
  };

  const limitRaw = getOption('limit');
  const parsedLimit = Number.parseInt(limitRaw, 10);

  return {
    apply: hasFlag('--apply'),
    jobId: getOption('job-id'),
    limit:
      Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : null,
  };
};

const resolveResponseMode = (job, applicationCount, bidCount) => {
  const persistedMode = String(job?.responseMode || '').trim().toLowerCase();
  if (ALLOWED_RESPONSE_MODES.has(persistedMode)) {
    return persistedMode;
  }

  if (job?.biddingEnabled === true || job?.biddingEnabled === 'true') {
    return 'bids';
  }

  if (bidCount > 0 && applicationCount === 0) {
    return 'bids';
  }

  if (applicationCount > 0 && bidCount === 0) {
    return 'applications';
  }

  if (applicationCount > 0 && bidCount > 0) {
    return applicationCount >= bidCount ? 'applications' : 'bids';
  }

  const legacyCurrentBidders = Number(job?.bidding?.currentBidders ?? 0);
  if (Number.isFinite(legacyCurrentBidders) && legacyCurrentBidders > 0) {
    return 'bids';
  }

  return 'applications';
};

const countByJobId = async (collection, match = {}) => {
  const rows = await collection
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: '$job',
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  return new Map(rows.map((row) => [String(row._id), Number(row.count) || 0]));
};

const summarizeCounts = (rows, key) =>
  rows.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0);

async function main() {
  const options = parseArgs();
  const isDryRun = !options.apply;

  await connectDB();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB handle not available after connectDB()');
  }

  const jobsCollection = db.collection('jobs');
  const applicationsCollection = db.collection('applications');
  const bidsCollection = db.collection('bids');

  const filter = {};
  if (options.jobId) {
    if (!mongoose.Types.ObjectId.isValid(options.jobId)) {
      throw new Error(`Invalid --job-id value: ${options.jobId}`);
    }
    filter._id = new mongoose.Types.ObjectId(options.jobId);
  }

  let cursor = jobsCollection.find(filter).project({
    _id: 1,
    title: 1,
    bidding: 1,
    biddingEnabled: 1,
    responseMode: 1,
  });

  if (options.limit) {
    cursor = cursor.limit(options.limit);
  }

  const jobs = await cursor.toArray();
  if (jobs.length === 0) {
    console.log('No jobs found for the selected filter.');
    return;
  }

  const targetedJobIds = jobs.map((job) => job._id).filter(Boolean);

  const [applicationCountMap, bidCountMap, activeBidCountMap] =
    await Promise.all([
      countByJobId(applicationsCollection, { job: { $in: targetedJobIds } }),
      countByJobId(bidsCollection, {
        job: { $in: targetedJobIds },
        status: { $ne: 'withdrawn' },
      }),
      countByJobId(bidsCollection, {
        job: { $in: targetedJobIds },
        status: { $in: ['pending', 'accepted'] },
      }),
    ]);

  const previewRows = [];
  const bulkOperations = [];

  for (const job of jobs) {
    const jobId = String(job._id);
    const applicationCount = Number(applicationCountMap.get(jobId) || 0);
    const bidCount = Number(bidCountMap.get(jobId) || 0);
    const activeBidCount = Number(activeBidCountMap.get(jobId) || 0);

    const responseMode = resolveResponseMode(job, applicationCount, bidCount);
    const responseCount = responseMode === 'bids' ? bidCount : applicationCount;

    const updateFields = {
      responseMode,
      responseCount,
      responseCounts: {
        applications: applicationCount,
        bids: bidCount,
      },
      applicationsCount: applicationCount,
      applicantCount: applicationCount,
      bidCount,
      bidsCount: bidCount,
      proposalCount: responseCount,
      'bidding.currentBidders': activeBidCount,
      updatedAt: new Date(),
    };

    bulkOperations.push({
      updateOne: {
        filter: { _id: job._id },
        update: { $set: updateFields },
      },
    });

    previewRows.push({
      jobId,
      title: job.title || 'Untitled job',
      responseMode,
      responseCount,
      applicationCount,
      bidCount,
      activeBidCount,
    });
  }

  const previewLimit = Math.min(20, previewRows.length);
  console.log(
    JSON.stringify(
      {
        dryRun: isDryRun,
        totalJobsScanned: jobs.length,
        previewed: previewLimit,
        totals: {
          responseCount: summarizeCounts(previewRows, 'responseCount'),
          applications: summarizeCounts(previewRows, 'applicationCount'),
          bids: summarizeCounts(previewRows, 'bidCount'),
          activeBids: summarizeCounts(previewRows, 'activeBidCount'),
        },
        preview: previewRows.slice(0, previewLimit),
      },
      null,
      2,
    ),
  );

  if (isDryRun) {
    console.log('Dry run complete. Re-run with --apply to persist updates.');
    return;
  }

  const result = await jobsCollection.bulkWrite(bulkOperations, {
    ordered: false,
  });

  console.log(
    JSON.stringify(
      {
        applied: true,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error?.message || error);
    if (error?.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore close errors on script shutdown
    }
  });
