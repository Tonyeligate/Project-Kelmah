#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const AGENTS = [
  { id: 'frontend', gatePrefix: 'VIS-', file: '.claude/agents/frontend.agent.md' },
  { id: 'backend', gatePrefix: 'BFL-', file: '.claude/agents/backend.agent.md' },
  { id: 'database', gatePrefix: 'DFL-', file: '.claude/agents/database.agent.md' },
  { id: 'security', gatePrefix: 'SFL-', file: '.claude/agents/security.agent.md' },
  { id: 'realtime', gatePrefix: 'RFL-', file: '.claude/agents/realtime.agent.md' },
  { id: 'devops', gatePrefix: 'OFL-', file: '.claude/agents/devops.agent.md' },
  { id: 'debugger', gatePrefix: 'GFL-', file: '.claude/agents/debugger.agent.md' },
];

const TASK_TYPE_TO_AGENT = {
  'ui-optimization': 'frontend',
  'adaptive-interface': 'frontend',
  'design-flow-optimization': 'frontend',
  'backend-optimization': 'backend',
  'api-design-optimization': 'backend',
  'reliability-hardening': 'backend',
  'database-integrity-hardening': 'database',
  'security-hardening': 'security',
  'realtime-reliability': 'realtime',
  'infra-coherence': 'devops',
};

function parseArgs(argv) {
  const parsed = {
    summaryPath: path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', 'learning-ledger-summary.json'),
    outPath: path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', 'agent-intelligence-report.json'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--summary') {
      parsed.summaryPath = path.resolve(argv[i + 1] || parsed.summaryPath);
      i += 1;
    } else if (token === '--out') {
      parsed.outPath = path.resolve(argv[i + 1] || parsed.outPath);
      i += 1;
    }
  }

  return parsed;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function toPct(v) {
  return Math.round(clamp(v, 0, 1) * 1000) / 10;
}

function getQuarterLabel(date) {
  const d = new Date(date);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q}-${d.getUTCFullYear()}`;
}

function countAgentGates(filePath, prefix) {
  try {
    const content = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
    const re = new RegExp(`^###\\s+${prefix.replace('-', '\\-')}\\d+`, 'gm');
    const matches = content.match(re);
    return matches ? matches.length : 0;
  } catch (_) {
    return 0;
  }
}

function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(args.summaryPath)) {
    console.error(`Agent Intelligence Report: FAIL`);
    console.error(`  - Missing learning summary: ${args.summaryPath}`);
    process.exit(1);
  }

  const summary = readJson(args.summaryPath);
  const tasks = Array.isArray(summary.tasks) ? summary.tasks : [];

  const perAgentTasks = new Map(AGENTS.map((a) => [a.id, []]));
  tasks.forEach((t) => {
    const mapped = TASK_TYPE_TO_AGENT[t.taskType] || (t.taskType === 'unknown' ? null : null);
    if (mapped && perAgentTasks.has(mapped)) {
      perAgentTasks.get(mapped).push(t);
    }
  });

  const agentScores = AGENTS.map((a) => {
    const agentTasks = perAgentTasks.get(a.id) || [];
    const learningTasks = agentTasks.filter((t) => t.requiresLearningOracle === true);

    const growthVelocityRaw = learningTasks.length / Math.max(1, summary.learningEnabledTaskCount || 1);

    const transferNumerator = learningTasks.filter((t) => (t.skillTransferEvidenceCount || 0) > 0).length;
    const transferRaw = learningTasks.length > 0 ? transferNumerator / learningTasks.length : 0;

    const preventionRaw = learningTasks.length > 0
      ? learningTasks.reduce((acc, t) => acc + ((t.preventiveRulesCount || 0) + (t.oracleImprovementsCount || 0)), 0) / (learningTasks.length * 4)
      : 0;

    const gateCount = countAgentGates(a.file, a.gatePrefix);
    const gateMaturityRaw = clamp(gateCount / 16, 0, 1);

    const overallRaw = (0.35 * growthVelocityRaw) + (0.30 * transferRaw) + (0.25 * preventionRaw) + (0.10 * gateMaturityRaw);

    return {
      agent: a.id,
      gateCount,
      learningTasks: learningTasks.length,
      growthVelocity: toPct(growthVelocityRaw),
      transferSuccess: toPct(transferRaw),
      regressionPreventionStrength: toPct(preventionRaw),
      gateMaturity: toPct(gateMaturityRaw),
      overallScore: toPct(overallRaw),
    };
  });

  const ranked = [...agentScores].sort((x, y) => y.overallScore - x.overallScore);

  const report = {
    generatedAtUtc: new Date().toISOString(),
    quarter: getQuarterLabel(new Date()),
    inputSummary: path.relative(process.cwd(), args.summaryPath).replace(/\\/g, '/'),
    learningEnabledTaskCount: summary.learningEnabledTaskCount || 0,
    advancedMissingLearningEvidence: summary.advancedMissingLearningEvidence || [],
    methodology: {
      weights: {
        growthVelocity: 0.35,
        transferSuccess: 0.30,
        regressionPreventionStrength: 0.25,
        gateMaturity: 0.10,
      },
      note: 'Scores are normalized from learning-ledger evidence and gate maturity counts.',
    },
    agents: ranked,
    topAgent: ranked[0] || null,
  };

  fs.writeFileSync(args.outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('Agent Intelligence Report: PASS');
  console.log(`Output: ${args.outPath}`);
  if (report.topAgent) {
    console.log(`Top agent: ${report.topAgent.agent} (${report.topAgent.overallScore})`);
  }
}

main();
