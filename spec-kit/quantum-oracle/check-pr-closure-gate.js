#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const OPTIMIZATION_TASK_TYPES = new Set([
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

const ALLOWED_PR_TASK_TYPES = new Set([
  'general',
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

function parseArgs(argv) {
  const parsed = {
    base: null,
    head: null,
    prTitle: null,
    prBody: null,
    changedFiles: null,
    labelsJson: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--base') {
      parsed.base = argv[i + 1] || null;
      i += 1;
    } else if (token === '--head') {
      parsed.head = argv[i + 1] || null;
      i += 1;
    } else if (token === '--pr-title') {
      parsed.prTitle = argv[i + 1] || null;
      i += 1;
    } else if (token === '--pr-body') {
      parsed.prBody = argv[i + 1] || null;
      i += 1;
    } else if (token === '--changed-files') {
      parsed.changedFiles = argv[i + 1] || null;
      i += 1;
    } else if (token === '--labels-json') {
      parsed.labelsJson = argv[i + 1] || null;
      i += 1;
    }
  }

  return parsed;
}

function run(cmd) {
  return cp.execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function getChangedFiles(base, head) {
  if (!base || !head) {
    return [];
  }

  try {
    const out = run(`git diff --name-only ${base}...${head}`);
    if (!out) {
      return [];
    }
    return out.split('\n').map((f) => f.trim()).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function parseLabelsFromEnv() {
  const raw = process.env.PR_LABELS_JSON;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
  } catch (_) {
    return [];
  }
}

function parseLabels(raw) {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
  } catch (_) {
    return [];
  }
}

function parseChangedFiles(raw) {
  if (!raw) {
    return [];
  }
  return String(raw)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}

function hasOptimizationSignal(changedFiles, title, labels) {
  const text = `${title || ''}\n${labels.join(' ')}`.toLowerCase();

  if (/ui-optimization|adaptive-interface|design-flow-optimization|backend-optimization|api-design-optimization|reliability-hardening|database-integrity-hardening|security-hardening|realtime-reliability|infra-coherence|adaptive ui|quantum optimization|api optimization|backend optimization|reliability hardening|database integrity|security hardening|realtime reliability|infra coherence/.test(text)) {
    return true;
  }

  if (changedFiles.some((f) => /spec-kit\/quantum-oracle\/[^/]+\/(layout_optimization_report|behavioral_twin_report|adaptive_policy_guardrails|ui_state_space_audit|nisq_hybrid_execution_report|all_agent_activation_matrix|three_d_hd_design_report|api_topology_report|service_reliability_report|schema_drift_report|enum_consistency_report|query_energy_budget|migration_safety_report|attack_replay_matrix|mitigation_effectiveness|residual_risk_quantification|event_causality_ledger|listener_cardinality_report|reconnect_consistency_report|deployment_twin_state|env_drift_delta|world_verification_report)\.json$/i.test(f))) {
    return true;
  }

  return false;
}

function parseTaskTypeSelection(body) {
  const selected = [];
  const checkboxMatches = (body || '').matchAll(/^-\s*\[(x|X)\]\s*(general|ui-optimization|adaptive-interface|design-flow-optimization|backend-optimization|api-design-optimization|reliability-hardening|database-integrity-hardening|security-hardening|realtime-reliability|infra-coherence)\s*$/gm);

  for (const match of checkboxMatches) {
    selected.push(String(match[2]).toLowerCase());
  }

  return Array.from(new Set(selected));
}

function getChangedBundleIds(changedFiles) {
  const ids = new Set();
  const re = /^spec-kit\/quantum-oracle\/([^/]+)\//;

  changedFiles.forEach((file) => {
    const m = file.match(re);
    if (!m) {
      return;
    }
    const id = m[1];
    if (id === 'templates' || id === 'examples') {
      return;
    }
    ids.add(id);
  });

  return Array.from(ids);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function isOptimizationBundle(closure) {
  if (!closure || typeof closure !== 'object') {
    return false;
  }
  return (
    closure.requiresOptimizationOracle === true
    || closure.requiresBackendOracle === true
    || OPTIMIZATION_TASK_TYPES.has(closure.taskType)
  );
}

function runStrictBundleCheck(taskId) {
  try {
    run(`node spec-kit/quantum-oracle/check-completion-oracle.js --task-id ${taskId} --strict`);
    return { ok: true, output: '' };
  } catch (err) {
    const stdout = err && err.stdout ? String(err.stdout) : '';
    const stderr = err && err.stderr ? String(err.stderr) : '';
    return { ok: false, output: `${stdout}\n${stderr}`.trim() };
  }
}

function validateDebuggerEvidence(taskId) {
  const packetsPath = path.join(process.cwd(), 'spec-kit', 'quantum-oracle', taskId, 'delegation_packets.json');
  const packets = readJson(packetsPath);

  if (!packets || !Array.isArray(packets.packets)) {
    return 'delegation_packets.json missing or invalid for debugger evidence check';
  }

  const debuggerPacket = packets.packets.find((p) => p && p.agent === 'debugger');
  if (!debuggerPacket) {
    return 'missing debugger delegation packet for optimization/adaptive task';
  }

  const verificationStatus = debuggerPacket.verification && debuggerPacket.verification.status;
  if (verificationStatus !== 'pass') {
    return `debugger verification status must be pass (received '${verificationStatus || 'undefined'}')`;
  }

  if (!Array.isArray(debuggerPacket.findings) || debuggerPacket.findings.length === 0) {
    return 'debugger delegation packet must include non-empty findings';
  }

  return null;
}

function validateLearningEvidence(taskId) {
  const closurePath = path.join(process.cwd(), 'spec-kit', 'quantum-oracle', taskId, 'closure_oracle.json');
  const closure = readJson(closurePath);
  if (!closure || typeof closure !== 'object') {
    return 'closure_oracle.json missing or invalid for learning evidence check';
  }

  if (closure.requiresLearningOracle !== true) {
    return 'closure_oracle.json must set requiresLearningOracle=true for advanced optimization/reliability task types';
  }

  const learningPath = path.join(process.cwd(), 'spec-kit', 'quantum-oracle', taskId, 'learning_update.json');
  const fieldPath = path.join(process.cwd(), 'spec-kit', 'quantum-oracle', taskId, 'field_experience_report.json');

  if (!fs.existsSync(learningPath)) {
    return 'missing learning_update.json for learning-enabled task';
  }

  if (!fs.existsSync(fieldPath)) {
    return 'missing field_experience_report.json for learning-enabled task';
  }

  return null;
}

function main() {
  const args = parseArgs(process.argv);
  const base = args.base || process.env.PR_BASE_SHA || null;
  const head = args.head || process.env.PR_HEAD_SHA || null;

  const changedFiles = args.changedFiles ? parseChangedFiles(args.changedFiles) : getChangedFiles(base, head);
  const labels = args.labelsJson ? parseLabels(args.labelsJson) : parseLabelsFromEnv();
  const title = args.prTitle || process.env.PR_TITLE || '';
  const body = args.prBody || process.env.PR_BODY || '';

  const errors = [];
  const selectedTaskTypes = parseTaskTypeSelection(body);
  if (selectedTaskTypes.length !== 1) {
    errors.push('PR template task type is required and must have exactly one checked option: general, ui-optimization, adaptive-interface, design-flow-optimization, backend-optimization, api-design-optimization, reliability-hardening, database-integrity-hardening, security-hardening, realtime-reliability, or infra-coherence.');
  }

  const selectedTaskType = selectedTaskTypes.length === 1 ? selectedTaskTypes[0] : null;
  if (selectedTaskType && !ALLOWED_PR_TASK_TYPES.has(selectedTaskType)) {
    errors.push(`PR template task type '${selectedTaskType}' is not allowed.`);
  }

  const signal = hasOptimizationSignal(changedFiles, title, labels);
  const changedBundleIds = getChangedBundleIds(changedFiles);

  const closureByBundle = new Map();
  changedBundleIds.forEach((id) => {
    const closurePath = path.join(process.cwd(), 'spec-kit', 'quantum-oracle', id, 'closure_oracle.json');
    closureByBundle.set(id, readJson(closurePath));
  });

  const optimizationBundles = changedBundleIds.filter((id) => isOptimizationBundle(closureByBundle.get(id)));
  const selectedOptimizationType = selectedTaskType && OPTIMIZATION_TASK_TYPES.has(selectedTaskType);
  const requiresGate = selectedOptimizationType || signal || optimizationBundles.length > 0;

  if (selectedTaskType === 'general' && (signal || optimizationBundles.length > 0)) {
    errors.push('PR task type is set to general, but advanced optimization/reliability evidence was detected. Select the correct task type in the PR template.');
  }

  if (selectedOptimizationType && !signal && optimizationBundles.length === 0) {
    errors.push(`PR task type '${selectedTaskType}' requires optimization evidence and bundle artifacts, but none were detected in changed files.`);
  }

  if (errors.length > 0) {
    console.error('Quantum PR Closure Gate: FAIL');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (!requiresGate) {
    console.log('Quantum PR Closure Gate: PASS (task type general; no advanced optimization/reliability signal detected).');
    process.exit(0);
  }

  if (changedBundleIds.length === 0) {
    errors.push('Advanced optimization/reliability signal detected but no spec-kit/quantum-oracle/<task-id>/ bundle changed in this PR.');
  }

  if (optimizationBundles.length === 0) {
    errors.push('Advanced optimization/reliability signal detected but no changed closure_oracle.json declares required task type or oracle flags.');
  }

  optimizationBundles.forEach((taskId) => {
    const strict = runStrictBundleCheck(taskId);
    if (!strict.ok) {
      errors.push(`Strict closure check failed for task '${taskId}'.`);
      if (strict.output) {
        errors.push(strict.output);
      }
    }

    const debuggerEvidenceError = validateDebuggerEvidence(taskId);
    if (debuggerEvidenceError) {
      errors.push(`Debugger evidence check failed for task '${taskId}': ${debuggerEvidenceError}`);
    }

    const learningEvidenceError = validateLearningEvidence(taskId);
    if (learningEvidenceError) {
      errors.push(`Learning evidence check failed for task '${taskId}': ${learningEvidenceError}`);
    }
  });

  if (errors.length > 0) {
    console.error('Quantum PR Closure Gate: FAIL');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Quantum PR Closure Gate: PASS');
  console.log(`Validated advanced task bundles: ${optimizationBundles.join(', ')}`);
}

main();
