/**
 * Test Runner for Autonomous Development
 * 
 * Runs the test suite and generates a test report for the autonomous development workflow.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_REPORT_PATH = path.join(__dirname, '../ai-proposals/test-report.md');

/**
 * Run the test suite and generate a report
 */
async function runTests() {
  return new Promise((resolve, reject) => {
    console.log('Running test suite...');
    
    exec('npm test -- --json --outputFile=test-results.json', (error, stdout, stderr) => {
      if (error && error.code !== 1) { // Jest exits with code 1 if tests fail
        console.error('Error running tests:', error);
        reject(error);
        return;
      }
      
      try {
        const testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
        const report = generateTestReport(testResults);
        fs.writeFileSync(TEST_REPORT_PATH, report);
        console.log('Test report generated:', TEST_REPORT_PATH);
        resolve(testResults);
      } catch (err) {
        console.error('Error generating test report:', err);
        reject(err);
      }
    });
  });
}

/**
 * Generate a test report in Markdown format
 */
function generateTestReport(testResults) {
  const { numFailedTests, numPassedTests, numTotalTests, testResults: suites } = testResults;
  const passRate = Math.round((numPassedTests / numTotalTests) * 100) || 0;
  
  let report = '# Test Execution Report\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  report += '## Summary\n\n';
  report += `- **Pass Rate**: ${passRate}%\n`;
  report += `- **Total Tests**: ${numTotalTests}\n`;
  report += `- **Passed**: ${numPassedTests}\n`;
  report += `- **Failed**: ${numFailedTests}\n\n`;
  
  report += '## Test Suites\n\n';
  report += '| Test Suite | Status | Duration | Failed Tests |\n';
  report += '|------------|--------|----------|-------------|\n';
  
  for (const suite of suites) {
    const status = suite.status === 'passed' ? '✅ Passed' : '❌ Failed';
    const duration = (suite.endTime - suite.startTime) / 1000;
    const failedTests = suite.assertionResults
      .filter(test => test.status === 'failed')
      .map(test => test.title)
      .join(', ');
    
    report += `| ${suite.name} | ${status} | ${duration.toFixed(2)}s | ${failedTests || '-'} |\n`;
  }
  
  // Add detailed failure section if there are failures
  if (numFailedTests > 0) {
    report += '\n## Failed Tests\n\n';
    
    for (const suite of suites) {
      const failedTests = suite.assertionResults.filter(test => test.status === 'failed');
      
      if (failedTests.length > 0) {
        report += `### ${suite.name}\n\n`;
        
        for (const test of failedTests) {
          report += `#### ${test.title}\n\n`;
          report += `\`\`\`\n${test.failureMessages.join('\n')}\n\`\`\`\n\n`;
        }
      }
    }
  }
  
  // Add coverage section if available
  if (testResults.coverageMap) {
    const coverage = testResults.coverageMap.getCoverageSummary();
    
    report += '\n## Coverage Summary\n\n';
    report += '| Type | Covered | Total | Coverage |\n';
    report += '|------|---------|-------|----------|\n';
    
    for (const [type, data] of Object.entries(coverage)) {
      const percentage = data.pct.toFixed(2);
      report += `| ${type} | ${data.covered} | ${data.total} | ${percentage}% |\n`;
    }
  }
  
  return report;
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests
};
