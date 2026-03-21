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

const REQUIRED_BACKEND_OPTIMIZATION_TOOLS = [
  'APITopologyOptimizer',
  'ContractEvolutionAnalyzer',
  'ReliabilityChaosSimulator',
  'GatewayPolicyVerifier',
  'QueryPerformanceEstimator',
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
        closure && (closure.requiresOptimizationOracle === true || optimizationTaskTypes.has(closure.taskType));

      if (requiresOptimizationOracle) {
        const layoutReportPath = path.join(bundleDir, 'layout_optimization_report.json');
        const behavioralTwinPath = path.join(bundleDir, 'behavioral_twin_report.json');

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

        if (Array.isArray(closure.activatedEliteTools)) {
          REQUIRED_FRONTEND_OPTIMIZATION_TOOLS.forEach((tool) => {
            if (!closure.activatedEliteTools.includes(tool)) {
              report.errors.push(`closure_oracle.json: missing optimization elite tool '${tool}' for optimization task`);
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
