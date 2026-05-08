const { OPERATION_CATALOG, QUANTUM_COMPUTING_OPERATIONS } = require('./operation-catalog');
const {
  AGENT_FILES,
  DEFAULT_REGISTRY_PATH,
  readDeclaredAgentTools,
  readOracleActivatedTools,
  inferOperation,
  buildCapabilityRegistry,
  writeCapabilityRegistry,
  loadCapabilityRegistry,
  toCapabilityMap,
} = require('./capability-registry');
const {
  DEFAULT_MANIFEST_PATH,
  buildClaudeCapabilityManifest,
  writeClaudeCapabilityManifest,
} = require('./claude-manifest');
const { buildExecutionPlan, shouldAttemptQuantum, selectProviderCandidates } = require('./router');
const { executeCapability, executeOperation, summarizeTaskTelemetry, TELEMETRY_FILE } = require('./runtime-service');

module.exports = {
  OPERATION_CATALOG,
  QUANTUM_COMPUTING_OPERATIONS,
  AGENT_FILES,
  DEFAULT_REGISTRY_PATH,
  readDeclaredAgentTools,
  readOracleActivatedTools,
  inferOperation,
  buildCapabilityRegistry,
  writeCapabilityRegistry,
  loadCapabilityRegistry,
  toCapabilityMap,
  DEFAULT_MANIFEST_PATH,
  buildClaudeCapabilityManifest,
  writeClaudeCapabilityManifest,
  buildExecutionPlan,
  shouldAttemptQuantum,
  selectProviderCandidates,
  executeCapability,
  executeOperation,
  summarizeTaskTelemetry,
  TELEMETRY_FILE,
};
