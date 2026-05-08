#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  DEFAULT_REGISTRY_PATH,
  buildCapabilityRegistry,
  writeCapabilityRegistry,
} = require('./capability-registry');
const {
  DEFAULT_MANIFEST_PATH,
  buildClaudeCapabilityManifest,
  writeClaudeCapabilityManifest,
} = require('./claude-manifest');

function parseArgs(argv) {
  const parsed = {
    registryPath: DEFAULT_REGISTRY_PATH,
    manifestPath: DEFAULT_MANIFEST_PATH,
    check: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--registry') {
      parsed.registryPath = path.resolve(argv[i + 1] || parsed.registryPath);
      i += 1;
    } else if (token === '--manifest') {
      parsed.manifestPath = path.resolve(argv[i + 1] || parsed.manifestPath);
      i += 1;
    } else if (token === '--check') {
      parsed.check = true;
    }
  }

  return parsed;
}

function canonicalize(obj) {
  return JSON.stringify(obj, null, 2);
}

function comparableManifest(manifest) {
  return {
    ...manifest,
    generatedAtUtc: null,
    sourceRegistryGeneratedAtUtc: null,
  };
}

function main() {
  const args = parseArgs(process.argv);

  if (!args.check) {
    const registry = writeCapabilityRegistry(args.registryPath);
    const manifest = writeClaudeCapabilityManifest(registry, args.manifestPath);
    console.log('Capability Registry Sync: PASS');
    console.log(`Path: ${args.registryPath}`);
    console.log(`Manifest: ${args.manifestPath}`);
    console.log(`Unique tools: ${registry.summary.uniqueToolCount}`);
    console.log(`Quantum-computing tools: ${registry.summary.quantumComputingToolCount}`);
    console.log(`Manifest operations: ${manifest.summary.operationCount}`);
    return;
  }

  const computed = buildCapabilityRegistry();
  const computedManifest = buildClaudeCapabilityManifest(computed);

  if (!fs.existsSync(args.registryPath)) {
    console.error('Capability Registry Check: FAIL');
    console.error(`  - Missing registry file: ${args.registryPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(args.manifestPath)) {
    console.error('Capability Registry Check: FAIL');
    console.error(`  - Missing .claude manifest file: ${args.manifestPath}`);
    console.error('  - Run: node spec-kit/quantum-runtime/sync-capability-registry.js');
    process.exit(1);
  }

  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(args.registryPath, 'utf8'));
  } catch (error) {
    console.error('Capability Registry Check: FAIL');
    console.error(`  - Invalid registry JSON: ${error.message}`);
    process.exit(1);
  }

  let existingManifest;
  try {
    existingManifest = JSON.parse(fs.readFileSync(args.manifestPath, 'utf8'));
  } catch (error) {
    console.error('Capability Registry Check: FAIL');
    console.error(`  - Invalid .claude manifest JSON: ${error.message}`);
    process.exit(1);
  }

  // Ignore generatedAtUtc drift and compare structure/content deterministically.
  const computedComparable = { ...computed, generatedAtUtc: null };
  const existingComparable = { ...existing, generatedAtUtc: null };
  const computedManifestComparable = comparableManifest(computedManifest);
  const existingManifestComparable = comparableManifest(existingManifest);

  if (canonicalize(computedComparable) !== canonicalize(existingComparable)) {
    console.error('Capability Registry Check: FAIL');
    console.error('  - Registry is stale. Run: node spec-kit/quantum-runtime/sync-capability-registry.js');
    process.exit(1);
  }

  if (canonicalize(computedManifestComparable) !== canonicalize(existingManifestComparable)) {
    console.error('Capability Registry Check: FAIL');
    console.error('  - .claude manifest is stale. Run: node spec-kit/quantum-runtime/sync-capability-registry.js');
    process.exit(1);
  }

  console.log('Capability Registry Check: PASS');
  console.log(`Path: ${args.registryPath}`);
  console.log(`Manifest: ${args.manifestPath}`);
}

main();
