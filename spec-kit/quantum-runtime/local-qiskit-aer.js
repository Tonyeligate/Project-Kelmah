const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROVIDER_NAME = 'local-qiskit-aer';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ADAPTER_SCRIPT = path.resolve(__dirname, 'providers', 'local-qiskit-aer.py');

function isTruthy(value, fallback = false) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return !['0', 'false', 'no', 'off', 'disabled'].includes(normalized);
}

function isLocalQiskitEnabled() {
  return isTruthy(process.env.QUANTUM_LOCAL_QISKIT_ENABLED, true);
}

function getTimeoutMs() {
  const parsed = Number(process.env.QUANTUM_LOCAL_QISKIT_TIMEOUT_MS);
  if (!Number.isFinite(parsed)) {
    return 20000;
  }
  return Math.max(1000, Math.floor(parsed));
}

function getPythonCandidates() {
  const configured = String(process.env.QUANTUM_LOCAL_QISKIT_PYTHON || '').trim();
  if (configured) {
    return [configured];
  }

  const defaults = process.platform === 'win32'
    ? ['python', 'py']
    : ['python3', 'python'];

  return Array.from(new Set(defaults));
}

function runAdapterWithPython(pythonCommand, requestBody) {
  const result = spawnSync(pythonCommand, [ADAPTER_SCRIPT], {
    input: JSON.stringify(requestBody),
    encoding: 'utf8',
    timeout: getTimeoutMs(),
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Local Qiskit adapter launch failed (${pythonCommand}): ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = String(result.stderr || '').trim();
    const stdout = String(result.stdout || '').trim();
    const detail = stderr || stdout;
    const suffix = detail ? `: ${detail}` : '';
    throw new Error(`Local Qiskit adapter exited with code ${result.status}${suffix}`);
  }

  const rawOutput = String(result.stdout || '').trim();
  if (!rawOutput) {
    throw new Error('Local Qiskit adapter returned empty output');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawOutput);
  } catch (error) {
    throw new Error(`Local Qiskit adapter returned invalid JSON: ${error.message}`);
  }

  return parsed;
}

function normalizeMetrics(data, payload = {}) {
  const metrics = data && typeof data === 'object' && data.metrics && typeof data.metrics === 'object'
    ? data.metrics
    : {};

  const shots = Math.max(1, Number(metrics.shots) || Number(payload.shots) || 1024);
  const circuitDepth = Math.max(1, Number(metrics.circuitDepth) || Number(payload.circuitDepth) || Number(payload.depthP) || 1);
  const fidelityCandidate = Number(metrics.fidelity);
  const fidelity = Number.isFinite(fidelityCandidate)
    ? Math.max(0, Math.min(1, fidelityCandidate))
    : Number(Math.max(0.85, 1 - (circuitDepth * 0.0015)).toFixed(6));
  const errorRateCandidate = Number(metrics.errorRate);
  const errorRate = Number.isFinite(errorRateCandidate)
    ? Math.max(0, errorRateCandidate)
    : Number((1 - fidelity).toFixed(6));

  return {
    shots,
    circuitDepth,
    fidelity,
    errorRate,
    errorRates: {
      readout: Number.isFinite(Number(metrics.readoutErrorRate))
        ? Number(metrics.readoutErrorRate)
        : Number((errorRate * 0.45).toFixed(6)),
      gate: Number.isFinite(Number(metrics.gateErrorRate))
        ? Number(metrics.gateErrorRate)
        : Number((errorRate * 0.55).toFixed(6)),
    },
    costUsd: Number.isFinite(Number(metrics.costUsd)) ? Number(metrics.costUsd) : 0,
    latencyMs: Math.max(1, Number(metrics.latencyMs) || 1),
    executionPath: 'quantum-provider',
  };
}

function buildProviderJobId(data) {
  if (data && typeof data.providerJobId === 'string' && data.providerJobId.trim()) {
    return data.providerJobId.trim();
  }

  return `lqa-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function executeLocalQiskitAer(operation, payload = {}) {
  if (!isLocalQiskitEnabled()) {
    throw new Error('Local Qiskit Aer provider is disabled');
  }

  if (!fs.existsSync(ADAPTER_SCRIPT)) {
    throw new Error(`Local Qiskit adapter script is missing: ${ADAPTER_SCRIPT}`);
  }

  const requestBody = {
    operation,
    payload,
    submittedAtUtc: new Date().toISOString(),
  };

  let lastError = null;
  const pythonCandidates = getPythonCandidates();

  for (const pythonCommand of pythonCandidates) {
    try {
      const data = runAdapterWithPython(pythonCommand, requestBody);
      return {
        provider: PROVIDER_NAME,
        providerJobId: buildProviderJobId(data),
        operation,
        metrics: normalizeMetrics(data, payload),
        result: data && Object.prototype.hasOwnProperty.call(data, 'result')
          ? data.result
          : data,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to execute local Qiskit adapter');
}

module.exports = {
  PROVIDER_NAME,
  ADAPTER_SCRIPT,
  isLocalQiskitEnabled,
  executeLocalQiskitAer,
};
