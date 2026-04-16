#!/usr/bin/env node

const fs = require('fs');
const cp = require('child_process');
const http = require('http');
const https = require('https');

const ZERO_SHA = '0000000000000000000000000000000000000000';
const UI_PORT = process.env.UI_AUDIT_PORT || '4173';

function run(command, options = {}) {
  return cp.execSync(command, {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...options,
  });
}

function runChecked(command, label) {
  try {
    cp.execSync(command, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error,
      label,
    };
  }
}

function parseCliArgs(argv) {
  const parsed = {
    changedFiles: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--changed-files') {
      parsed.changedFiles = argv[i + 1] || '';
      i += 1;
    }
  }

  return parsed;
}

function parseRefUpdatesFromStdin() {
  if (process.stdin.isTTY) {
    return [];
  }

  let input = '';
  try {
    const stdinStats = fs.fstatSync(0);
    const hasPipeInput =
      (typeof stdinStats.isFIFO === 'function' && stdinStats.isFIFO()) ||
      (typeof stdinStats.isFile === 'function' && stdinStats.isFile());

    if (!hasPipeInput) {
      return [];
    }

    input = fs.readFileSync(0, 'utf8');
  } catch (_) {
    return [];
  }

  if (!input.trim()) {
    return [];
  }

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
      return { localRef, localSha, remoteRef, remoteSha };
    })
    .filter((ref) => ref.localSha && ref.remoteSha);
}

function collectChangedFilesFromRefs(refUpdates) {
  const changed = new Set();

  for (const ref of refUpdates) {
    if (ref.localSha === ZERO_SHA) {
      continue;
    }

    let diffOutput = '';

    try {
      if (ref.remoteSha === ZERO_SHA) {
        diffOutput = run(`git diff-tree --no-commit-id --name-only -r ${ref.localSha}`);
      } else {
        diffOutput = run(`git diff --name-only ${ref.remoteSha}..${ref.localSha}`);
      }
    } catch (_) {
      diffOutput = '';
    }

    diffOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((file) => changed.add(file));
  }

  return Array.from(changed);
}

function collectFallbackChangedFiles() {
  const candidates = [
    'git diff --name-only --cached',
    'git diff --name-only HEAD~1..HEAD',
  ];

  for (const command of candidates) {
    try {
      const output = run(command);
      const files = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (files.length > 0) {
        return files;
      }
    } catch (_) {
      // continue
    }
  }

  return [];
}

function isUiRelevant(filePath) {
  if (!filePath) return false;

  return (
    filePath.startsWith('kelmah-frontend/src/') ||
    filePath === '.claude/agents/frontend.agent.md' ||
    filePath === '.claude/agents/claudecode.agent.md' ||
    filePath.startsWith('kelmah-frontend/scripts/ui_') ||
    filePath.startsWith('kelmah-frontend/src/theme/') ||
    filePath.startsWith('kelmah-frontend/src/modules/layout/') ||
    filePath.startsWith('kelmah-frontend/src/pages/')
  );
}

function toFrontendRelative(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('kelmah-frontend/')) {
    return filePath.slice('kelmah-frontend/'.length);
  }
  if (filePath.startsWith('src/')) {
    return filePath;
  }
  return null;
}

function waitForServer(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const client = url.startsWith('https:') ? https : http;

    const attempt = () => {
      const req = client.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(attempt, 1000);
      });

      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(attempt, 1000);
      });

      req.setTimeout(5000, () => {
        req.destroy();
      });
    };

    attempt();
  });
}

async function main() {
  const cli = parseCliArgs(process.argv);
  const refUpdates = parseRefUpdatesFromStdin();

  let changedFiles = [];

  if (cli.changedFiles) {
    changedFiles = String(cli.changedFiles)
      .split(',')
      .map((line) => line.trim())
      .filter(Boolean);
  } else {
    changedFiles = collectChangedFilesFromRefs(refUpdates);
    if (changedFiles.length === 0) {
      changedFiles = collectFallbackChangedFiles();
    }
  }

  const uiRelevant = changedFiles.filter(isUiRelevant);
  if (uiRelevant.length === 0) {
    console.log('UI pre-push gate: no relevant UI changes detected, skipping.');
    return;
  }

  console.log(`UI pre-push gate: checking ${uiRelevant.length} relevant file(s).`);

  const frontendFiles = uiRelevant
    .map(toFrontendRelative)
    .filter(Boolean)
    .filter((file) => file.startsWith('src/'));

  if (frontendFiles.length > 0) {
    const remediate = runChecked(
      `npm --prefix kelmah-frontend run ui:auto-remediate -- --files "${frontendFiles.join(',')}" --apply --fail-on-change`,
      'ui auto-remediation'
    );

    if (!remediate.ok) {
      console.error('UI pre-push gate: auto-remediation applied safe fixes.');
      console.error('Please review, stage, and commit the remediation changes before pushing.');
      process.exit(1);
    }
  }

  const externalBaseUrl = process.env.UI_AUDIT_BASE_URL;
  const baseUrl = externalBaseUrl || `http://127.0.0.1:${UI_PORT}`;
  let previewProc = null;

  try {
    if (!externalBaseUrl) {
      const build = runChecked('npm --prefix kelmah-frontend run build', 'frontend build for pre-push audit');
      if (!build.ok) {
        console.error('UI pre-push gate: frontend build failed.');
        process.exit(1);
      }

      previewProc = cp.spawn(
        'npm',
        ['--prefix', 'kelmah-frontend', 'run', 'preview', '--', '--host', '127.0.0.1', '--port', String(UI_PORT)],
        {
          cwd: process.cwd(),
          stdio: 'ignore',
          shell: true,
          env: process.env,
        }
      );

      await waitForServer(baseUrl, 120000);
    }

    const ensureBaselines = runChecked(
      `npm --prefix kelmah-frontend run ui:pack:ensure-baselines -- --pack core-public --base-url ${baseUrl}`,
      'ensure baseline pack'
    );

    if (!ensureBaselines.ok) {
      console.error('UI pre-push gate: baseline pack generation failed.');
      process.exit(1);
    }

    const taskId = `pre-push-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const compare = runChecked(
      `npm --prefix kelmah-frontend run ui:pack:compare -- --pack core-public --task-id ${taskId} --base-url ${baseUrl} --strict true`,
      'route pack compare'
    );

    if (!compare.ok) {
      console.error('UI pre-push gate: visual regression checks failed. Push blocked.');
      process.exit(1);
    }

    console.log('UI pre-push gate: PASS');
  } finally {
    if (previewProc && !previewProc.killed) {
      previewProc.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  console.error('UI pre-push gate: FAIL');
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
