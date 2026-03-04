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

const { MongoClient } = require('mongodb');

// --- Connection string (same DB used by all services)
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

const DB_NAME = 'kelmah_platform';
const COLLECTION = 'jobs';

async function run() {
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
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('\nConnection closed.');
  }
}

run();
