#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  TELEMETRY_FILE,
  summarizeTaskTelemetry,
} = require('./runtime-service');
const {
  loadCapabilityRegistry,
} = require('./capability-registry');

function parseArgs(argv) {
  const parsed = {
    taskId: null,
    bundleDir: null,
    telemetryFile: TELEMETRY_FILE,
    outFile: null,
    failOnEmpty: true,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--task-id') {
      parsed.taskId = argv[i + 1] || null;
      i += 1;
    } else if (token === '--bundle-dir') {
      parsed.bundleDir = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (token === '--telemetry-file') {
      parsed.telemetryFile = path.resolve(argv[i + 1] || parsed.telemetryFile);
      i += 1;
    } else if (token === '--out') {
      parsed.outFile = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (token === '--allow-empty') {
      parsed.failOnEmpty = false;
    }
  }

  return parsed;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeCounter(items) {
  return Array.from(items.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([item, count]) => ({ item, count }));
}

function main() {
  const args = parseArgs(process.argv);

  if (!args.taskId && !args.bundleDir) {
    console.error('Usage: node spec-kit/quantum-runtime/materialize-runtime-telemetry.js --task-id <id> [--bundle-dir <dir>] [--out <file>]');
    process.exit(1);
  }

  const bundleDir = args.bundleDir
    ? args.bundleDir
    : path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', args.taskId);
  const taskId = args.taskId || path.basename(bundleDir);
  const outPath = args.outFile || path.join(bundleDir, 'runtime_execution_telemetry.json');
  const closurePath = path.join(bundleDir, 'closure_oracle.json');

  if (!fs.existsSync(closurePath)) {
    console.error('Runtime Telemetry Materialization: FAIL');
    console.error(`  - Missing closure oracle: ${closurePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(args.telemetryFile)) {
    console.error('Runtime Telemetry Materialization: FAIL');
    console.error(`  - Missing runtime telemetry source file: ${args.telemetryFile}`);
    process.exit(1);
  }

  const closure = readJson(closurePath);
  const requiredRuntimeTools = closure
    && closure.runtimeExecutionSummary
    && Array.isArray(closure.runtimeExecutionSummary.requiredRuntimeTools)
    ? closure.runtimeExecutionSummary.requiredRuntimeTools
    : Array.isArray(closure.activatedEliteTools)
      ? closure.activatedEliteTools
      : [];

  const lines = fs.readFileSync(args.telemetryFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const allRecords = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch (_) {
      return null;
    }
  }).filter(Boolean);

  const records = allRecords.filter((record) => String(record.taskId || '') === String(taskId));

  if (args.failOnEmpty && records.length === 0) {
    console.error('Runtime Telemetry Materialization: FAIL');
    console.error(`  - No runtime telemetry records found for task '${taskId}'`);
    process.exit(1);
  }

  const executionSummary = summarizeTaskTelemetry(records, requiredRuntimeTools);
  const operationCounter = new Map();
  const providerCounter = new Map();

  records.forEach((record) => {
    const operation = String(record.operation || '').trim();
    if (operation) {
      operationCounter.set(operation, (operationCounter.get(operation) || 0) + 1);
    }

    const provider = String(record.provider || '').trim();
    if (provider) {
      providerCounter.set(provider, (providerCounter.get(provider) || 0) + 1);
    }
  });

  const registry = loadCapabilityRegistry();

  const output = {
    taskId,
    timestampUtc: new Date().toISOString(),
    closureVerdict: 'PASS',
    capabilityRegistry: {
      schemaVersion: registry.schemaVersion,
      generatedAtUtc: registry.generatedAtUtc,
      path: 'spec-kit/quantum-runtime/capability-registry.json',
      uniqueToolCount: registry.summary && registry.summary.uniqueToolCount,
    },
    requiredHardTelemetryFields: Array.isArray(closure.requiredHardTelemetryFields)
      ? closure.requiredHardTelemetryFields
      : [
        'toolName',
        'operation',
        'backendCall',
        'provider',
        'providerJobId',
        'executionPath',
        'circuitDepth',
        'shots',
        'fidelity',
        'errorRate',
        'costUsd',
        'latencyMs',
        'startedAtUtc',
        'finishedAtUtc',
      ],
    runtimeExecution: {
      requiredRuntimeTools,
      requiredRuntimeToolsCount: requiredRuntimeTools.length,
      executedRuntimeCallsCount: executionSummary.executedRuntimeCallsCount,
      uniqueExecutedToolsCount: executionSummary.uniqueExecutedToolsCount,
      runtimeCoveragePct: executionSummary.runtimeCoveragePct,
      missingRequiredTools: executionSummary.missingRequiredTools,
      quantumProviderJobsCount: executionSummary.quantumProviderJobsCount,
      classicalFallbackJobsCount: executionSummary.classicalFallbackJobsCount,
      providerUsage: normalizeCounter(providerCounter),
      executedOperations: normalizeCounter(operationCounter),
      telemetryRecords: records,
    },
  };

  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log('Runtime Telemetry Materialization: PASS');
  console.log(`Task: ${taskId}`);
  console.log(`Output: ${outPath}`);
  console.log(`Runtime coverage: ${output.runtimeExecution.runtimeCoveragePct}%`);
  console.log(`Executed runtime calls: ${output.runtimeExecution.executedRuntimeCallsCount}`);
}

main();
