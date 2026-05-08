const fs = require('fs');
const path = require('path');

const { loadCapabilityRegistry, toCapabilityMap, inferOperation } = require('./capability-registry');
const { OPERATION_CATALOG, QUANTUM_COMPUTING_OPERATIONS } = require('./operation-catalog');
const { buildExecutionPlan } = require('./router');
const { executeClassicalOperation } = require('./classical-simulator');
const { dispatchProviderJob, createProviderJobId } = require('./providers');

const TELEMETRY_FILE = path.resolve(__dirname, '..', 'quantum-oracle', 'runtime-telemetry.jsonl');

function ensureTelemetryDirectory() {
  const dir = path.dirname(TELEMETRY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendTelemetry(record) {
  ensureTelemetryDirectory();
  fs.appendFileSync(TELEMETRY_FILE, `${JSON.stringify(record)}\n`, 'utf8');
}

function normalizeMetricNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildTelemetryEntry({
  taskId,
  agent,
  toolName,
  capability,
  operation,
  backendCall,
  provider,
  providerJobId,
  executionPath,
  metrics,
  advantageReason,
  workloadType,
  startedAtUtc,
  finishedAtUtc,
}) {
  const circuitDepth = Math.max(1, normalizeMetricNumber(metrics.circuitDepth, 1));
  const shots = Math.max(1, normalizeMetricNumber(metrics.shots, 1));
  const fidelity = normalizeMetricNumber(metrics.fidelity, executionPath === 'classical-fallback' ? 0.999 : 0.92);
  const errorRate = normalizeMetricNumber(metrics.errorRate, Number((1 - fidelity).toFixed(6)));
  const costUsd = normalizeMetricNumber(metrics.costUsd, 0);
  const latencyMs = Math.max(1, Math.round(normalizeMetricNumber(metrics.latencyMs, 1)));

  const entry = {
    timestampUtc: finishedAtUtc,
    taskId: taskId || null,
    agent: agent || null,
    toolName,
    operation,
    workloadType: workloadType || (OPERATION_CATALOG[operation] && OPERATION_CATALOG[operation].workloadType) || null,
    quantumComputingOperation: QUANTUM_COMPUTING_OPERATIONS.has(operation),
    backendCall,
    provider,
    providerJobId,
    executionPath,
    advantageReason,
    circuitDepth,
    shots,
    fidelity,
    errorRate,
    errorRates: {
      readout: normalizeMetricNumber(metrics.errorRates && metrics.errorRates.readout, Number((errorRate * 0.45).toFixed(6))),
      gate: normalizeMetricNumber(metrics.errorRates && metrics.errorRates.gate, Number((errorRate * 0.55).toFixed(6))),
    },
    costUsd,
    latencyMs,
    startedAtUtc,
    finishedAtUtc,
    capabilityInferenceReason: capability ? capability.inferenceReason : inferOperation(toolName).reason,
  };

  return entry;
}

async function executeOperation({
  operation,
  payload,
  backendCall,
  taskId,
  agent,
  toolName,
  capability,
}) {
  const startedAt = Date.now();
  const startedAtUtc = new Date(startedAt).toISOString();

  const plan = buildExecutionPlan(operation, payload);
  const providerErrors = [];

  if (plan.executionPath === 'quantum-provider') {
    const providers = Array.isArray(plan.providerCandidates) ? plan.providerCandidates : [];

    for (const provider of providers) {
      try {
        const providerResult = await dispatchProviderJob(provider, operation, payload);
        const finishedAtUtc = new Date().toISOString();
        const telemetry = buildTelemetryEntry({
          taskId,
          agent,
          toolName,
          capability,
          operation,
          backendCall,
          provider: providerResult.provider,
          providerJobId: providerResult.providerJobId,
          executionPath: 'quantum-provider',
          metrics: providerResult.metrics || {},
          advantageReason: plan.reason,
          workloadType: payload.workloadType,
          startedAtUtc,
          finishedAtUtc,
        });

        appendTelemetry(telemetry);
        return {
          outcome: providerResult.result,
          telemetry,
          plan,
        };
      } catch (error) {
        providerErrors.push({
          provider,
          message: error.message,
        });
      }
    }
  }

  const classicalOutcome = executeClassicalOperation(operation, payload);
  const finishedAtUtc = new Date().toISOString();
  const telemetry = buildTelemetryEntry({
    taskId,
    agent,
    toolName,
    capability,
    operation,
    backendCall,
    provider: 'classical-simulator',
    providerJobId: createProviderJobId('classical-simulator'),
    executionPath: 'classical-fallback',
    metrics: {
      ...classicalOutcome.metrics,
      latencyMs: Math.max(classicalOutcome.metrics.latencyMs || 1, Date.now() - startedAt),
    },
    advantageReason: providerErrors.length > 0
      ? `${plan.reason};provider-fallback:${providerErrors.map((e) => e.provider).join('|')}`
      : plan.reason,
    workloadType: payload.workloadType,
    startedAtUtc,
    finishedAtUtc,
  });

  appendTelemetry(telemetry);
  return {
    outcome: classicalOutcome.result,
    telemetry,
    plan,
    providerErrors,
  };
}

async function executeCapability(request = {}) {
  const toolName = String(request.toolName || '').trim();
  if (!toolName) {
    throw new Error('executeCapability requires toolName');
  }

  const registry = loadCapabilityRegistry();
  const capabilityMap = toCapabilityMap(registry);
  const capability = capabilityMap.get(toolName) || null;

  const operation = capability ? capability.operation : inferOperation(toolName).operation;
  const payload = request.payload || {};

  const execution = await executeOperation({
    operation,
    payload,
    backendCall: capability ? capability.backendCall : {
      service: 'quantum-runtime',
      method: 'executeCapability',
      operation,
    },
    taskId: request.taskId || null,
    agent: request.agent || null,
    toolName,
    capability,
  });

  return {
    toolName,
    operation,
    result: execution.outcome,
    telemetry: execution.telemetry,
    plan: execution.plan,
    providerErrors: execution.providerErrors || [],
  };
}

function summarizeTaskTelemetry(entries = [], requiredTools = []) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const required = Array.isArray(requiredTools) ? requiredTools : [];

  const executedToolsSet = new Set(normalizedEntries.map((entry) => entry && entry.toolName).filter(Boolean));
  const requiredSet = new Set(required);

  const missingRequiredTools = Array.from(requiredSet).filter((tool) => !executedToolsSet.has(tool));
  const quantumProviderJobs = normalizedEntries.filter((entry) => entry && entry.executionPath === 'quantum-provider').length;
  const classicalFallbackJobs = normalizedEntries.filter((entry) => entry && entry.executionPath === 'classical-fallback').length;

  const coveragePct = requiredSet.size > 0
    ? Number(((requiredSet.size - missingRequiredTools.length) / requiredSet.size * 100).toFixed(2))
    : 100;

  return {
    executedRuntimeCallsCount: normalizedEntries.length,
    uniqueExecutedToolsCount: executedToolsSet.size,
    requiredRuntimeToolsCount: requiredSet.size,
    missingRequiredTools,
    runtimeCoveragePct: coveragePct,
    quantumProviderJobsCount: quantumProviderJobs,
    classicalFallbackJobsCount: classicalFallbackJobs,
  };
}

module.exports = {
  TELEMETRY_FILE,
  executeCapability,
  executeOperation,
  summarizeTaskTelemetry,
};
