#!/bin/bash

# Run Critical Tests Script for Project Kelmah
# This script runs tests for critical components and generates a report

echo "===================================================="
echo "Running Critical Component Tests for Project Kelmah"
echo "===================================================="

# Create directories for reports if they don't exist
mkdir -p test-reports

# Run the tests with coverage and JUnit reporter
echo "Running auth service tests..."
npm run test:auth -- --coverage --json --outputFile=test-reports/auth-results.json

echo "Running payment service tests..."
npm run test:payment -- --coverage --json --outputFile=test-reports/payment-results.json

echo "Running notification service tests..."
npm run test:notification -- --coverage --json --outputFile=test-reports/notification-results.json

echo "Running frontend auth tests..."
npm run test:frontend -- --testPathPattern=auth --coverage --json --outputFile=test-reports/frontend-auth-results.json

# Generate a summary report
echo "Generating test summary report..."
node -e "
const fs = require('fs');
const path = require('path');

// Read test results
const readResults = (file) => {
  try {
    return JSON.parse(fs.readFileSync(path.join('test-reports', file), 'utf8'));
  } catch (e) {
    console.error(\`Error reading \${file}: \${e.message}\`);
    return null;
  }
};

const authResults = readResults('auth-results.json');
const paymentResults = readResults('payment-results.json');
const notificationResults = readResults('notification-results.json');
const frontendAuthResults = readResults('frontend-auth-results.json');

// Create summary report
const report = [
  '# Critical Components Test Report',
  \`Generated: \${new Date().toISOString()}\`,
  '',
  '## Summary',
  ''
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const summarizeResults = (results, name) => {
  if (!results) return \`⚠️ No results for \${name}\`;
  
  totalTests += results.numTotalTests || 0;
  passedTests += results.numPassedTests || 0;
  failedTests += results.numFailedTests || 0;
  
  const passRate = results.numTotalTests ? 
    Math.round((results.numPassedTests / results.numTotalTests) * 100) : 0;
  
  return \`\${name}: \${results.numPassedTests || 0} passed, \${results.numFailedTests || 0} failed (\${passRate}% pass rate)\`;
};

report.push(summarizeResults(authResults, 'Auth Service'));
report.push(summarizeResults(paymentResults, 'Payment Service'));
report.push(summarizeResults(notificationResults, 'Notification Service'));
report.push(summarizeResults(frontendAuthResults, 'Frontend Auth'));

report.push('');
report.push(\`Total: \${passedTests} passed, \${failedTests} failed (\${Math.round((passedTests / totalTests) * 100)}% pass rate)\`);

report.push('');
report.push('## Details');
report.push('');
report.push('| Component | Tests | Passing | Failing | Coverage |');
report.push('|-----------|-------|---------|---------|----------|');

const getComponentDetails = (results, name) => {
  if (!results) return \`| \${name} | N/A | N/A | N/A | N/A |\`;
  
  const coverage = results.coverageMap ? 
    Math.round(results.coverageMap.getCoverageSummary().lines.pct) + '%' : 'N/A';
  
  return \`| \${name} | \${results.numTotalTests || 0} | \${results.numPassedTests || 0} | \${results.numFailedTests || 0} | \${coverage} |\`;
};

report.push(getComponentDetails(authResults, 'Auth Service'));
report.push(getComponentDetails(paymentResults, 'Payment Service'));
report.push(getComponentDetails(notificationResults, 'Notification Service'));
report.push(getComponentDetails(frontendAuthResults, 'Frontend Auth'));

report.push('');
report.push('## Failed Tests');
report.push('');

const getFailedTests = (results, name) => {
  if (!results || !results.testResults || results.numFailedTests === 0) return [];
  
  const failed = [];
  failed.push(\`### \${name}\`);
  failed.push('');
  
  results.testResults.forEach(suite => {
    const failedTests = suite.assertionResults.filter(test => test.status === 'failed');
    if (failedTests.length === 0) return;
    
    failed.push(\`#### \${suite.name}\`);
    failed.push('');
    
    failedTests.forEach(test => {
      failed.push(\`- ❌ \${test.title}\`);
      if (test.failureMessages && test.failureMessages.length > 0) {
        failed.push('  ```');
        failed.push('  ' + test.failureMessages[0].split('\\n')[0]);
        failed.push('  ```');
      }
    });
    
    failed.push('');
  });
  
  return failed;
};

const allFailedTests = [
  ...getFailedTests(authResults, 'Auth Service'),
  ...getFailedTests(paymentResults, 'Payment Service'),
  ...getFailedTests(notificationResults, 'Notification Service'),
  ...getFailedTests(frontendAuthResults, 'Frontend Auth')
];

if (allFailedTests.length === 0) {
  report.push('No failed tests! 🎉');
} else {
  report.push(...allFailedTests);
}

// Write the report
fs.writeFileSync('test-reports/critical-tests-report.md', report.join('\\n'));

console.log('Report generated: test-reports/critical-tests-report.md');
"

echo "===================================================="
echo "Test execution complete!"
echo "Report available at: test-reports/critical-tests-report.md"
echo "====================================================" 