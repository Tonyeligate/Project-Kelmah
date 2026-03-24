#!/usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const parsed = {
    prTitle: null,
    prBody: null,
    prBodyFile: null,
    labelsJson: '[]',
    changedFiles: null,
    skipPrGate: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--pr-title') {
      parsed.prTitle = argv[i + 1] || null;
      i += 1;
    } else if (token === '--pr-body') {
      parsed.prBody = argv[i + 1] || null;
      i += 1;
    } else if (token === '--pr-body-file') {
      parsed.prBodyFile = argv[i + 1] || null;
      i += 1;
    } else if (token === '--labels-json') {
      parsed.labelsJson = argv[i + 1] || '[]';
      i += 1;
    } else if (token === '--changed-files') {
      parsed.changedFiles = argv[i + 1] || null;
      i += 1;
    } else if (token === '--skip-pr-gate') {
      parsed.skipPrGate = true;
    }
  }

  return parsed;
}

function run(command) {
  return cp.execSync(command, {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
}

function readBodyArg(args) {
  if (args.prBody) {
    return args.prBody;
  }
  if (args.prBodyFile) {
    const bodyPath = path.resolve(args.prBodyFile);
    return fs.readFileSync(bodyPath, 'utf8');
  }
  return null;
}

function collectChangedFiles(rawChanged) {
  if (rawChanged) {
    return String(rawChanged)
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
  }

  const out = run('git diff --name-only HEAD').trim();
  if (!out) {
    return [];
  }
  return out
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter(Boolean);
}

function collectBundleIds(changedFiles) {
  const ids = new Set();
  changedFiles.forEach((file) => {
    const m = file.match(/^spec-kit\/quantum-oracle\/([^/]+)\//);
    if (!m) {
      return;
    }
    const id = m[1];
    if (id === 'templates' || id === 'examples') {
      return;
    }
    ids.add(id);
  });
  return Array.from(ids);
}

function runChecked(command, description) {
  try {
    const out = run(command);
    if (out && out.trim()) {
      console.log(out.trim());
    }
    return { ok: true, output: out || '' };
  } catch (err) {
    const stdout = err && err.stdout ? String(err.stdout) : '';
    const stderr = err && err.stderr ? String(err.stderr) : '';
    const output = `${stdout}\n${stderr}`.trim();
    console.error(`FAILED: ${description}`);
    if (output) {
      console.error(output);
    }
    return { ok: false, output };
  }
}

function runPrGate(prTitle, prBody, labelsJson, changedFilesArg) {
  try {
    const out = cp.execFileSync(
      'node',
      [
        'spec-kit/quantum-oracle/check-pr-closure-gate.js',
        '--pr-title',
        prTitle,
        '--pr-body',
        prBody,
        '--labels-json',
        labelsJson || '[]',
        '--changed-files',
        changedFilesArg || '',
      ],
      {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      },
    );

    if (out && out.trim()) {
      console.log(out.trim());
    }
    return { ok: true, output: out || '' };
  } catch (err) {
    const stdout = err && err.stdout ? String(err.stdout) : '';
    const stderr = err && err.stderr ? String(err.stderr) : '';
    const output = `${stdout}\n${stderr}`.trim();
    console.error('FAILED: PR closure gate');
    if (output) {
      console.error(output);
    }
    return { ok: false, output };
  }
}

function main() {
  const args = parseArgs(process.argv);
  const errors = [];

  console.log('Quantum Pre-PR Gate: start');

  const changedFiles = collectChangedFiles(args.changedFiles);
  const changedFilesArg = changedFiles.join(',');
  const bundleIds = collectBundleIds(changedFiles);

  console.log(`Changed files detected: ${changedFiles.length}`);
  console.log(`Oracle bundles detected: ${bundleIds.length ? bundleIds.join(', ') : 'none'}`);

  const learningResult = runChecked('node spec-kit/quantum-oracle/aggregate-learning-ledger.js', 'aggregate learning ledger');
  if (!learningResult.ok) {
    errors.push('learning ledger aggregation failed');
  } else {
    const summaryPath = path.resolve('spec-kit/quantum-oracle/learning-ledger-summary.json');
    try {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      const missing = Array.isArray(summary.advancedMissingLearningEvidence)
        ? summary.advancedMissingLearningEvidence
        : [];
      if (missing.length > 0) {
        errors.push(`advanced tasks missing learning evidence: ${missing.join(', ')}`);
      }
    } catch (err) {
      errors.push(`cannot parse learning-ledger-summary.json: ${err.message}`);
    }
  }

  const learningEffectivenessResult = runChecked(
    'node spec-kit/quantum-oracle/check-learning-effectiveness.js --strict',
    'check learning effectiveness',
  );
  if (!learningEffectivenessResult.ok) {
    errors.push('learning effectiveness validation failed');
  }

  const intelligenceReportResult = runChecked(
    'node spec-kit/quantum-oracle/generate-agent-intelligence-report.js',
    'generate agent intelligence report',
  );
  if (!intelligenceReportResult.ok) {
    errors.push('agent intelligence report generation failed');
  }

  const intelligenceCheckResult = runChecked(
    'node spec-kit/quantum-oracle/check-agent-intelligence-report.js',
    'check agent intelligence report',
  );
  if (!intelligenceCheckResult.ok) {
    errors.push('agent intelligence report validation failed');
  }

  bundleIds.forEach((taskId) => {
    const cmd = `node spec-kit/quantum-oracle/check-completion-oracle.js --task-id ${taskId} --strict`;
    const result = runChecked(cmd, `strict completion oracle for ${taskId}`);
    if (!result.ok) {
      errors.push(`strict completion oracle failed for ${taskId}`);
    }
  });

  if (!args.skipPrGate) {
    const prBody = readBodyArg(args);
    if (!args.prTitle || !prBody) {
      errors.push('PR gate requires --pr-title and (--pr-body or --pr-body-file), or pass --skip-pr-gate');
    } else {
      const prGateResult = runPrGate(args.prTitle, prBody, String(args.labelsJson || '[]'), changedFilesArg);
      if (!prGateResult.ok) {
        errors.push('PR closure gate failed');
      }
    }
  }

  if (errors.length > 0) {
    console.error('Quantum Pre-PR Gate: FAIL');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Quantum Pre-PR Gate: PASS');
}

main();
