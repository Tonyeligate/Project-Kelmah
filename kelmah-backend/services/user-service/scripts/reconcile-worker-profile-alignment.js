#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { runWorkerProfileAlignmentAudit } = require('../services/workerProfileAlignment.service');

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
    const result = await runWorkerProfileAlignmentAudit({
      apply: APPLY_MODE,
      limit,
      workerId,
      sampleSize: Number.MAX_SAFE_INTEGER,
    });

    console.log(`📊 Found ${result.summary.totalWorkers} worker users to inspect`);
    console.log(`🧪 Mode: ${result.mode}`);

    result.samples.forEach((sample) => {
      console.log(`\n• ${sample.workerName} (${sample.workerId})`);
      if (sample.missingProfile) {
        console.log('  missingProfile: true');
      }
      printEntry('mismatches', sample.mismatches);
      if (Object.keys(sample.userUpdates || {}).length > 0) {
        printEntry('userUpdates', sample.userUpdates);
      }
      if (sample.missingProfile) {
        printEntry('profileCreate', sample.profileCreate);
      } else if (Object.keys(sample.profileUpdates || {}).length > 0) {
        printEntry('profileUpdates', sample.profileUpdates);
      }
    });

    console.log('\n📋 Worker profile alignment summary');
    console.log(JSON.stringify(result.summary, null, 2));
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