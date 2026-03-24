#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const parsed = {
    rootDir: path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle'),
    outFile: path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', 'learning-ledger-summary.json'),
    pretty: true,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--root') {
      parsed.rootDir = path.resolve(argv[i + 1] || parsed.rootDir);
      i += 1;
    } else if (token === '--out') {
      parsed.outFile = path.resolve(argv[i + 1] || parsed.outFile);
      i += 1;
    } else if (token === '--compact') {
      parsed.pretty = false;
    }
  }

  return parsed;
}

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function normalizeFact(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toTopList(counterMap, limit = 10) {
  return Array.from(counterMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item, count]) => ({ item, count }));
}

function main() {
  const args = parseArgs(process.argv);
  const root = args.rootDir;

  if (!exists(root)) {
    console.error(`Learning aggregator failed: root directory not found: ${root}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const taskDirs = entries
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== 'templates' && name !== 'examples');

  const recurringMistakes = new Map();
  const recurringSignals = new Map();
  const recurringPainPoints = new Map();
  const recurringPolicyAdjustments = new Map();
  const recurringSkillAcquisitions = new Map();
  const recurringSkillSources = new Map();
  const immersiveGapCounters = new Map([
    ['three_d_hd_design_report.json', 0],
    ['three_d_hd_render_budget.json', 0],
    ['immersive_interaction_map.json', 0],
  ]);

  const tasks = [];
  const advancedMissingLearningEvidence = [];
  let immersiveTaskCount = 0;
  let immersiveCompleteCount = 0;

  taskDirs.forEach((taskId) => {
    const dir = path.join(root, taskId);
    const closure = readJson(path.join(dir, 'closure_oracle.json'));
    const learning = readJson(path.join(dir, 'learning_update.json'));
    const field = readJson(path.join(dir, 'field_experience_report.json'));

    const requiresLearning = !!(closure && closure.requiresLearningOracle === true);
    const taskType = closure && closure.taskType ? closure.taskType : 'unknown';
    const activatedEliteToolsCount = Array.isArray(closure && closure.activatedEliteTools)
      ? closure.activatedEliteTools.length
      : 0;

    const isImmersiveTask = new Set(['ui-optimization', 'adaptive-interface', 'design-flow-optimization']).has(taskType);
    const hasThreeDHDDesignReport = exists(path.join(dir, 'three_d_hd_design_report.json'));
    const hasThreeDHDRenderBudget = exists(path.join(dir, 'three_d_hd_render_budget.json'));
    const hasImmersiveInteractionMap = exists(path.join(dir, 'immersive_interaction_map.json'));
    const immersiveEvidenceCount = [hasThreeDHDDesignReport, hasThreeDHDRenderBudget, hasImmersiveInteractionMap].filter(Boolean).length;
    const immersiveEvidenceComplete = immersiveEvidenceCount === 3;

    if (isImmersiveTask) {
      immersiveTaskCount += 1;
      if (immersiveEvidenceComplete) {
        immersiveCompleteCount += 1;
      } else {
        if (!hasThreeDHDDesignReport) immersiveGapCounters.set('three_d_hd_design_report.json', (immersiveGapCounters.get('three_d_hd_design_report.json') || 0) + 1);
        if (!hasThreeDHDRenderBudget) immersiveGapCounters.set('three_d_hd_render_budget.json', (immersiveGapCounters.get('three_d_hd_render_budget.json') || 0) + 1);
        if (!hasImmersiveInteractionMap) immersiveGapCounters.set('immersive_interaction_map.json', (immersiveGapCounters.get('immersive_interaction_map.json') || 0) + 1);
      }
    }

    if (requiresLearning && (!learning || !field)) {
      advancedMissingLearningEvidence.push(taskId);
    }

    if (!learning && !field) {
      return;
    }

    const mistakesObserved = Array.isArray(learning && learning.mistakesObserved) ? learning.mistakesObserved : [];
    const preventiveRulesAdded = Array.isArray(learning && learning.preventiveRulesAdded) ? learning.preventiveRulesAdded : [];
    const testOrOracleImprovements = Array.isArray(learning && learning.testOrOracleImprovements) ? learning.testOrOracleImprovements : [];
    const skillAcquisitions = Array.isArray(learning && learning.skillAcquisitions) ? learning.skillAcquisitions : [];
    const skillSources = Array.isArray(learning && learning.skillSources) ? learning.skillSources : [];
    const skillTransferEvidence = Array.isArray(learning && learning.skillTransferEvidence) ? learning.skillTransferEvidence : [];

    const realWorldSignals = Array.isArray(field && field.realWorldSignals) ? field.realWorldSignals : [];
    const userPainPoints = Array.isArray(field && field.userPainPoints) ? field.userPainPoints : [];
    const policyAdjustments = Array.isArray(field && field.policyAdjustments) ? field.policyAdjustments : [];

    mistakesObserved.forEach((m) => {
      const key = normalizeFact(m);
      if (key) recurringMistakes.set(key, (recurringMistakes.get(key) || 0) + 1);
    });

    realWorldSignals.forEach((s) => {
      const key = normalizeFact(s);
      if (key) recurringSignals.set(key, (recurringSignals.get(key) || 0) + 1);
    });

    userPainPoints.forEach((p) => {
      const key = normalizeFact(p);
      if (key) recurringPainPoints.set(key, (recurringPainPoints.get(key) || 0) + 1);
    });

    policyAdjustments.forEach((p) => {
      const key = normalizeFact(p);
      if (key) recurringPolicyAdjustments.set(key, (recurringPolicyAdjustments.get(key) || 0) + 1);
    });

    skillAcquisitions.forEach((s) => {
      const key = normalizeFact(s);
      if (key) recurringSkillAcquisitions.set(key, (recurringSkillAcquisitions.get(key) || 0) + 1);
    });

    skillSources.forEach((s) => {
      const key = normalizeFact(s);
      if (key) recurringSkillSources.set(key, (recurringSkillSources.get(key) || 0) + 1);
    });

    tasks.push({
      taskId,
      taskType,
      requiresLearningOracle: requiresLearning,
      activatedEliteToolsCount,
      mistakesCount: mistakesObserved.length,
      preventiveRulesCount: preventiveRulesAdded.length,
      oracleImprovementsCount: testOrOracleImprovements.length,
      realWorldSignalsCount: realWorldSignals.length,
      userPainPointsCount: userPainPoints.length,
      policyAdjustmentsCount: policyAdjustments.length,
      skillAcquisitionsCount: skillAcquisitions.length,
      skillSourcesCount: skillSources.length,
      skillTransferEvidenceCount: skillTransferEvidence.length,
      immersiveEvidenceCount,
      immersiveEvidenceComplete,
      hasThreeDHDDesignReport,
      hasThreeDHDRenderBudget,
      hasImmersiveInteractionMap,
      hasLearningUpdate: !!learning,
      hasFieldExperience: !!field,
    });
  });

  const summary = {
    generatedAtUtc: new Date().toISOString(),
    rootDir: root,
    taskDirectoryCount: taskDirs.length,
    learningEnabledTaskCount: tasks.filter((t) => t.requiresLearningOracle).length,
    learningArtifactTaskCount: tasks.length,
    immersiveTaskCount,
    immersiveCompleteCount,
    immersiveCoveragePct: immersiveTaskCount > 0
      ? Math.round((immersiveCompleteCount / immersiveTaskCount) * 1000) / 10
      : null,
    advancedMissingLearningEvidence,
    trends: {
      topRecurringMistakes: toTopList(recurringMistakes, 15),
      topRealWorldSignals: toTopList(recurringSignals, 15),
      topUserPainPoints: toTopList(recurringPainPoints, 15),
      topPolicyAdjustments: toTopList(recurringPolicyAdjustments, 15),
      topSkillAcquisitions: toTopList(recurringSkillAcquisitions, 15),
      topSkillSources: toTopList(recurringSkillSources, 15),
      topImmersiveGaps: toTopList(immersiveGapCounters, 10),
    },
    tasks,
  };

  fs.writeFileSync(args.outFile, JSON.stringify(summary, null, args.pretty ? 2 : 0) + '\n', 'utf8');

  console.log('Learning Ledger Aggregation: PASS');
  console.log(`Output: ${args.outFile}`);
  console.log(`Tasks with learning artifacts: ${summary.learningArtifactTaskCount}`);
  console.log(`Learning-enabled tasks: ${summary.learningEnabledTaskCount}`);
  if (advancedMissingLearningEvidence.length > 0) {
    console.log(`Advanced tasks missing learning evidence: ${advancedMissingLearningEvidence.join(', ')}`);
  }
}

main();
