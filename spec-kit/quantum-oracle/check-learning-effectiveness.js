#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const parsed = {
    summaryPath: path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', 'learning-ledger-summary.json'),
    minLearningTasks: 1,
    requireSkillEvidence: true,
    strict: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--summary') {
      parsed.summaryPath = path.resolve(argv[i + 1] || parsed.summaryPath);
      i += 1;
    } else if (token === '--min-learning-tasks') {
      parsed.minLearningTasks = Number(argv[i + 1] || parsed.minLearningTasks);
      i += 1;
    } else if (token === '--allow-no-skill-evidence') {
      parsed.requireSkillEvidence = false;
    } else if (token === '--strict') {
      parsed.strict = true;
    }
  }

  return parsed;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`cannot parse JSON at ${filePath}: ${err.message}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(args.summaryPath)) {
    console.error(`Learning Effectiveness Check: FAIL`);
    console.error(`  - Summary file not found: ${args.summaryPath}`);
    process.exit(1);
  }

  const summary = readJson(args.summaryPath);

  if (!Array.isArray(summary.advancedMissingLearningEvidence)) {
    errors.push('advancedMissingLearningEvidence must be an array');
  } else if (summary.advancedMissingLearningEvidence.length > 0) {
    errors.push(`advanced tasks missing learning evidence: ${summary.advancedMissingLearningEvidence.join(', ')}`);
  }

  if (typeof summary.learningEnabledTaskCount !== 'number') {
    errors.push('learningEnabledTaskCount must be a number');
  } else if (summary.learningEnabledTaskCount < args.minLearningTasks) {
    errors.push(`learningEnabledTaskCount (${summary.learningEnabledTaskCount}) is below minimum required (${args.minLearningTasks})`);
  }

  if (!Array.isArray(summary.tasks)) {
    errors.push('tasks must be an array');
  } else {
    const learningTasks = summary.tasks.filter((t) => t && t.requiresLearningOracle === true);

    learningTasks.forEach((task) => {
      const taskId = task.taskId || 'unknown-task';

      if ((task.mistakesCount || 0) < 1) {
        errors.push(`${taskId}: mistakesCount must be >= 1`);
      }
      if ((task.preventiveRulesCount || 0) < 1) {
        errors.push(`${taskId}: preventiveRulesCount must be >= 1`);
      }
      if ((task.oracleImprovementsCount || 0) < 1) {
        errors.push(`${taskId}: oracleImprovementsCount must be >= 1`);
      }
      if ((task.realWorldSignalsCount || 0) < 1) {
        errors.push(`${taskId}: realWorldSignalsCount must be >= 1`);
      }
      if ((task.policyAdjustmentsCount || 0) < 1) {
        errors.push(`${taskId}: policyAdjustmentsCount must be >= 1`);
      }

      if (args.requireSkillEvidence) {
        if ((task.skillAcquisitionsCount || 0) < 1) {
          errors.push(`${taskId}: skillAcquisitionsCount must be >= 1`);
        }
        if ((task.skillTransferEvidenceCount || 0) < 1) {
          errors.push(`${taskId}: skillTransferEvidenceCount must be >= 1`);
        }
      }
    });

    if (learningTasks.length === 0) {
      warnings.push('No learning-enabled tasks detected in summary');
    }
  }

  const trends = summary.trends || {};
  if (!Array.isArray(trends.topRecurringMistakes) || trends.topRecurringMistakes.length === 0) {
    errors.push('topRecurringMistakes trend must be non-empty');
  }
  if (!Array.isArray(trends.topPolicyAdjustments) || trends.topPolicyAdjustments.length === 0) {
    errors.push('topPolicyAdjustments trend must be non-empty');
  }
  if (args.requireSkillEvidence) {
    if (!Array.isArray(trends.topSkillAcquisitions) || trends.topSkillAcquisitions.length === 0) {
      errors.push('topSkillAcquisitions trend must be non-empty');
    }
  }

  if (args.strict && warnings.length > 0) {
    errors.push(`strict mode enabled and warnings present: ${warnings.length}`);
  }

  if (errors.length > 0) {
    console.error('Learning Effectiveness Check: FAIL');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Learning Effectiveness Check: PASS');
  console.log(`Summary: ${args.summaryPath}`);
  if (warnings.length > 0) {
    warnings.forEach((w) => console.log(`WARN: ${w}`));
  }
}

main();
