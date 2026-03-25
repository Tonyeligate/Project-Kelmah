#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'belief_state.json',
  'delegation_packets.json',
  'closure_oracle.json',
  'risk_register.json',
  'counterfactual_worlds.json',
];

const REQUIRED_ELITE_TOOLS = [
  'EvidenceArtifactCompiler',
  'CompletionOracleChecker',
  'CounterfactualWorldScorer',
  'DelegationPacketBuilder',
  'VisualOracleRunner',
  'AdversarialSelfPlayOrchestrator',
  'QuantumScoreboardUpdater',
];

const REQUIRED_FRONTEND_ELITE_TOOLS = [
  'PerceptualContrastOracle',
  'TypographyRhythmSolver',
  'LayoutConstraintAnnealer',
  'ColorVisionSimulator',
  'SafeAreaInsetVerifier',
  'MotionSafetyAnalyzer',
  'ReadabilityScorer',
];

const REQUIRED_FRONTEND_OPTIMIZATION_TOOLS = [
  'QAOALayoutOptimizer',
  'GroverPathAuditor',
  'BehavioralTwinSimulator',
  'AdaptiveInterfaceController',
  'AccessibilityCloudAnalyzer',
];

const REQUIRED_IMMERSIVE_TOOLS = [
  'RenderBudgetProfiler',
  'ImmersiveInteractionAuditor',
  'DeterministicFallbackVerifier',
];

const REQUIRED_BACKEND_OPTIMIZATION_TOOLS = [
  'APITopologyOptimizer',
  'ContractEvolutionAnalyzer',
  'ReliabilityChaosSimulator',
  'GatewayPolicyVerifier',
  'QueryPerformanceEstimator',
];

const REQUIRED_DATABASE_TOOLS = [
  'SchemaDriftSentinel',
  'EnumConsistencyOracle',
  'QueryEnergyBudgetAnalyzer',
  'MigrationRollbackVerifier',
];

const REQUIRED_SECURITY_TOOLS = [
  'AttackReplayHarness',
  'ThreatSurfaceDeltaScanner',
  'MitigationProofGenerator',
  'ResidualRiskQuantifier',
];

const REQUIRED_REALTIME_TOOLS = [
  'EventCausalityTracer',
  'ListenerCardinalityGuard',
  'ReconnectConvergenceAnalyzer',
  'DeliveryFidelityScorer',
];

const REQUIRED_DEVOPS_TOOLS = [
  'DeploymentTwinComparator',
  'EnvironmentParityChecker',
  'MultiWorldGateVerifier',
  'InfraEntropyMonitor',
];

const REQUIRED_LEARNING_TOOLS = [
  'MistakePatternMiner',
  'FieldExperienceIngestor',
  'GuardrailEvolutionEngine',
  'RegressionPreventionCompiler',
];

function parseArgs(argv) {
  const parsed = {
    taskId: null,
    dir: null,
    strict: false,
    json: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--task-id') {
      parsed.taskId = argv[i + 1] || null;
      i += 1;
    } else if (token === '--dir') {
      parsed.dir = argv[i + 1] || null;
      i += 1;
    } else if (token === '--strict') {
      parsed.strict = true;
    } else if (token === '--json') {
      parsed.json = true;
    } else if (token === '--help' || token === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

function printHelp() {
  const lines = [
    'Quantum Completion Oracle Checker',
    '',
    'Usage:',
    '  node spec-kit/quantum-oracle/check-completion-oracle.js --task-id <task-id> [--strict] [--json]',
    '  node spec-kit/quantum-oracle/check-completion-oracle.js --dir <absolute-or-relative-dir> [--strict] [--json]',
    '',
    'Options:',
    '  --task-id  Task folder under spec-kit/quantum-oracle/<task-id>/',
    '  --dir      Explicit directory containing artifact bundle JSON files',
    '  --strict   Promote warnings to failures',
    '  --json     Print machine-readable report JSON',
    '  --help     Show this help text',
    '',
    'Required files in bundle:',
    ...REQUIRED_FILES.map((f) => `  - ${f}`),
  ];

  console.log(lines.join('\n'));
}

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

function readJson(filePath, errors, label) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    errors.push(`${label}: invalid JSON (${err.message})`);
    return null;
  }
}

function validateBeliefState(obj, errors, warnings) {
  if (!obj || !Array.isArray(obj.hypotheses) || obj.hypotheses.length === 0) {
    errors.push('belief_state.json: hypotheses array is required and must be non-empty');
    return;
  }

  let sum = 0;
  obj.hypotheses.forEach((h, idx) => {
    const p = h && h.probability;
    if (typeof p !== 'number' || Number.isNaN(p)) {
      errors.push(`belief_state.json: hypotheses[${idx}].probability must be a number`);
      return;
    }
    if (p < 0 || p > 1) {
      errors.push(`belief_state.json: hypotheses[${idx}].probability must be between 0 and 1`);
    }
    sum += p;
  });

  if (Math.abs(sum - 1) > 0.05) {
    warnings.push(`belief_state.json: probability sum is ${sum.toFixed(4)} (expected ~1.0)`);
  }
}

function validateDelegationPackets(obj, errors) {
  if (!obj || !Array.isArray(obj.packets) || obj.packets.length === 0) {
    errors.push('delegation_packets.json: packets array is required and must be non-empty');
    return;
  }

  obj.packets.forEach((p, idx) => {
    if (!p || typeof p !== 'object') {
      errors.push(`delegation_packets.json: packets[${idx}] must be an object`);
      return;
    }
    ['agent', 'triggerRule', 'filesMeasured', 'findings', 'confidence', 'verification'].forEach((k) => {
      if (!(k in p)) {
        errors.push(`delegation_packets.json: packets[${idx}] missing '${k}'`);
      }
    });
  });
}

function validateClosureOracle(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('closure_oracle.json: object is required');
    return;
  }

  if (obj.oracleState !== 'PASS') {
    errors.push(`closure_oracle.json: oracleState must be PASS (received '${obj.oracleState}')`);
  }

  const mustBeTrue = [
    'requiredDelegationsExecuted',
    'requiredDiagnosticsExecuted',
    'contradictionsResolved',
    'evidenceLogged',
  ];

  mustBeTrue.forEach((k) => {
    if (obj[k] !== true) {
      errors.push(`closure_oracle.json: ${k} must be true`);
    }
  });

  if (!Array.isArray(obj.activatedEliteTools)) {
    errors.push('closure_oracle.json: activatedEliteTools must be an array');
    return;
  }

  REQUIRED_ELITE_TOOLS.forEach((tool) => {
    if (!obj.activatedEliteTools.includes(tool)) {
      errors.push(`closure_oracle.json: missing required elite tool '${tool}'`);
    }
  });
}

function validateCounterfactualWorlds(obj, errors) {
  if (!obj || !Array.isArray(obj.worlds) || obj.worlds.length < 3) {
    errors.push('counterfactual_worlds.json: worlds array must include at least 3 worlds');
    return;
  }

  const ids = new Set(obj.worlds.map((w) => w && w.id).filter(Boolean));
  ['W1', 'W2', 'W3'].forEach((id) => {
    if (!ids.has(id)) {
      errors.push(`counterfactual_worlds.json: missing required world '${id}'`);
    }
  });

  if (!obj.selectedWorld || !ids.has(obj.selectedWorld)) {
    errors.push('counterfactual_worlds.json: selectedWorld must reference an existing world id');
  }
}

function validateRiskRegister(obj, errors) {
  if (!obj || !Array.isArray(obj.risks)) {
    errors.push('risk_register.json: risks array is required');
  }
}

function validateFrontendVisualOracle(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('frontend_visual_oracle.json: object is required');
    return;
  }

  if (!Array.isArray(obj.breakpoints)) {
    errors.push('frontend_visual_oracle.json: breakpoints must be an array');
  } else {
    const requiredBreakpoints = [320, 390, 768, 1024, 1280, 1440];
    requiredBreakpoints.forEach((bp) => {
      if (!obj.breakpoints.includes(bp)) {
        errors.push(`frontend_visual_oracle.json: missing breakpoint ${bp}`);
      }
    });
  }

  if (!Array.isArray(obj.displayDefects)) {
    errors.push('frontend_visual_oracle.json: displayDefects must be an array');
  }

  if (typeof obj.readabilityScore !== 'number' || obj.readabilityScore < 0 || obj.readabilityScore > 100) {
    errors.push('frontend_visual_oracle.json: readabilityScore must be a number between 0 and 100');
  }

  ['contrastChecks', 'touchTargetChecks', 'safeAreaChecks', 'motionChecks'].forEach((field) => {
    if (!Array.isArray(obj[field])) {
      errors.push(`frontend_visual_oracle.json: ${field} must be an array`);
    }
  });

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`frontend_visual_oracle.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateLayoutOptimizationReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('layout_optimization_report.json: object is required');
    return;
  }

  if (typeof obj.layoutCombinationsAnalyzed !== 'number' || obj.layoutCombinationsAnalyzed <= 0) {
    errors.push('layout_optimization_report.json: layoutCombinationsAnalyzed must be a positive number');
  }

  if (!Array.isArray(obj.algorithmsUsed) || obj.algorithmsUsed.length === 0) {
    errors.push('layout_optimization_report.json: algorithmsUsed must be a non-empty array');
  }

  if (!obj.objectiveScores || typeof obj.objectiveScores !== 'object') {
    errors.push('layout_optimization_report.json: objectiveScores object is required');
  }

  if (!Array.isArray(obj.breakpointsTested) || obj.breakpointsTested.length === 0) {
    errors.push('layout_optimization_report.json: breakpointsTested must be a non-empty array');
  }

  if (typeof obj.accessibilityEdgeCasesTested !== 'number' || obj.accessibilityEdgeCasesTested < 0) {
    errors.push('layout_optimization_report.json: accessibilityEdgeCasesTested must be a non-negative number');
  }

  if (!obj.binanceBenchmark || typeof obj.binanceBenchmark !== 'object') {
    errors.push('layout_optimization_report.json: binanceBenchmark object is required');
  } else {
    ['densityEfficiencyScore', 'scanabilityParityScore', 'primaryActionParityScore'].forEach((field) => {
      const value = obj.binanceBenchmark[field];
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`layout_optimization_report.json: binanceBenchmark.${field} must be a number between 0 and 100`);
      } else if (value < 85) {
        errors.push(`layout_optimization_report.json: binanceBenchmark.${field} must be >= 85 (received ${value})`);
      }
    });
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`layout_optimization_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateBehavioralTwinReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('behavioral_twin_report.json: object is required');
    return;
  }

  if (!Array.isArray(obj.profiles) || obj.profiles.length < 3) {
    errors.push('behavioral_twin_report.json: profiles must contain at least 3 profile entries');
  }

  if (!Array.isArray(obj.adaptationRules) || obj.adaptationRules.length === 0) {
    errors.push('behavioral_twin_report.json: adaptationRules must be a non-empty array');
  }

  if (!obj.safetyConstraints || typeof obj.safetyConstraints !== 'object') {
    errors.push('behavioral_twin_report.json: safetyConstraints object is required');
  }

  if (!obj.rollbackPlan || typeof obj.rollbackPlan !== 'object') {
    errors.push('behavioral_twin_report.json: rollbackPlan object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`behavioral_twin_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateAdaptivePolicyGuardrails(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('adaptive_policy_guardrails.json: object is required');
    return;
  }

  if (!Array.isArray(obj.guardrails) || obj.guardrails.length === 0) {
    errors.push('adaptive_policy_guardrails.json: guardrails must be a non-empty array');
  }

  if (!obj.safetyEnvelope || typeof obj.safetyEnvelope !== 'object') {
    errors.push('adaptive_policy_guardrails.json: safetyEnvelope object is required');
  }

  if (!obj.deterministicFallback || typeof obj.deterministicFallback !== 'object') {
    errors.push('adaptive_policy_guardrails.json: deterministicFallback object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`adaptive_policy_guardrails.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateUiStateSpaceAudit(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('ui_state_space_audit.json: object is required');
    return;
  }

  if (!Array.isArray(obj.frictionStatesDetected)) {
    errors.push('ui_state_space_audit.json: frictionStatesDetected must be an array');
  }

  if (!Array.isArray(obj.selfHealingActions) || obj.selfHealingActions.length === 0) {
    errors.push('ui_state_space_audit.json: selfHealingActions must be a non-empty array');
  }

  if (!obj.prohibitedActionAudit || typeof obj.prohibitedActionAudit !== 'object') {
    errors.push('ui_state_space_audit.json: prohibitedActionAudit object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`ui_state_space_audit.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateNisqHybridExecutionReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('nisq_hybrid_execution_report.json: object is required');
    return;
  }

  if (!obj.baseline || !obj.optimized) {
    errors.push('nisq_hybrid_execution_report.json: baseline and optimized sections are required');
  }

  if (!obj.computeBudget || typeof obj.computeBudget !== 'object') {
    errors.push('nisq_hybrid_execution_report.json: computeBudget object is required');
  }

  if (!obj.fallbackBehavior || typeof obj.fallbackBehavior !== 'object') {
    errors.push('nisq_hybrid_execution_report.json: fallbackBehavior object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`nisq_hybrid_execution_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateAllAgentActivationMatrix(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('all_agent_activation_matrix.json: object is required');
    return;
  }

  const requiredAgents = ['frontend', 'backend', 'database', 'security', 'realtime', 'devops', 'debugger'];
  if (!obj.agentActivations || typeof obj.agentActivations !== 'object') {
    errors.push('all_agent_activation_matrix.json: agentActivations object is required');
  } else {
    requiredAgents.forEach((agent) => {
      const activation = obj.agentActivations[agent];
      if (!activation || activation.activated !== true) {
        errors.push(`all_agent_activation_matrix.json: agent '${agent}' must be activated=true`);
      }
    });
  }

  if (!obj.verification || typeof obj.verification !== 'object') {
    errors.push('all_agent_activation_matrix.json: verification object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`all_agent_activation_matrix.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateThreeDHDDesignReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('three_d_hd_design_report.json: object is required');
    return;
  }

  if (!obj.surfaceTaxonomy || typeof obj.surfaceTaxonomy !== 'object') {
    errors.push('three_d_hd_design_report.json: surfaceTaxonomy object is required');
  }

  if (!obj.iconLanguageAudit || typeof obj.iconLanguageAudit !== 'object') {
    errors.push('three_d_hd_design_report.json: iconLanguageAudit object is required');
  }

  if (!obj.typographyRhythm || typeof obj.typographyRhythm !== 'object') {
    errors.push('three_d_hd_design_report.json: typographyRhythm object is required');
  }

  if (!Array.isArray(obj.motionChoreographyMap) || obj.motionChoreographyMap.length === 0) {
    errors.push('three_d_hd_design_report.json: motionChoreographyMap must be a non-empty array');
  }

  if (!Array.isArray(obj.responsiveDepthBreakpoints) || obj.responsiveDepthBreakpoints.length === 0) {
    errors.push('three_d_hd_design_report.json: responsiveDepthBreakpoints must be a non-empty array');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`three_d_hd_design_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateThreeDHDRenderBudget(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('three_d_hd_render_budget.json: object is required');
    return;
  }

  if (!obj.deviceClassBudgets || typeof obj.deviceClassBudgets !== 'object') {
    errors.push('three_d_hd_render_budget.json: deviceClassBudgets object is required');
  }

  if (!Array.isArray(obj.telemetryChecks) || obj.telemetryChecks.length === 0) {
    errors.push('three_d_hd_render_budget.json: telemetryChecks must be a non-empty array');
  }

  if (!obj.deterministicFallback || typeof obj.deterministicFallback !== 'object') {
    errors.push('three_d_hd_render_budget.json: deterministicFallback object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`three_d_hd_render_budget.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateImmersiveInteractionMap(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('immersive_interaction_map.json: object is required');
    return;
  }

  if (!Array.isArray(obj.interactionFlows) || obj.interactionFlows.length === 0) {
    errors.push('immersive_interaction_map.json: interactionFlows must be a non-empty array');
  }

  if (!obj.cognitiveLoadBudget || typeof obj.cognitiveLoadBudget !== 'object') {
    errors.push('immersive_interaction_map.json: cognitiveLoadBudget object is required');
  }

  if (!obj.outcomeDelta || typeof obj.outcomeDelta !== 'object') {
    errors.push('immersive_interaction_map.json: outcomeDelta object is required');
  }

  if (!obj.fallbackPath || typeof obj.fallbackPath !== 'object') {
    errors.push('immersive_interaction_map.json: fallbackPath object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`immersive_interaction_map.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateDebuggerOptimizationEvidence(packets, errors) {
  if (!packets || !Array.isArray(packets.packets)) {
    errors.push('delegation_packets.json: packets array is required for debugger optimization evidence');
    return;
  }

  const debuggerPacket = packets.packets.find((p) => p && p.agent === 'debugger');
  if (!debuggerPacket) {
    errors.push('delegation_packets.json: missing debugger packet for optimization/adaptive task');
    return;
  }

  const verificationStatus = debuggerPacket.verification && debuggerPacket.verification.status;
  if (verificationStatus !== 'pass') {
    errors.push(`delegation_packets.json: debugger verification.status must be pass (received '${verificationStatus || 'undefined'}')`);
  }

  if (!Array.isArray(debuggerPacket.findings) || debuggerPacket.findings.length === 0) {
    errors.push('delegation_packets.json: debugger packet findings must be a non-empty array');
  }
}

function validateApiTopologyReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('api_topology_report.json: object is required');
    return;
  }

  if (!Array.isArray(obj.endpointsTested) || obj.endpointsTested.length === 0) {
    errors.push('api_topology_report.json: endpointsTested must be a non-empty array');
  }

  if (!obj.routeShadowScan || typeof obj.routeShadowScan !== 'object') {
    errors.push('api_topology_report.json: routeShadowScan object is required');
  }

  if (!obj.contractCompatibility || typeof obj.contractCompatibility !== 'object') {
    errors.push('api_topology_report.json: contractCompatibility object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`api_topology_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateServiceReliabilityReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('service_reliability_report.json: object is required');
    return;
  }

  if (!obj.metrics || typeof obj.metrics !== 'object') {
    errors.push('service_reliability_report.json: metrics object is required');
  }

  if (!Array.isArray(obj.chaosScenarios) || obj.chaosScenarios.length === 0) {
    errors.push('service_reliability_report.json: chaosScenarios must be a non-empty array');
  }

  if (!obj.rollbackPlan || typeof obj.rollbackPlan !== 'object') {
    errors.push('service_reliability_report.json: rollbackPlan object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`service_reliability_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateLearningUpdateReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('learning_update.json: object is required');
    return;
  }

  if (!Array.isArray(obj.mistakesObserved) || obj.mistakesObserved.length === 0) {
    errors.push('learning_update.json: mistakesObserved must be a non-empty array');
  }

  if (!Array.isArray(obj.preventiveRulesAdded) || obj.preventiveRulesAdded.length === 0) {
    errors.push('learning_update.json: preventiveRulesAdded must be a non-empty array');
  }

  if (!Array.isArray(obj.testOrOracleImprovements) || obj.testOrOracleImprovements.length === 0) {
    errors.push('learning_update.json: testOrOracleImprovements must be a non-empty array');
  }

  if (!Array.isArray(obj.skillAcquisitions) || obj.skillAcquisitions.length === 0) {
    errors.push('learning_update.json: skillAcquisitions must be a non-empty array');
  }

  if (!Array.isArray(obj.skillSources) || obj.skillSources.length === 0) {
    errors.push('learning_update.json: skillSources must be a non-empty array');
  }

  if (!Array.isArray(obj.skillTransferEvidence) || obj.skillTransferEvidence.length === 0) {
    errors.push('learning_update.json: skillTransferEvidence must be a non-empty array');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`learning_update.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateFieldExperienceReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('field_experience_report.json: object is required');
    return;
  }

  if (!Array.isArray(obj.realWorldSignals) || obj.realWorldSignals.length === 0) {
    errors.push('field_experience_report.json: realWorldSignals must be a non-empty array');
  }

  if (!Array.isArray(obj.userPainPoints) || obj.userPainPoints.length === 0) {
    errors.push('field_experience_report.json: userPainPoints must be a non-empty array');
  }

  if (!Array.isArray(obj.policyAdjustments) || obj.policyAdjustments.length === 0) {
    errors.push('field_experience_report.json: policyAdjustments must be a non-empty array');
  }

  if (!obj.rollbackLessons || typeof obj.rollbackLessons !== 'object') {
    errors.push('field_experience_report.json: rollbackLessons object is required');
  }

  if (obj.closureVerdict !== 'PASS') {
    errors.push(`field_experience_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateSchemaDriftReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('schema_drift_report.json: object is required');
    return;
  }
  if (!Array.isArray(obj.collectionsChecked) || obj.collectionsChecked.length === 0) {
    errors.push('schema_drift_report.json: collectionsChecked must be a non-empty array');
  }
  if (typeof obj.driftCount !== 'number' || obj.driftCount < 0) {
    errors.push('schema_drift_report.json: driftCount must be a non-negative number');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`schema_drift_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateEnumConsistencyReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('enum_consistency_report.json: object is required');
    return;
  }
  if (!Array.isArray(obj.enumsChecked) || obj.enumsChecked.length === 0) {
    errors.push('enum_consistency_report.json: enumsChecked must be a non-empty array');
  }
  if (typeof obj.mismatchCount !== 'number' || obj.mismatchCount < 0) {
    errors.push('enum_consistency_report.json: mismatchCount must be a non-negative number');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`enum_consistency_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateQueryEnergyBudget(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('query_energy_budget.json: object is required');
    return;
  }
  if (!Array.isArray(obj.queries) || obj.queries.length === 0) {
    errors.push('query_energy_budget.json: queries must be a non-empty array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`query_energy_budget.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateMigrationSafetyReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('migration_safety_report.json: object is required');
    return;
  }
  if (!obj.forwardPlan || !obj.rollbackPlan || !Array.isArray(obj.validationQueries)) {
    errors.push('migration_safety_report.json: forwardPlan, rollbackPlan, and validationQueries are required');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`migration_safety_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateAttackReplayMatrix(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('attack_replay_matrix.json: object is required');
    return;
  }
  if (!Array.isArray(obj.attackVectors) || obj.attackVectors.length === 0) {
    errors.push('attack_replay_matrix.json: attackVectors must be a non-empty array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`attack_replay_matrix.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateMitigationEffectiveness(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('mitigation_effectiveness.json: object is required');
    return;
  }
  if (!Array.isArray(obj.mitigations) || obj.mitigations.length === 0) {
    errors.push('mitigation_effectiveness.json: mitigations must be a non-empty array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`mitigation_effectiveness.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateResidualRiskQuantification(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('residual_risk_quantification.json: object is required');
    return;
  }
  if (!Array.isArray(obj.risks) || obj.risks.length === 0) {
    errors.push('residual_risk_quantification.json: risks must be a non-empty array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`residual_risk_quantification.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateEventCausalityLedger(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('event_causality_ledger.json: object is required');
    return;
  }
  if (!Array.isArray(obj.eventsChecked) || obj.eventsChecked.length === 0) {
    errors.push('event_causality_ledger.json: eventsChecked must be a non-empty array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`event_causality_ledger.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateListenerCardinalityReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('listener_cardinality_report.json: object is required');
    return;
  }
  if (typeof obj.maxListenerDelta !== 'number' || obj.maxListenerDelta < 0) {
    errors.push('listener_cardinality_report.json: maxListenerDelta must be a non-negative number');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`listener_cardinality_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateReconnectConsistencyReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('reconnect_consistency_report.json: object is required');
    return;
  }
  if (!Array.isArray(obj.scenarios) || obj.scenarios.length === 0) {
    errors.push('reconnect_consistency_report.json: scenarios must be a non-empty array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`reconnect_consistency_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateDeploymentTwinState(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('deployment_twin_state.json: object is required');
    return;
  }
  if (!obj.localState || !obj.remoteState) {
    errors.push('deployment_twin_state.json: localState and remoteState are required');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`deployment_twin_state.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateEnvDriftDelta(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('env_drift_delta.json: object is required');
    return;
  }
  if (!Array.isArray(obj.differences)) {
    errors.push('env_drift_delta.json: differences must be an array');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`env_drift_delta.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function validateWorldVerificationReport(obj, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push('world_verification_report.json: object is required');
    return;
  }
  if (!Array.isArray(obj.worlds) || obj.worlds.length < 5) {
    errors.push('world_verification_report.json: worlds must be an array with at least 5 entries');
  }
  if (obj.closureVerdict !== 'PASS') {
    errors.push(`world_verification_report.json: closureVerdict must be PASS (received '${obj.closureVerdict}')`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.taskId && !args.dir) {
    console.error('ERROR: provide --task-id or --dir');
    printHelp();
    process.exit(1);
  }

  const bundleDir = args.dir
    ? path.resolve(args.dir)
    : path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', args.taskId);

  const report = {
    bundleDir,
    missingFiles: [],
    errors: [],
    warnings: [],
    status: 'PASS',
  };

  REQUIRED_FILES.forEach((f) => {
    const fp = path.join(bundleDir, f);
    if (!exists(fp)) {
      report.missingFiles.push(f);
    }
  });

  if (report.missingFiles.length > 0) {
    report.errors.push(`Missing required files: ${report.missingFiles.join(', ')}`);
  }

  if (report.errors.length === 0) {
    const belief = readJson(path.join(bundleDir, 'belief_state.json'), report.errors, 'belief_state.json');
    const packets = readJson(path.join(bundleDir, 'delegation_packets.json'), report.errors, 'delegation_packets.json');
    const closure = readJson(path.join(bundleDir, 'closure_oracle.json'), report.errors, 'closure_oracle.json');
    const risk = readJson(path.join(bundleDir, 'risk_register.json'), report.errors, 'risk_register.json');
    const worlds = readJson(path.join(bundleDir, 'counterfactual_worlds.json'), report.errors, 'counterfactual_worlds.json');

    if (report.errors.length === 0) {
      validateBeliefState(belief, report.errors, report.warnings);
      validateDelegationPackets(packets, report.errors);
      validateClosureOracle(closure, report.errors);
      validateRiskRegister(risk, report.errors);
      validateCounterfactualWorlds(worlds, report.errors);

      const requiresFrontendVisualOracle =
        closure && (closure.requiresFrontendVisualOracle === true || closure.taskType === 'visible-ui-bug');

      if (requiresFrontendVisualOracle) {
        const frontendOraclePath = path.join(bundleDir, 'frontend_visual_oracle.json');
        if (!exists(frontendOraclePath)) {
          report.errors.push('Missing required file: frontend_visual_oracle.json');
        } else {
          const frontendOracle = readJson(frontendOraclePath, report.errors, 'frontend_visual_oracle.json');
          if (frontendOracle) {
            validateFrontendVisualOracle(frontendOracle, report.errors);
          }
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_FRONTEND_ELITE_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing frontend elite tool '${tool}' for visible-ui-bug task`);
            }
          });
        }
      }

      const optimizationTaskTypes = new Set(['ui-optimization', 'adaptive-interface', 'design-flow-optimization']);
      const requiresOptimizationOracle =
        closure && (closure.requiresOptimizationOracle === true || closure.requiresImmersiveOracle === true || optimizationTaskTypes.has(closure.taskType));

      if (requiresOptimizationOracle) {
        const layoutReportPath = path.join(bundleDir, 'layout_optimization_report.json');
        const behavioralTwinPath = path.join(bundleDir, 'behavioral_twin_report.json');
        const adaptivePolicyPath = path.join(bundleDir, 'adaptive_policy_guardrails.json');
        const stateSpacePath = path.join(bundleDir, 'ui_state_space_audit.json');
        const nisqPath = path.join(bundleDir, 'nisq_hybrid_execution_report.json');
        const activationPath = path.join(bundleDir, 'all_agent_activation_matrix.json');
        const threeDHDPath = path.join(bundleDir, 'three_d_hd_design_report.json');
        const threeDHDRenderBudgetPath = path.join(bundleDir, 'three_d_hd_render_budget.json');
        const immersiveInteractionMapPath = path.join(bundleDir, 'immersive_interaction_map.json');

        if (!exists(layoutReportPath)) {
          report.errors.push('Missing required file: layout_optimization_report.json');
        } else {
          const layoutReport = readJson(layoutReportPath, report.errors, 'layout_optimization_report.json');
          if (layoutReport) {
            validateLayoutOptimizationReport(layoutReport, report.errors);
          }
        }

        if (!exists(behavioralTwinPath)) {
          report.errors.push('Missing required file: behavioral_twin_report.json');
        } else {
          const twinReport = readJson(behavioralTwinPath, report.errors, 'behavioral_twin_report.json');
          if (twinReport) {
            validateBehavioralTwinReport(twinReport, report.errors);
          }
        }

        if (!exists(adaptivePolicyPath)) {
          report.errors.push('Missing required file: adaptive_policy_guardrails.json');
        } else {
          const policy = readJson(adaptivePolicyPath, report.errors, 'adaptive_policy_guardrails.json');
          if (policy) {
            validateAdaptivePolicyGuardrails(policy, report.errors);
          }
        }

        if (!exists(stateSpacePath)) {
          report.errors.push('Missing required file: ui_state_space_audit.json');
        } else {
          const audit = readJson(stateSpacePath, report.errors, 'ui_state_space_audit.json');
          if (audit) {
            validateUiStateSpaceAudit(audit, report.errors);
          }
        }

        if (!exists(nisqPath)) {
          report.errors.push('Missing required file: nisq_hybrid_execution_report.json');
        } else {
          const nisq = readJson(nisqPath, report.errors, 'nisq_hybrid_execution_report.json');
          if (nisq) {
            validateNisqHybridExecutionReport(nisq, report.errors);
          }
        }

        if (!exists(activationPath)) {
          report.errors.push('Missing required file: all_agent_activation_matrix.json');
        } else {
          const activation = readJson(activationPath, report.errors, 'all_agent_activation_matrix.json');
          if (activation) {
            validateAllAgentActivationMatrix(activation, report.errors);
          }
        }

        if (!exists(threeDHDPath)) {
          report.errors.push('Missing required file: three_d_hd_design_report.json');
        } else {
          const threeDHD = readJson(threeDHDPath, report.errors, 'three_d_hd_design_report.json');
          if (threeDHD) {
            validateThreeDHDDesignReport(threeDHD, report.errors);
          }
        }

        if (!exists(threeDHDRenderBudgetPath)) {
          report.errors.push('Missing required file: three_d_hd_render_budget.json');
        } else {
          const budget = readJson(threeDHDRenderBudgetPath, report.errors, 'three_d_hd_render_budget.json');
          if (budget) {
            validateThreeDHDRenderBudget(budget, report.errors);
          }
        }

        if (!exists(immersiveInteractionMapPath)) {
          report.errors.push('Missing required file: immersive_interaction_map.json');
        } else {
          const interactionMap = readJson(immersiveInteractionMapPath, report.errors, 'immersive_interaction_map.json');
          if (interactionMap) {
            validateImmersiveInteractionMap(interactionMap, report.errors);
          }
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_FRONTEND_OPTIMIZATION_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing optimization elite tool '${tool}' for optimization task`);
            }
          });

          REQUIRED_IMMERSIVE_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing immersive elite tool '${tool}' for optimization task`);
            }
          });
        }

        validateDebuggerOptimizationEvidence(packets, report.errors);
      }

      const backendTaskTypes = new Set(['backend-optimization', 'api-design-optimization', 'reliability-hardening']);
      const requiresBackendOracle =
        closure && (closure.requiresBackendOracle === true || backendTaskTypes.has(closure.taskType));

      if (requiresBackendOracle) {
        const apiTopologyPath = path.join(bundleDir, 'api_topology_report.json');
        const reliabilityPath = path.join(bundleDir, 'service_reliability_report.json');

        if (!exists(apiTopologyPath)) {
          report.errors.push('Missing required file: api_topology_report.json');
        } else {
          const apiTopology = readJson(apiTopologyPath, report.errors, 'api_topology_report.json');
          if (apiTopology) {
            validateApiTopologyReport(apiTopology, report.errors);
          }
        }

        if (!exists(reliabilityPath)) {
          report.errors.push('Missing required file: service_reliability_report.json');
        } else {
          const reliability = readJson(reliabilityPath, report.errors, 'service_reliability_report.json');
          if (reliability) {
            validateServiceReliabilityReport(reliability, report.errors);
          }
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_BACKEND_OPTIMIZATION_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing backend elite tool '${tool}' for backend optimization task`);
            }
          });
        }

        validateDebuggerOptimizationEvidence(packets, report.errors);
      }

      const databaseTaskTypes = new Set(['database-integrity-hardening']);
      const requiresDatabaseOracle =
        closure && (closure.requiresDatabaseOracle === true || databaseTaskTypes.has(closure.taskType));

      if (requiresDatabaseOracle) {
        const driftPath = path.join(bundleDir, 'schema_drift_report.json');
        const enumPath = path.join(bundleDir, 'enum_consistency_report.json');
        const qebPath = path.join(bundleDir, 'query_energy_budget.json');
        const migPath = path.join(bundleDir, 'migration_safety_report.json');

        if (!exists(driftPath)) {
          report.errors.push('Missing required file: schema_drift_report.json');
        } else {
          const drift = readJson(driftPath, report.errors, 'schema_drift_report.json');
          if (drift) validateSchemaDriftReport(drift, report.errors);
        }

        if (!exists(enumPath)) {
          report.errors.push('Missing required file: enum_consistency_report.json');
        } else {
          const enumReport = readJson(enumPath, report.errors, 'enum_consistency_report.json');
          if (enumReport) validateEnumConsistencyReport(enumReport, report.errors);
        }

        if (!exists(qebPath)) {
          report.errors.push('Missing required file: query_energy_budget.json');
        } else {
          const qeb = readJson(qebPath, report.errors, 'query_energy_budget.json');
          if (qeb) validateQueryEnergyBudget(qeb, report.errors);
        }

        if (!exists(migPath)) {
          report.errors.push('Missing required file: migration_safety_report.json');
        } else {
          const migration = readJson(migPath, report.errors, 'migration_safety_report.json');
          if (migration) validateMigrationSafetyReport(migration, report.errors);
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_DATABASE_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing database elite tool '${tool}' for database integrity task`);
            }
          });
        }

        validateDebuggerOptimizationEvidence(packets, report.errors);
      }

      const securityTaskTypes = new Set(['security-hardening']);
      const requiresSecurityOracle =
        closure && (closure.requiresSecurityOracle === true || securityTaskTypes.has(closure.taskType));

      if (requiresSecurityOracle) {
        const attackPath = path.join(bundleDir, 'attack_replay_matrix.json');
        const mitigationPath = path.join(bundleDir, 'mitigation_effectiveness.json');
        const residualPath = path.join(bundleDir, 'residual_risk_quantification.json');

        if (!exists(attackPath)) {
          report.errors.push('Missing required file: attack_replay_matrix.json');
        } else {
          const attack = readJson(attackPath, report.errors, 'attack_replay_matrix.json');
          if (attack) validateAttackReplayMatrix(attack, report.errors);
        }

        if (!exists(mitigationPath)) {
          report.errors.push('Missing required file: mitigation_effectiveness.json');
        } else {
          const mitigation = readJson(mitigationPath, report.errors, 'mitigation_effectiveness.json');
          if (mitigation) validateMitigationEffectiveness(mitigation, report.errors);
        }

        if (!exists(residualPath)) {
          report.errors.push('Missing required file: residual_risk_quantification.json');
        } else {
          const residual = readJson(residualPath, report.errors, 'residual_risk_quantification.json');
          if (residual) validateResidualRiskQuantification(residual, report.errors);
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_SECURITY_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing security elite tool '${tool}' for security hardening task`);
            }
          });
        }

        validateDebuggerOptimizationEvidence(packets, report.errors);
      }

      const realtimeTaskTypes = new Set(['realtime-reliability']);
      const requiresRealtimeOracle =
        closure && (closure.requiresRealtimeOracle === true || realtimeTaskTypes.has(closure.taskType));

      if (requiresRealtimeOracle) {
        const causalityPath = path.join(bundleDir, 'event_causality_ledger.json');
        const cardinalityPath = path.join(bundleDir, 'listener_cardinality_report.json');
        const reconnectPath = path.join(bundleDir, 'reconnect_consistency_report.json');

        if (!exists(causalityPath)) {
          report.errors.push('Missing required file: event_causality_ledger.json');
        } else {
          const causality = readJson(causalityPath, report.errors, 'event_causality_ledger.json');
          if (causality) validateEventCausalityLedger(causality, report.errors);
        }

        if (!exists(cardinalityPath)) {
          report.errors.push('Missing required file: listener_cardinality_report.json');
        } else {
          const cardinality = readJson(cardinalityPath, report.errors, 'listener_cardinality_report.json');
          if (cardinality) validateListenerCardinalityReport(cardinality, report.errors);
        }

        if (!exists(reconnectPath)) {
          report.errors.push('Missing required file: reconnect_consistency_report.json');
        } else {
          const reconnect = readJson(reconnectPath, report.errors, 'reconnect_consistency_report.json');
          if (reconnect) validateReconnectConsistencyReport(reconnect, report.errors);
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_REALTIME_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing realtime elite tool '${tool}' for realtime reliability task`);
            }
          });
        }

        validateDebuggerOptimizationEvidence(packets, report.errors);
      }

      const devopsTaskTypes = new Set(['infra-coherence']);
      const requiresDevopsOracle =
        closure && (closure.requiresDevopsOracle === true || devopsTaskTypes.has(closure.taskType));

      if (requiresDevopsOracle) {
        const twinPath = path.join(bundleDir, 'deployment_twin_state.json');
        const driftPath = path.join(bundleDir, 'env_drift_delta.json');
        const worldPath = path.join(bundleDir, 'world_verification_report.json');

        if (!exists(twinPath)) {
          report.errors.push('Missing required file: deployment_twin_state.json');
        } else {
          const twin = readJson(twinPath, report.errors, 'deployment_twin_state.json');
          if (twin) validateDeploymentTwinState(twin, report.errors);
        }

        if (!exists(driftPath)) {
          report.errors.push('Missing required file: env_drift_delta.json');
        } else {
          const drift = readJson(driftPath, report.errors, 'env_drift_delta.json');
          if (drift) validateEnvDriftDelta(drift, report.errors);
        }

        if (!exists(worldPath)) {
          report.errors.push('Missing required file: world_verification_report.json');
        } else {
          const world = readJson(worldPath, report.errors, 'world_verification_report.json');
          if (world) validateWorldVerificationReport(world, report.errors);
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_DEVOPS_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing devops elite tool '${tool}' for infra coherence task`);
            }
          });
        }

        validateDebuggerOptimizationEvidence(packets, report.errors);
      }

      const requiresLearningOracle = closure && closure.requiresLearningOracle === true;
      if (requiresLearningOracle) {
        const learningPath = path.join(bundleDir, 'learning_update.json');
        const fieldPath = path.join(bundleDir, 'field_experience_report.json');

        if (!exists(learningPath)) {
          report.errors.push('Missing required file: learning_update.json');
        } else {
          const learning = readJson(learningPath, report.errors, 'learning_update.json');
          if (learning) {
            validateLearningUpdateReport(learning, report.errors);
          }
        }

        if (!exists(fieldPath)) {
          report.errors.push('Missing required file: field_experience_report.json');
        } else {
          const field = readJson(fieldPath, report.errors, 'field_experience_report.json');
          if (field) {
            validateFieldExperienceReport(field, report.errors);
          }
        }

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_LEARNING_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing learning elite tool '${tool}' for learning-enabled task`);
            }
          });
        }
      }
    }
  }

  if (args.strict && report.warnings.length > 0) {
    report.errors.push(`Strict mode: warnings present (${report.warnings.length})`);
  }

  if (report.errors.length > 0) {
    report.status = 'FAIL';
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Quantum Completion Oracle Check: ${report.status}`);
    console.log(`Bundle: ${report.bundleDir}`);
    if (report.warnings.length > 0) {
      console.log('Warnings:');
      report.warnings.forEach((w) => console.log(`  - ${w}`));
    }
    if (report.errors.length > 0) {
      console.log('Errors:');
      report.errors.forEach((e) => console.log(`  - ${e}`));
    }
  }

  process.exit(report.status === 'PASS' ? 0 : 1);
}

main();
