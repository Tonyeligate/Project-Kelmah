/**
 * Migration Script: Fix missing/null visibility on Job documents
 *
 * Problem: Jobs seeded or inserted via the direct MongoDB driver bypass
 * Mongoose schema defaults, leaving `visibility` as null or missing entirely.
 * The public /api/jobs endpoint now queries with a tolerant $or filter, but
 * running this migration ensures every document is clean and consistent.
 *
 * What it does:
 *   - Finds all Job documents where visibility is null, undefined, or missing
 *   - Sets visibility to 'public' on each matching document
 *   - Reports how many documents were updated
 *
 * Usage:
 *   node kelmah-backend/scripts/migrate-job-visibility.js
 *
 * Safe to run multiple times (idempotent).
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

// --- Connection string (same DB used by all services)
// Priority: CLI arg (--uri=...) > env var (MONGODB_URI)
const cliUriArg = process.argv.find((arg) => arg.startsWith('--uri='));
const MONGODB_URI = cliUriArg ? cliUriArg.replace('--uri=', '') : process.env.MONGODB_URI;

const DB_NAME = 'kelmah_platform';
const COLLECTION = 'jobs';

async function run() {
  if (!MONGODB_URI) {
    console.error('❌ Migration failed: MONGODB_URI is not set.');
    console.error('Set MONGODB_URI in kelmah-backend/.env or pass --uri="<mongodb-uri>".');
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected\n');

    const db = client.db(DB_NAME);
    const jobs = db.collection(COLLECTION);

    // --- 1. Count affected documents ---
    const affectedCount = await jobs.countDocuments({
      $or: [
        { visibility: { $exists: false } },
        { visibility: null },
        { visibility: '' },
      ],
    });

    console.log(`Found ${affectedCount} job(s) with missing/null visibility.`);

    if (affectedCount === 0) {
      console.log('Nothing to migrate. All jobs already have visibility set.');
      return;
    }

    // --- 2. Also report current distribution ---
    const visibilityCounts = await jobs
      .aggregate([
        { $group: { _id: '$visibility', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    console.log('\nCurrent visibility distribution (before migration):');
    for (const row of visibilityCounts) {
      console.log(`  ${JSON.stringify(row._id)}: ${row.count}`);
    }

    // --- 3. Run the update ---
    console.log('\nRunning migration...');
    const result = await jobs.updateMany(
      {
        $or: [
          { visibility: { $exists: false } },
          { visibility: null },
          { visibility: '' },
        ],
      },
      { $set: { visibility: 'public' } },
    );

    console.log(
      `✅ Migration complete: updated ${result.modifiedCount} document(s).`,
    );

    // --- 4. Confirm post-migration state ---
    const postCounts = await jobs
      .aggregate([
        { $group: { _id: '$visibility', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    console.log('\nVisibility distribution after migration:');
    for (const row of postCounts) {
      console.log(`  ${JSON.stringify(row._id)}: ${row.count}`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (String(err.message).includes('querySrv') || String(err.message).includes('ECONNREFUSED')) {
      console.error('Hint: this looks like DNS/network access to MongoDB Atlas failing from this machine.');
      console.error('Try one of these:');
      console.error('  1) Confirm internet + DNS is available from this environment');
      console.error('  2) Use a reachable URI via --uri="<mongodb-uri>"');
      console.error('  3) Run this script from your backend host/server where Atlas is reachable');
    }
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('\nConnection closed.');
  }
}

run();
