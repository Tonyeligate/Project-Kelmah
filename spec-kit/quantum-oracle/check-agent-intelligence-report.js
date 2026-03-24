#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REQUIRED_AGENTS = ['frontend', 'backend', 'database', 'security', 'realtime', 'devops', 'debugger'];

function parseArgs(argv) {
  const parsed = {
    reportPath: path.resolve(process.cwd(), 'spec-kit', 'quantum-oracle', 'agent-intelligence-report.json'),
    minTopScore: 5,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--report') {
      parsed.reportPath = path.resolve(argv[i + 1] || parsed.reportPath);
      i += 1;
    } else if (token === '--min-top-score') {
      parsed.minTopScore = Number(argv[i + 1] || parsed.minTopScore);
      i += 1;
    }
  }

  return parsed;
}

function main() {
  const args = parseArgs(process.argv);
  const errors = [];

  if (!fs.existsSync(args.reportPath)) {
    console.error('Agent Intelligence Report Check: FAIL');
    console.error(`  - Missing report: ${args.reportPath}`);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(args.reportPath, 'utf8'));
  } catch (err) {
    console.error('Agent Intelligence Report Check: FAIL');
    console.error(`  - Invalid JSON: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(report.agents)) {
    errors.push('agents must be an array');
  } else {
    const names = new Set(report.agents.map((a) => a.agent));
    REQUIRED_AGENTS.forEach((name) => {
      if (!names.has(name)) {
        errors.push(`missing agent score entry: ${name}`);
      }
    });

    report.agents.forEach((a) => {
      ['growthVelocity', 'transferSuccess', 'regressionPreventionStrength', 'gateMaturity', 'overallScore'].forEach((k) => {
        if (typeof a[k] !== 'number' || Number.isNaN(a[k])) {
          errors.push(`agent ${a.agent}: ${k} must be numeric`);
        }
      });
    });
  }

  if (!report.topAgent || typeof report.topAgent.overallScore !== 'number') {
    errors.push('topAgent with numeric overallScore is required');
  } else if (report.topAgent.overallScore < args.minTopScore) {
    errors.push(`topAgent.overallScore (${report.topAgent.overallScore}) below minimum (${args.minTopScore})`);
  }

  if (errors.length > 0) {
    console.error('Agent Intelligence Report Check: FAIL');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Agent Intelligence Report Check: PASS');
  console.log(`Report: ${args.reportPath}`);
  console.log(`Top agent: ${report.topAgent.agent} (${report.topAgent.overallScore})`);
}

main();
