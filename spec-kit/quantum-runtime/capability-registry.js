const fs = require('fs');
const path = require('path');

const { OPERATION_CATALOG, QUANTUM_COMPUTING_OPERATIONS } = require('./operation-catalog');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEFAULT_REGISTRY_PATH = path.resolve(__dirname, 'capability-registry.json');
const ORACLE_BUNDLE_ROOT = path.resolve(ROOT_DIR, 'spec-kit', 'quantum-oracle');

const AGENT_FILES = Object.freeze([
  '.claude/agents/claudecode.agent.md',
  '.claude/agents/frontend.agent.md',
  '.claude/agents/backend.agent.md',
  '.claude/agents/database.agent.md',
  '.claude/agents/security.agent.md',
  '.claude/agents/realtime.agent.md',
  '.claude/agents/devops.agent.md',
  '.claude/agents/debugger.agent.md',
]);

const CORE_LOCAL_TOOLS = new Set([
  'Read',
  'Edit',
  'Write',
  'Bash',
  'Grep',
  'Glob',
  'Search',
  'Agent',
  'WebFetch',
  'NotebookEdit',
  'TodoWrite',
  'mcp__ide__getDiagnostics',
]);

const EXPLICIT_OPERATION_MAP = Object.freeze({
  QuantumSuperposition: 'prepare-qubit-state',
  WaveFunctionCollapse: 'measure-output',
  QuantumEntanglement: 'exploit-interference',
  QuantumTunneling: 'exploit-interference',
  QuantumErrorCorrection: 'surface-code-error-correction',
  QuantumDecoherence: 'surface-code-error-correction',
  AmplitudeAmplification: 'amplitude-estimation',
  PhaseEstimation: 'phase-estimation',
  QuantumOracle: 'apply-gate-circuit',
  QuantumProcessTomography: 'logical-qubit-fault-tolerant-execution',
  QuantumStateTomography: 'logical-qubit-fault-tolerant-execution',
  QuantumErrorMitigationAdvisor: 'surface-code-error-correction',
  QuantumCircuitSynthesis: 'apply-gate-circuit',
  QuantumAlgorithmOptimizer: 'hybrid-quantum-workflow',
  QuantumComplexityAnalyzer: 'hybrid-quantum-workflow',
  QuantumResourceEstimator: 'hybrid-quantum-workflow',
  QuantumCryptographyAdvisor: 'hybrid-quantum-workflow',
  PostQuantumAlgorithmRecommender: 'hybrid-quantum-workflow',
  PQCImplementationVerifier: 'hybrid-quantum-workflow',
  ShorsAlgorithmSimulator: 'shor-factorization',
  GroverSearch: 'grover-search',
  QAOALayoutOptimizer: 'qaoa-optimization',
  HHLConstraintSolver: 'logical-qubit-fault-tolerant-execution',
  QuantumRAM: 'logical-qubit-fault-tolerant-execution',
  qRAMIndexDesigner: 'logical-qubit-fault-tolerant-execution',
  BellPairCreator: 'exploit-interference',
  BellMeasurementGate: 'apply-gate-circuit',
  QuantumTeleportationProtocol: 'exploit-interference',
  RenderBudgetProfiler: 'hybrid-quantum-workflow',
});

function parseFrontmatterTools(content) {
  const match = content.match(/^tools:\s*(.+)$/m);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeToolName(toolName) {
  return String(toolName || '').trim();
}

function inferOperation(toolName) {
  const normalized = normalizeToolName(toolName);
  if (!normalized) {
    return {
      operation: 'classical-orchestration',
      reason: 'empty-tool-name',
    };
  }

  if (CORE_LOCAL_TOOLS.has(normalized)) {
    return {
      operation: 'classical-orchestration',
      reason: 'core-local-tool',
    };
  }

  if (EXPLICIT_OPERATION_MAP[normalized]) {
    return {
      operation: EXPLICIT_OPERATION_MAP[normalized],
      reason: 'explicit-map',
    };
  }

  const lower = normalized.toLowerCase();

  if (lower.includes('grover')) {
    return { operation: 'grover-search', reason: 'name-pattern-grover' };
  }
  if (lower.includes('shor')) {
    return { operation: 'shor-factorization', reason: 'name-pattern-shor' };
  }
  if (lower.includes('qaoa')) {
    return { operation: 'qaoa-optimization', reason: 'name-pattern-qaoa' };
  }
  if (lower.includes('vqe')) {
    return { operation: 'vqe-optimization', reason: 'name-pattern-vqe' };
  }
  if (lower.includes('phase')) {
    return { operation: 'phase-estimation', reason: 'name-pattern-phase' };
  }
  if (lower.includes('amplitude')) {
    return { operation: 'amplitude-estimation', reason: 'name-pattern-amplitude' };
  }
  if (lower.includes('chemistry') || lower.includes('material')) {
    return { operation: 'chemistry-materials-simulation', reason: 'name-pattern-chemistry' };
  }
  if (lower.includes('anneal') || lower.includes('dwave')) {
    return { operation: 'annealing-optimization', reason: 'name-pattern-annealing' };
  }

  if (
    lower.includes('errorcorrection')
    || lower.includes('errordetection')
    || lower.includes('mitigation')
    || lower.includes('stabilizer')
    || lower.includes('fault')
    || lower.includes('logicalqubit')
  ) {
    return {
      operation: lower.includes('logicalqubit') || lower.includes('fault')
        ? 'logical-qubit-fault-tolerant-execution'
        : 'surface-code-error-correction',
      reason: 'name-pattern-error-correction',
    };
  }

  if (
    lower.includes('entangle')
    || lower.includes('superposition')
    || lower.includes('teleport')
    || lower.includes('bell')
    || lower.includes('interference')
  ) {
    return {
      operation: 'exploit-interference',
      reason: 'name-pattern-interference',
    };
  }

  if (
    lower.includes('measure')
    || lower.includes('collapse')
    || lower.includes('observer')
    || lower.includes('readout')
  ) {
    return {
      operation: 'measure-output',
      reason: 'name-pattern-measurement',
    };
  }

  if (
    lower.includes('gate')
    || lower.includes('circuit')
    || lower.includes('topology')
    || lower.includes('propagator')
  ) {
    return {
      operation: 'apply-gate-circuit',
      reason: 'name-pattern-gate-circuit',
    };
  }

  if (lower.includes('quantum')) {
    return {
      operation: 'hybrid-quantum-workflow',
      reason: 'name-pattern-quantum-default',
    };
  }

  return {
    operation: 'classical-orchestration',
    reason: 'fallback-classical-orchestration',
  };
}

function backendCallForOperation(operation) {
  if (operation === 'classical-orchestration') {
    return {
      service: 'agent-orchestration',
      method: 'executeTool',
      operation,
    };
  }

  return {
    service: 'quantum-runtime',
    method: 'executeCapability',
    operation,
  };
}

function readDeclaredAgentTools() {
  const tools = [];

  for (const relativePath of AGENT_FILES) {
    const absolutePath = path.resolve(ROOT_DIR, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    const parsed = parseFrontmatterTools(content);

    for (const toolName of parsed) {
      tools.push({
        toolName: normalizeToolName(toolName),
        sourceFile: relativePath,
      });
    }
  }

  return tools;
}

function readOracleActivatedTools() {
  const tools = [];

  if (!fs.existsSync(ORACLE_BUNDLE_ROOT)) {
    return tools;
  }

  const bundleDirs = fs.readdirSync(ORACLE_BUNDLE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== 'templates' && name !== 'examples');

  bundleDirs.forEach((bundleId) => {
    const closurePath = path.resolve(ORACLE_BUNDLE_ROOT, bundleId, 'closure_oracle.json');
    if (!fs.existsSync(closurePath)) {
      return;
    }

    let closure = null;
    try {
      closure = JSON.parse(fs.readFileSync(closurePath, 'utf8'));
    } catch (_) {
      closure = null;
    }

    if (!closure || !Array.isArray(closure.activatedEliteTools)) {
      return;
    }

    const sourceFile = path.relative(ROOT_DIR, closurePath).replace(/\\/g, '/');

    closure.activatedEliteTools.forEach((toolName) => {
      tools.push({
        toolName: normalizeToolName(toolName),
        sourceFile,
      });
    });
  });

  return tools;
}

function buildCapabilityRegistry() {
  const declaredTools = [
    ...readDeclaredAgentTools(),
    ...readOracleActivatedTools(),
  ];
  const dedupedMap = new Map();

  for (const item of declaredTools) {
    const key = item.toolName;
    if (!key) {
      continue;
    }

    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, {
        toolName: key,
        sourceFiles: new Set(),
      });
    }
    dedupedMap.get(key).sourceFiles.add(item.sourceFile);
  }

  const capabilities = Array.from(dedupedMap.values()).map((entry) => {
    const inference = inferOperation(entry.toolName);
    const operationMeta = OPERATION_CATALOG[inference.operation] || OPERATION_CATALOG['classical-orchestration'];
    const backendCall = backendCallForOperation(inference.operation);

    return {
      toolName: entry.toolName,
      operation: inference.operation,
      inferenceReason: inference.reason,
      quantumComputing: QUANTUM_COMPUTING_OPERATIONS.has(inference.operation),
      backendCall,
      providerPreference: operationMeta.providerPreference || ['classical-simulator'],
      classicalFallback: true,
      sourceFiles: Array.from(entry.sourceFiles).sort(),
    };
  });

  const quantumTools = capabilities.filter((c) => c.quantumComputing === true);

  return {
    schemaVersion: '1.0.0',
    generatedAtUtc: new Date().toISOString(),
    sourceAgentFiles: [...AGENT_FILES],
    capabilities,
    summary: {
      declaredToolEntries: declaredTools.length,
      uniqueToolCount: capabilities.length,
      mappedCapabilityCount: capabilities.length,
      quantumComputingToolCount: quantumTools.length,
      classicalToolCount: capabilities.length - quantumTools.length,
      unmappedTools: [],
    },
  };
}

function writeCapabilityRegistry(registryPath = DEFAULT_REGISTRY_PATH) {
  const registry = buildCapabilityRegistry();
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  return registry;
}

function loadCapabilityRegistry(options = {}) {
  const registryPath = options.registryPath
    ? path.resolve(options.registryPath)
    : DEFAULT_REGISTRY_PATH;

  if (!fs.existsSync(registryPath) || options.rebuild === true) {
    return writeCapabilityRegistry(registryPath);
  }

  const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  if (!Array.isArray(parsed.capabilities)) {
    return writeCapabilityRegistry(registryPath);
  }

  return parsed;
}

function toCapabilityMap(registry) {
  const map = new Map();
  const capabilities = Array.isArray(registry && registry.capabilities) ? registry.capabilities : [];
  capabilities.forEach((capability) => {
    if (capability && capability.toolName) {
      map.set(capability.toolName, capability);
    }
  });
  return map;
}

module.exports = {
  AGENT_FILES,
  DEFAULT_REGISTRY_PATH,
  CORE_LOCAL_TOOLS,
  readDeclaredAgentTools,
  readOracleActivatedTools,
  inferOperation,
  buildCapabilityRegistry,
  writeCapabilityRegistry,
  loadCapabilityRegistry,
  toCapabilityMap,
};
