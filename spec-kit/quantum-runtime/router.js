const { OPERATION_CATALOG } = require('./operation-catalog');

const LOCAL_QISKIT_PROVIDER = 'local-qiskit-aer';

function normalizedNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function shouldAttemptQuantum(operation, payload = {}) {
  const operationMeta = OPERATION_CATALOG[operation] || {};
  if (operationMeta.quantumComputing !== true) {
    return {
      useQuantum: false,
      reason: 'operation-is-not-quantum-computing',
      score: 0,
    };
  }

  const criteria = payload.advantageCriteria || {};
  if (criteria.forceClassical === true) {
    return {
      useQuantum: false,
      reason: 'forceClassical-flag-set',
      score: 0,
    };
  }

  if (criteria.forceQuantum === true) {
    return {
      useQuantum: true,
      reason: 'forceQuantum-flag-set',
      score: 5,
    };
  }

  let score = 0;
  if (normalizedNumber(criteria.expectedSpeedupX, 0) >= 1.2) {
    score += 1;
  }
  if (normalizedNumber(criteria.problemSize, 0) >= 64) {
    score += 1;
  }
  if (normalizedNumber(criteria.stateDimension, 0) >= 256) {
    score += 1;
  }

  const qubits = Math.max(
    normalizedNumber(payload.qubits, 0),
    normalizedNumber(criteria.qubits, 0),
  );
  if (qubits >= 8) {
    score += 1;
  }

  if (criteria.requiresEntanglement === true || criteria.requiresPhaseEstimation === true) {
    score += 1;
  }

  return {
    useQuantum: score >= 2,
    reason: score >= 2
      ? `advantage-score-${score}`
      : `insufficient-advantage-score-${score}`,
    score,
  };
}

function localQiskitEnabled() {
  const raw = String(process.env.QUANTUM_LOCAL_QISKIT_ENABLED || 'true').trim().toLowerCase();
  return !['0', 'false', 'no', 'off', 'disabled'].includes(raw);
}

function localQiskitOnlyMode() {
  const raw = String(process.env.QUANTUM_LOCAL_QISKIT_ONLY || 'true').trim().toLowerCase();
  return !['0', 'false', 'no', 'off', 'disabled'].includes(raw);
}

function prependLocalQiskitProvider(operation, payload = {}, providers = []) {
  const operationMeta = OPERATION_CATALOG[operation] || {};
  if (operationMeta.quantumComputing !== true) {
    return providers;
  }

  if (!localQiskitEnabled()) {
    return providers;
  }

  const workloadType = String(payload.workloadType || operationMeta.workloadType || '').toLowerCase();
  if (workloadType === 'annealing') {
    return providers;
  }

  if (localQiskitOnlyMode()) {
    return [LOCAL_QISKIT_PROVIDER];
  }

  const filtered = providers.filter((provider) => provider !== LOCAL_QISKIT_PROVIDER);
  return [LOCAL_QISKIT_PROVIDER, ...filtered];
}

function preferredProvidersForWorkload(operation, payload = {}) {
  const operationMeta = OPERATION_CATALOG[operation] || {};
  const catalogPreference = Array.isArray(operationMeta.providerPreference)
    ? [...operationMeta.providerPreference]
    : [];

  const workloadType = String(payload.workloadType || operationMeta.workloadType || '').toLowerCase();

  if (workloadType === 'annealing') {
    return ['d-wave', 'aws-braket', ...catalogPreference.filter((p) => p !== 'd-wave' && p !== 'aws-braket')];
  }
  if (workloadType === 'chemistry-materials' || workloadType === 'chemistry') {
    return ['ibm-quantum', 'aws-braket', 'azure-quantum', ...catalogPreference.filter((p) => !['ibm-quantum', 'aws-braket', 'azure-quantum'].includes(p))];
  }
  if (workloadType === 'fault-tolerant' || workloadType === 'error-correction') {
    return ['ibm-quantum', 'azure-quantum', 'aws-braket', ...catalogPreference.filter((p) => !['ibm-quantum', 'azure-quantum', 'aws-braket'].includes(p))];
  }
  if (workloadType === 'hybrid-optimization') {
    return ['aws-braket', 'ibm-quantum', 'azure-quantum', ...catalogPreference.filter((p) => !['aws-braket', 'ibm-quantum', 'azure-quantum'].includes(p))];
  }

  return catalogPreference;
}

function selectProviderCandidates(operation, payload = {}) {
  const operationMeta = OPERATION_CATALOG[operation] || {};

  const explicitProvider = payload.provider || payload.targetProvider;
  if (explicitProvider) {
    return [String(explicitProvider).toLowerCase()];
  }

  const preferredFromWorkload = preferredProvidersForWorkload(operation, payload);
  const preferredFromPayload = Array.isArray(payload.providerPreference)
    ? payload.providerPreference.map((provider) => String(provider).toLowerCase())
    : [];

  const merged = [...preferredFromPayload, ...preferredFromWorkload, ...(operationMeta.providerPreference || [])]
    .map((provider) => String(provider).toLowerCase())
    .filter(Boolean);

  const uniqueProviders = Array.from(new Set(merged));
  return prependLocalQiskitProvider(operation, payload, uniqueProviders);
}

function buildExecutionPlan(operation, payload = {}) {
  const quantumDecision = shouldAttemptQuantum(operation, payload);
  const providerCandidates = selectProviderCandidates(operation, payload);

  if (!quantumDecision.useQuantum) {
    return {
      executionPath: 'classical-fallback',
      reason: quantumDecision.reason,
      providerCandidates,
      selectedProvider: 'classical-simulator',
      quantumAdvantageScore: quantumDecision.score,
    };
  }

  return {
    executionPath: 'quantum-provider',
    reason: quantumDecision.reason,
    providerCandidates,
    selectedProvider: providerCandidates[0] || 'ibm-quantum',
    quantumAdvantageScore: quantumDecision.score,
  };
}

module.exports = {
  shouldAttemptQuantum,
  selectProviderCandidates,
  buildExecutionPlan,
};
