#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ADVANCED_TASK_TYPES = new Set([
  'ui-optimization',
  'adaptive-interface',
  'design-flow-optimization',
  'backend-optimization',
  'api-design-optimization',
  'reliability-hardening',
  'database-integrity-hardening',
  'security-hardening',
  'realtime-reliability',
  'infra-coherence',
]);

const CORE_ELITE_TOOLS = [
  'EvidenceArtifactCompiler',
  'CompletionOracleChecker',
  'CounterfactualWorldScorer',
  'DelegationPacketBuilder',
  'VisualOracleRunner',
  'AdversarialSelfPlayOrchestrator',
  'QuantumScoreboardUpdater',
];

const FRONTEND_OPT_TOOLS = [
  'QAOALayoutOptimizer',
  'GroverPathAuditor',
  'BehavioralTwinSimulator',
  'AdaptiveInterfaceController',
  'AccessibilityCloudAnalyzer',
];

const BACKEND_OPT_TOOLS = [
  'APITopologyOptimizer',
  'ContractEvolutionAnalyzer',
  'ReliabilityChaosSimulator',
  'GatewayPolicyVerifier',
  'QueryPerformanceEstimator',
];

const DATABASE_TOOLS = [
  'SchemaDriftSentinel',
  'EnumConsistencyOracle',
  'QueryEnergyBudgetAnalyzer',
  'MigrationRollbackVerifier',
];

const SECURITY_TOOLS = [
  'AttackReplayHarness',
  'ThreatSurfaceDeltaScanner',
  'MitigationProofGenerator',
  'ResidualRiskQuantifier',
];

const REALTIME_TOOLS = [
  'EventCausalityTracer',
  'ListenerCardinalityGuard',
  'ReconnectConvergenceAnalyzer',
  'DeliveryFidelityScorer',
];

const DEVOPS_TOOLS = [
  'DeploymentTwinComparator',
  'EnvironmentParityChecker',
  'MultiWorldGateVerifier',
  'InfraEntropyMonitor',
];

const LEARNING_TOOLS = [
  'MistakePatternMiner',
  'FieldExperienceIngestor',
  'GuardrailEvolutionEngine',
  'RegressionPreventionCompiler',
];

function parseArgs(argv) {
  const parsed = {
    taskId: null,
    taskType: null,
    force: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--task-id') {
      parsed.taskId = argv[i + 1] || null;
      i += 1;
    } else if (token === '--task-type') {
      parsed.taskType = argv[i + 1] || null;
      i += 1;
    } else if (token === '--force') {
      parsed.force = true;
    }
  }

  return parsed;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function prepareFromTemplate(templatePath, taskId) {
  const obj = readJson(templatePath);
  if (obj && typeof obj === 'object') {
    obj.taskId = taskId;
    if ('timestampUtc' in obj) {
      obj.timestampUtc = new Date().toISOString();
    }
  }
  return obj;
}

function requiredByTaskType(taskType) {
  const always = [
    'belief_state',
    'delegation_packets',
    'closure_oracle',
    'risk_register',
    'counterfactual_worlds',
  ];

  const optimization = [
    'layout_optimization_report',
    'behavioral_twin_report',
    'adaptive_policy_guardrails',
    'ui_state_space_audit',
    'nisq_hybrid_execution_report',
    'all_agent_activation_matrix',
    'three_d_hd_design_report',
  ];

  const backend = ['api_topology_report', 'service_reliability_report'];
  const database = ['schema_drift_report', 'enum_consistency_report', 'query_energy_budget', 'migration_safety_report'];
  const security = ['attack_replay_matrix', 'mitigation_effectiveness', 'residual_risk_quantification'];
  const realtime = ['event_causality_ledger', 'listener_cardinality_report', 'reconnect_consistency_report'];
  const devops = ['deployment_twin_state', 'env_drift_delta', 'world_verification_report'];

  const learning = ADVANCED_TASK_TYPES.has(taskType) ? ['learning_update', 'field_experience_report'] : [];

  if (new Set(['ui-optimization', 'adaptive-interface', 'design-flow-optimization']).has(taskType)) {
    return [...always, ...optimization, ...learning];
  }
  if (new Set(['backend-optimization', 'api-design-optimization', 'reliability-hardening']).has(taskType)) {
    return [...always, ...backend, ...learning];
  }
  if (taskType === 'database-integrity-hardening') {
    return [...always, ...database, ...learning];
  }
  if (taskType === 'security-hardening') {
    return [...always, ...security, ...learning];
  }
  if (taskType === 'realtime-reliability') {
    return [...always, ...realtime, ...learning];
  }
  if (taskType === 'infra-coherence') {
    return [...always, ...devops, ...learning];
  }

  return always;
}

function applyClosureFlags(closure, taskType) {
  closure.taskType = taskType;
  closure.requiresLearningOracle = ADVANCED_TASK_TYPES.has(taskType);
  closure.requiresOptimizationOracle = new Set(['ui-optimization', 'adaptive-interface', 'design-flow-optimization']).has(taskType);
  closure.requiresBackendOracle = new Set(['backend-optimization', 'api-design-optimization', 'reliability-hardening']).has(taskType);
  closure.requiresDatabaseOracle = taskType === 'database-integrity-hardening';
  closure.requiresSecurityOracle = taskType === 'security-hardening';
  closure.requiresRealtimeOracle = taskType === 'realtime-reliability';
  closure.requiresDevopsOracle = taskType === 'infra-coherence';

  const tools = new Set(Array.isArray(closure.activatedEliteTools) ? closure.activatedEliteTools : []);
  CORE_ELITE_TOOLS.forEach((t) => tools.add(t));

  if (closure.requiresOptimizationOracle) FRONTEND_OPT_TOOLS.forEach((t) => tools.add(t));
  if (closure.requiresBackendOracle) BACKEND_OPT_TOOLS.forEach((t) => tools.add(t));
  if (closure.requiresDatabaseOracle) DATABASE_TOOLS.forEach((t) => tools.add(t));
  if (closure.requiresSecurityOracle) SECURITY_TOOLS.forEach((t) => tools.add(t));
  if (closure.requiresRealtimeOracle) REALTIME_TOOLS.forEach((t) => tools.add(t));
  if (closure.requiresDevopsOracle) DEVOPS_TOOLS.forEach((t) => tools.add(t));
  if (closure.requiresLearningOracle) LEARNING_TOOLS.forEach((t) => tools.add(t));

  closure.activatedEliteTools = Array.from(tools);
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.taskId || !args.taskType) {
    console.error('Usage: node spec-kit/quantum-oracle/scaffold-oracle-bundle.js --task-id <id> --task-type <type> [--force]');
    process.exit(1);
  }

  const templatesDir = path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', 'templates');
  const outDir = path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', args.taskId);
  ensureDir(outDir);

  const required = requiredByTaskType(args.taskType);
  const written = [];
  const skipped = [];

  required.forEach((name) => {
    const templatePath = path.join(templatesDir, `${name}.template.json`);
    if (!fs.existsSync(templatePath)) {
      console.error(`Missing template: ${templatePath}`);
      process.exit(1);
    }

    const outPath = path.join(outDir, `${name}.json`);
    if (fs.existsSync(outPath) && !args.force) {
      skipped.push(path.basename(outPath));
      return;
    }

    const obj = prepareFromTemplate(templatePath, args.taskId);
    if (name === 'closure_oracle') {
      applyClosureFlags(obj, args.taskType);
    }
    writeJson(outPath, obj);
    written.push(path.basename(outPath));
  });

  console.log('Oracle Bundle Scaffold: PASS');
  console.log(`Task ID: ${args.taskId}`);
  console.log(`Task type: ${args.taskType}`);
  console.log(`Bundle path: ${outDir}`);
  if (written.length > 0) {
    console.log(`Written: ${written.join(', ')}`);
  }
  if (skipped.length > 0) {
    console.log(`Skipped existing: ${skipped.join(', ')}`);
  }
}

main();
