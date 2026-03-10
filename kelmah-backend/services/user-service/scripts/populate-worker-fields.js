/**
 * Explicit maintenance script to backfill safe worker defaults.
 *
 * This script is intentionally separated from public read controllers so
 * profile reads never mutate MongoDB. It defaults to dry-run mode and only
 * writes operationally safe fields when --apply is provided.
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { ensureConnection } = require('../config/db');
const modelsModule = require('../models');

const APPLY_MODE = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const workerIdArg = process.argv.find((arg) => arg.startsWith('--worker-id='));
const limit = limitArg ? Math.max(1, Number.parseInt(limitArg.split('=')[1], 10) || 0) : null;
const workerId = workerIdArg ? workerIdArg.split('=')[1] : null;

const buildSafeWorkerDefaults = (worker) => {
  const updates = {};

  if (worker.rating === undefined || worker.rating === null) {
    updates.rating = 0;
  }

  if (worker.totalReviews === undefined || worker.totalReviews === null) {
    updates.totalReviews = 0;
  }

  if (worker.totalJobsCompleted === undefined || worker.totalJobsCompleted === null) {
    updates.totalJobsCompleted = 0;
  }

  if ((worker.hourlyRate !== undefined && worker.hourlyRate !== null) && !worker.currency) {
    updates.currency = 'GHS';
  }

  if (worker.isVerified === undefined || worker.isVerified === null) {
    updates.isVerified = false;
  }

  return updates;
};

async function populateWorkerFields() {
  try {
    console.log('🔗 Ensuring user-service MongoDB connection...');
    await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });

    if (typeof modelsModule.loadModels === 'function') {
      modelsModule.loadModels();
    }

    const User = modelsModule.User;
    if (!User) {
      throw new Error('User model not initialized');
    }

    const query = {
      role: 'worker',
      isActive: { $ne: false },
    };

    if (workerId) {
      query._id = workerId;
    }

    let workerQuery = User.find(query).sort({ updatedAt: -1 });
    if (limit) {
      workerQuery = workerQuery.limit(limit);
    }

    const workers = await workerQuery.lean();
    console.log(`📊 Found ${workers.length} workers to inspect`);
    console.log(`🧪 Mode: ${APPLY_MODE ? 'apply' : 'dry-run'}`);

    let updateCount = 0;

    for (const worker of workers) {
      const updates = buildSafeWorkerDefaults(worker);
      if (Object.keys(updates).length === 0) {
        continue;
      }

      const workerName = `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || worker._id;
      console.log(`• ${workerName}: ${JSON.stringify(updates)}`);

      if (APPLY_MODE) {
        await User.updateOne({ _id: worker._id }, { $set: updates });
        updateCount += 1;
      }
    }

    console.log(
      APPLY_MODE
        ? `🎉 Applied safe defaults to ${updateCount} workers`
        : 'ℹ️ Dry run complete. Re-run with --apply to persist these updates.',
    );
  } catch (error) {
    console.error('❌ Error updating workers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

populateWorkerFields();
