#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function main() {
  const repoRoot = process.cwd();
  const gitDir = path.resolve(repoRoot, '.git');

  if (!fs.existsSync(gitDir)) {
    console.log('Hook install skipped: .git directory not found.');
    return;
  }

  const hooksPath = '.githooks';
  const prePushPath = path.resolve(repoRoot, hooksPath, 'pre-push');

  if (!fs.existsSync(prePushPath)) {
    console.log('Hook install skipped: .githooks/pre-push not found.');
    return;
  }

  try {
    cp.execSync(`git config core.hooksPath ${hooksPath}`, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    console.log('Hook install warning: unable to set core.hooksPath.');
    const stderr = error && error.stderr ? String(error.stderr).trim() : '';
    if (stderr) {
      console.log(stderr);
    }
    return;
  }

  try {
    fs.chmodSync(prePushPath, 0o755);
  } catch (_) {
    // Non-fatal on platforms that ignore executable bits.
  }

  console.log('Git hooks installed: core.hooksPath=.githooks');
}

main();
