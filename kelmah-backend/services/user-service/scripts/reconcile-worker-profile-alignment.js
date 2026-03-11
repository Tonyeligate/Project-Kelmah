#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { ensureConnection } = require('../config/db');
const modelsModule = require('../models');
const { calculateWorkerProfileAlignment } = require('../../../shared/utils/workerProfileAlignment');

const APPLY_MODE = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const workerIdArg = process.argv.find((arg) => arg.startsWith('--worker-id='));
const limit = limitArg ? Math.max(1, Number.parseInt(limitArg.split('=')[1], 10) || 0) : null;
const workerId = workerIdArg ? workerIdArg.split('=')[1] : null;

const printEntry = (title, value) => {
  console.log(`  ${title}: ${JSON.stringify(value)}`);
};

async function main() {
  try {
    console.log('🔗 Ensuring user-service MongoDB connection...');
    await ensureConnection({ timeoutMs: Number(process.env.DB_READY_TIMEOUT_MS || 30000) });

    if (typeof modelsModule.loadModels === 'function') {
      modelsModule.loadModels();
    }

    const { User, WorkerProfile } = modelsModule;
    if (!User || !WorkerProfile) {
      throw new Error('User or WorkerProfile model not initialized');
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
    const workerIds = workers.map((worker) => worker._id);
    const profiles = await WorkerProfile.find({ userId: { $in: workerIds } }).lean();
    const profilesByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    const summary = {
      totalWorkers: workers.length,
      inspectedProfiles: profiles.length,
      missingProfiles: 0,
      mismatchedFields: {
        profession: 0,
        bio: 0,
        skills: 0,
        specializations: 0,
      },
      workersNeedingChanges: 0,
      userUpdates: 0,
      profileUpdates: 0,
      profilesCreated: 0,
    };

    console.log(`📊 Found ${workers.length} worker users to inspect`);
    console.log(`🧪 Mode: ${APPLY_MODE ? 'apply' : 'dry-run'}`);

    for (const worker of workers) {
      const profile = profilesByUserId.get(String(worker._id)) || null;
      const alignment = calculateWorkerProfileAlignment(worker, profile);

      if (!alignment.hasChanges) {
        continue;
      }

      summary.workersNeedingChanges += 1;
      if (alignment.missingProfile) {
        summary.missingProfiles += 1;
      }

      Object.entries(alignment.mismatches).forEach(([field, hasMismatch]) => {
        if (hasMismatch) {
          summary.mismatchedFields[field] += 1;
        }
      });

      summary.userUpdates += Object.keys(alignment.userUpdates).length;
      summary.profileUpdates += Object.keys(alignment.profileUpdates).length;
      if (alignment.missingProfile) {
        summary.profilesCreated += 1;
      }

      const workerName = `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || String(worker._id);
      console.log(`\n• ${workerName} (${worker._id})`);
      if (alignment.missingProfile) {
        console.log('  missingProfile: true');
      }
      printEntry('mismatches', alignment.mismatches);
      if (Object.keys(alignment.userUpdates).length > 0) {
        printEntry('userUpdates', alignment.userUpdates);
      }
      if (alignment.missingProfile) {
        printEntry('profileCreate', alignment.profileCreate);
      } else if (Object.keys(alignment.profileUpdates).length > 0) {
        printEntry('profileUpdates', alignment.profileUpdates);
      }

      if (APPLY_MODE) {
        if (Object.keys(alignment.userUpdates).length > 0) {
          await User.updateOne({ _id: worker._id }, { $set: alignment.userUpdates });
        }

        if (alignment.missingProfile) {
          await WorkerProfile.create(alignment.profileCreate);
        } else if (Object.keys(alignment.profileUpdates).length > 0) {
          await WorkerProfile.updateOne({ userId: worker._id }, { $set: alignment.profileUpdates });
        }
      }
    }

    console.log('\n📋 Worker profile alignment summary');
    console.log(JSON.stringify(summary, null, 2));
    if (!APPLY_MODE) {
      console.log('ℹ️ Dry run complete. Re-run with --apply to persist the reconciliation.');
    }
  } catch (error) {
    console.error('❌ Worker profile alignment repair failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();