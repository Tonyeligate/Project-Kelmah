const { OPERATION_CATALOG } = require('./operation-catalog');
const { initializeQuantumProviderEnv } = require('./load-quantum-env');
const {
  PROVIDER_NAME: LOCAL_QISKIT_PROVIDER,
  isLocalQiskitEnabled,
  executeLocalQiskitAer,
} = require('./local-qiskit-aer');

initializeQuantumProviderEnv();

const PROVIDER_CONFIG = Object.freeze({
  'ibm-quantum': {
    endpointEnv: 'IBM_QUANTUM_ENDPOINT',
    endpointEnvAliases: ['QISKIT_RUNTIME_ENDPOINT'],
    tokenEnv: 'IBM_QUANTUM_API_KEY',
    tokenEnvAliases: ['QISKIT_IBM_TOKEN', 'IBM_QUANTUM_TOKEN'],
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    providerIdPrefix: 'ibmq',
    baseCostPerShot: 0.00012,
  },
  'aws-braket': {
    endpointEnv: 'AWS_BRAKET_ENDPOINT',
    endpointEnvAliases: ['AMAZON_BRAKET_ENDPOINT'],
    tokenEnv: 'AWS_BRAKET_API_KEY',
    tokenEnvAliases: ['AWS_BRAKET_TOKEN'],
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    providerIdPrefix: 'braket',
    baseCostPerShot: 0.00015,
  },
  'azure-quantum': {
    endpointEnv: 'AZURE_QUANTUM_ENDPOINT',
    endpointEnvAliases: ['AZURE_QUANTUM_RESOURCE_ENDPOINT'],
    tokenEnv: 'AZURE_QUANTUM_API_KEY',
    tokenEnvAliases: ['AZURE_QUANTUM_KEY'],
    authHeader: 'api-key',
    authPrefix: '',
    providerIdPrefix: 'azureq',
    baseCostPerShot: 0.00014,
  },
  'd-wave': {
    endpointEnv: 'DWAVE_ENDPOINT',
    tokenEnv: 'DWAVE_API_TOKEN',
    tokenEnvAliases: ['DWAVE_API_KEY', 'DWAVE_TOKEN'],
    authHeader: 'X-Auth-Token',
    authPrefix: '',
    providerIdPrefix: 'dwave',
    baseCostPerShot: 0.0001,
  },
  [LOCAL_QISKIT_PROVIDER]: {
    requiresCredentials: false,
    authHeader: 'local-process',
    authPrefix: '',
    providerIdPrefix: 'lqa',
    baseCostPerShot: 0,
  },
});

function readFirstSetEnv(envNames = []) {
  for (const envName of envNames) {
    const rawValue = process.env[envName];
    if (typeof rawValue !== 'string') {
      continue;
    }

    const value = rawValue.trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function getProviderConfig(providerName) {
  return PROVIDER_CONFIG[providerName] || null;
}

function getProviderEnvironmentKeys(providerName) {
  const config = getProviderConfig(providerName);
  if (!config) {
    return null;
  }

  if (config.requiresCredentials === false) {
    return {
      endpointEnvs: [],
      tokenEnvs: [],
    };
  }

  return {
    endpointEnvs: [config.endpointEnv].concat(config.endpointEnvAliases || []),
    tokenEnvs: [config.tokenEnv].concat(config.tokenEnvAliases || []),
  };
}

function getProviderCredentials(providerName) {
  const envKeys = getProviderEnvironmentKeys(providerName);
  if (!envKeys) {
    return null;
  }

  return {
    endpoint: readFirstSetEnv(envKeys.endpointEnvs),
    token: readFirstSetEnv(envKeys.tokenEnvs),
  };
}

function createProviderJobId(providerName) {
  const prefix = PROVIDER_CONFIG[providerName] ? PROVIDER_CONFIG[providerName].providerIdPrefix : 'qjob';
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function isProviderConfigured(providerName) {
  if (providerName === 'classical-simulator') {
    return true;
  }

  if (providerName === LOCAL_QISKIT_PROVIDER) {
    return isLocalQiskitEnabled();
  }

  const config = PROVIDER_CONFIG[providerName];
  if (!config) {
    return false;
  }

  if (config.requiresCredentials === false) {
    return true;
  }

  const credentials = getProviderCredentials(providerName);
  if (!credentials) {
    return false;
  }

  const { endpoint, token } = credentials;
  return Boolean(endpoint && token);
}

function canSimulateProvider(providerName) {
  if (!PROVIDER_CONFIG[providerName]) {
    return false;
  }

  if (providerName === LOCAL_QISKIT_PROVIDER) {
    return false;
  }

  return String(process.env.QUANTUM_PROVIDER_SIMULATION || 'false').toLowerCase() === 'true';
}

function simulatedProviderResponse(providerName, operation, payload) {
  const config = PROVIDER_CONFIG[providerName];
  const operationMeta = OPERATION_CATALOG[operation] || {};

  const shots = Math.max(1, Number(payload.shots) || 1024);
  const circuitDepth = Math.max(1, Number(payload.circuitDepth) || Number(payload.depthP) || 12);
  const fidelity = Number((0.93 + (Math.random() * 0.05)).toFixed(6));
  const errorRate = Number((1 - fidelity).toFixed(6));
  const costUsd = Number((shots * (config.baseCostPerShot || 0.0001)).toFixed(6));

  return {
    provider: providerName,
    providerJobId: createProviderJobId(providerName),
    operation,
    operationLabel: operationMeta.label || operation,
    metrics: {
      shots,
      circuitDepth,
      fidelity,
      errorRate,
      errorRates: {
        readout: Number((errorRate * 0.45).toFixed(6)),
        gate: Number((errorRate * 0.55).toFixed(6)),
      },
      costUsd,
      latencyMs: Math.max(75, Math.floor(Math.random() * 220) + 120),
      executionPath: 'quantum-provider',
    },
    result: {
      mode: 'provider-simulation',
      provider: providerName,
      message: 'Simulated provider response (no live provider endpoint configured).',
    },
  };
}

async function dispatchProviderJob(providerName, operation, payload = {}) {
  if (!PROVIDER_CONFIG[providerName]) {
    throw new Error(`Unsupported provider '${providerName}'`);
  }

  if (providerName === LOCAL_QISKIT_PROVIDER) {
    return executeLocalQiskitAer(operation, payload);
  }

  if (canSimulateProvider(providerName)) {
    return simulatedProviderResponse(providerName, operation, payload);
  }

  if (!isProviderConfigured(providerName)) {
    throw new Error(`Provider '${providerName}' is not configured`);
  }

  const config = PROVIDER_CONFIG[providerName];
  const credentials = getProviderCredentials(providerName);
  const endpoint = credentials ? credentials.endpoint : '';
  const token = credentials ? credentials.token : '';

  const authHeader = config.authHeader || 'Authorization';
  const authPrefix = typeof config.authPrefix === 'string' ? config.authPrefix : 'Bearer ';
  const headers = {
    'Content-Type': 'application/json',
  };

  headers[authHeader] = `${authPrefix}${token}`;

  const requestBody = {
    operation,
    payload,
    submittedAtUtc: new Date().toISOString(),
  };

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Provider '${providerName}' request failed with status ${response.status}`);
  }

  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  const latencyMs = Date.now() - startedAt;
  const shots = Math.max(1, Number(data.shots) || Number(payload.shots) || 1024);
  const circuitDepth = Math.max(1, Number(data.circuitDepth) || Number(payload.circuitDepth) || 12);
  const fidelity = Number.isFinite(Number(data.fidelity)) ? Number(data.fidelity) : 0.92;
  const errorRate = Number.isFinite(Number(data.errorRate)) ? Number(data.errorRate) : Number((1 - fidelity).toFixed(6));
  const costUsd = Number.isFinite(Number(data.costUsd))
    ? Number(data.costUsd)
    : Number((shots * (config.baseCostPerShot || 0.0001)).toFixed(6));

  return {
    provider: providerName,
    providerJobId: String(data.providerJobId || data.jobId || createProviderJobId(providerName)),
    operation,
    metrics: {
      shots,
      circuitDepth,
      fidelity,
      errorRate,
      errorRates: {
        readout: Number.isFinite(Number(data.readoutErrorRate)) ? Number(data.readoutErrorRate) : Number((errorRate * 0.45).toFixed(6)),
        gate: Number.isFinite(Number(data.gateErrorRate)) ? Number(data.gateErrorRate) : Number((errorRate * 0.55).toFixed(6)),
      },
      costUsd,
      latencyMs,
      executionPath: 'quantum-provider',
    },
    result: data.result || data,
  };
}

module.exports = {
  PROVIDER_CONFIG,
  getProviderConfig,
  getProviderEnvironmentKeys,
  getProviderCredentials,
  isProviderConfigured,
  dispatchProviderJob,
  createProviderJobId,
};
