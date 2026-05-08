const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEFAULT_MANIFEST_PATH = path.resolve(ROOT_DIR, '.claude', 'capability-manifest.json');

function sortCounterEntries(counter) {
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function toForwardSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function sourceCategoryForCapability(capability) {
  const sourceFiles = Array.isArray(capability && capability.sourceFiles)
    ? capability.sourceFiles.map((item) => toForwardSlash(item))
    : [];

  const hasAgentSource = sourceFiles.some((source) => source.startsWith('.claude/agents/'));
  const hasOracleSource = sourceFiles.some((source) => source.startsWith('spec-kit/quantum-oracle/'));

  if (hasAgentSource && hasOracleSource) {
    return 'mixed';
  }
  if (hasAgentSource) {
    return 'agent';
  }
  if (hasOracleSource) {
    return 'oracle';
  }
  return 'other';
}

function agentsForCapability(capability) {
  const sourceFiles = Array.isArray(capability && capability.sourceFiles)
    ? capability.sourceFiles.map((item) => toForwardSlash(item))
    : [];

  return sourceFiles
    .filter((source) => source.startsWith('.claude/agents/'))
    .map((source) => path.basename(source))
    .sort();
}

function buildClaudeCapabilityManifest(registry) {
  const capabilities = Array.isArray(registry && registry.capabilities)
    ? registry.capabilities
    : [];

  const manifestCapabilities = capabilities
    .map((capability) => {
      const category = sourceCategoryForCapability(capability);

      return {
        toolName: String(capability && capability.toolName ? capability.toolName : ''),
        operation: String(capability && capability.operation ? capability.operation : 'classical-orchestration'),
        quantumComputing: capability && capability.quantumComputing === true,
        providerPreference: Array.isArray(capability && capability.providerPreference)
          ? capability.providerPreference.map((item) => String(item))
          : ['classical-simulator'],
        sourceCategory: category,
        agents: agentsForCapability(capability),
      };
    })
    .filter((capability) => capability.toolName.length > 0)
    .sort((a, b) => a.toolName.localeCompare(b.toolName));

  const operationCounter = new Map();
  const sourceCounter = new Map([
    ['agent', 0],
    ['oracle', 0],
    ['mixed', 0],
    ['other', 0],
  ]);
  const agentCounter = new Map();

  manifestCapabilities.forEach((capability) => {
    operationCounter.set(capability.operation, (operationCounter.get(capability.operation) || 0) + 1);
    sourceCounter.set(capability.sourceCategory, (sourceCounter.get(capability.sourceCategory) || 0) + 1);

    capability.agents.forEach((agentFile) => {
      agentCounter.set(agentFile, (agentCounter.get(agentFile) || 0) + 1);
    });
  });

  const operationCoverage = sortCounterEntries(operationCounter)
    .map(([operation, toolCount]) => ({
      operation,
      toolCount,
      quantumComputing: manifestCapabilities.some((capability) => capability.operation === operation && capability.quantumComputing === true),
    }));

  const agentCoverage = sortCounterEntries(agentCounter)
    .map(([agentFile, declaredToolCount]) => ({
      agentFile,
      declaredToolCount,
    }));

  const quantumTools = manifestCapabilities
    .filter((capability) => capability.quantumComputing)
    .map((capability) => capability.toolName)
    .slice(0, 25);

  const classicalTools = manifestCapabilities
    .filter((capability) => !capability.quantumComputing)
    .map((capability) => capability.toolName)
    .slice(0, 25);

  return {
    schemaVersion: '1.0.0',
    generatedAtUtc: new Date().toISOString(),
    sourceRegistryPath: 'spec-kit/quantum-runtime/capability-registry.json',
    sourceRegistryGeneratedAtUtc: registry && registry.generatedAtUtc ? String(registry.generatedAtUtc) : null,
    summary: {
      uniqueToolCount: manifestCapabilities.length,
      quantumComputingToolCount: manifestCapabilities.filter((capability) => capability.quantumComputing).length,
      classicalToolCount: manifestCapabilities.filter((capability) => !capability.quantumComputing).length,
      operationCount: operationCoverage.length,
      sourceBreakdown: {
        agent: sourceCounter.get('agent') || 0,
        oracle: sourceCounter.get('oracle') || 0,
        mixed: sourceCounter.get('mixed') || 0,
        other: sourceCounter.get('other') || 0,
      },
    },
    agentCoverage,
    operationCoverage,
    preview: {
      sampleQuantumTools: quantumTools,
      sampleClassicalTools: classicalTools,
    },
    capabilities: manifestCapabilities,
  };
}

function writeClaudeCapabilityManifest(registry, manifestPath = DEFAULT_MANIFEST_PATH) {
  const manifest = buildClaudeCapabilityManifest(registry);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

module.exports = {
  DEFAULT_MANIFEST_PATH,
  buildClaudeCapabilityManifest,
  writeClaudeCapabilityManifest,
};
