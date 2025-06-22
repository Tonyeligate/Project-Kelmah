/**
 * Update Script for Autonomous Development Workflow
 * 
 * This script integrates the new feature validation and testing capabilities
 * into the existing autonomous development workflow.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { validateFeatures } = require('./feature-validation');

// Configuration
const AUTONOMOUS_DEV_PATH = path.join(__dirname, 'autonomous-dev.js');
const PROGRESS_REPORT_PATH = path.join(__dirname, '../ai-proposals/progress-report.md');

/**
 * Read the current autonomous-dev.js file
 */
function readAutonomousDevFile() {
  return fs.readFileSync(AUTONOMOUS_DEV_PATH, 'utf8');
}

/**
 * Update the autonomous development workflow
 */
async function updateAutonomousDev() {
  console.log('Updating autonomous development workflow...');
  
  // First, run feature validation to get accurate metrics
  console.log('Running feature validation...');
  const validationResults = await validateFeatures();
  
  if (!validationResults) {
    console.error('Feature validation failed. Aborting update.');
    process.exit(1);
  }
  
  // Update the progress-report.md with validated data
  updateProgressReport(validationResults);
  
  // Attempt to update autonomous-dev.js to include the validation step
  try {
    let autonomousDevCode = readAutonomousDevFile();
    
    // Check if feature validation is already integrated
    if (autonomousDevCode.includes('validateFeatures')) {
      console.log('Feature validation already integrated into autonomous-dev.js');
    } else {
      console.log('Updating autonomous-dev.js to include feature validation...');
      
      // Find a good injection point for the require statement
      const requireSection = autonomousDevCode.match(/const\s+\w+\s*=\s*require\(.*?\);/gs);
      if (requireSection) {
        const lastRequire = requireSection[requireSection.length - 1];
        const newRequireStatement = `${lastRequire}\nconst { validateFeatures } = require('./feature-validation');`;
        autonomousDevCode = autonomousDevCode.replace(lastRequire, newRequireStatement);
      }
      
      // Find the analysis or reporting function to modify
      if (autonomousDevCode.includes('async function analyzeCodebase')) {
        // If there's an analyzeCodebase function, add feature validation there
        const analyzeFunction = autonomousDevCode.match(/async\s+function\s+analyzeCodebase\([^)]*\)\s*\{[\s\S]*?(?=\n})/);
        if (analyzeFunction) {
          const functionBody = analyzeFunction[0];
          const lastStatement = functionBody.trim().split('\n').pop();
          
          const newStatement = `
  // Validate feature completeness
  console.log('Validating feature completeness...');
  const validationResults = await validateFeatures();
  if (validationResults) {
    // Update service completeness with validated data
    for (const [serviceName, result] of Object.entries(validationResults)) {
      if (services[serviceName]) {
        services[serviceName].completeness = result.completeness;
      }
    }
  }`;
          
          autonomousDevCode = autonomousDevCode.replace(lastStatement, `${lastStatement}\n${newStatement}`);
        }
      }
      
      // Write the updated file
      fs.writeFileSync(AUTONOMOUS_DEV_PATH, autonomousDevCode);
      console.log('autonomous-dev.js updated successfully!');
    }
    
    // Create test execution integration if it doesn't exist
    const testRunnerPath = path.join(__dirname, 'test-runner.js');
    if (!fs.existsSync(testRunnerPath)) {
      createTestRunnerScript();
    }
    
    console.log('Autonomous development workflow updated successfully!');
  } catch (error) {
    console.error('Error updating autonomous-dev.js:', error);
  }
}

/**
 * Update the progress report with validated data
 */
function updateProgressReport(validationResults) {
  try {
    const overallCompleteness = calculateOverallCompleteness(validationResults);
    
    // Create a validation summary section for the report
    let validationSection = `\n## Feature Validation Summary\n\n`;
    validationSection += `- **Overall Feature Completeness**: ${overallCompleteness}% (validated)\n`;
    validationSection += `- **Services Breakdown**:\n`;
    
    for (const [serviceName, service] of Object.entries(validationResults)) {
      const completeFeatures = service.features.filter(f => f.fullyImplemented).length;
      const totalFeatures = service.features.length;
      validationSection += `  - **${serviceName}**: ${service.completeness}% (${completeFeatures}/${totalFeatures} features)\n`;
    }
    
    // Add detailed section for missing components
    validationSection += `\n### Missing Components\n\n`;
    for (const [serviceName, service] of Object.entries(validationResults)) {
      const incompleteFeatures = service.features.filter(f => !f.fullyImplemented);
      if (incompleteFeatures.length > 0) {
        validationSection += `#### ${serviceName} Service\n\n`;
        for (const feature of incompleteFeatures) {
          const missingFiles = feature.requiredFiles.filter(file => !feature.foundFiles.includes(file));
          validationSection += `- **${feature.name}** (${feature.completeness}%): Missing ${missingFiles.join(', ')}\n`;
        }
        validationSection += '\n';
      }
    }
    
    // Add recommendation section
    validationSection += `\n## Next Steps\n\n`;
    validationSection += `1. **Implement missing core components** identified above\n`;
    validationSection += `2. **Run test suite** to validate functionality of existing components\n`;
    validationSection += `3. **Update documentation** to reflect actual implementation status\n`;
    
    // Read existing report
    let reportContent = fs.readFileSync(PROGRESS_REPORT_PATH, 'utf8');
    
    // Check if validation section already exists and replace it, or add it after Feature Status section
    if (reportContent.includes('## Feature Validation Summary')) {
      reportContent = reportContent.replace(/## Feature Validation Summary[\s\S]*?(?=\n## |$)/, validationSection);
    } else {
      const featureStatusPosition = reportContent.indexOf('## Feature Status');
      if (featureStatusPosition !== -1) {
        const featureStatusSection = reportContent.substring(featureStatusPosition);
        const nextSectionMatch = featureStatusSection.match(/\n## /);
        let insertPosition;
        
        if (nextSectionMatch) {
          insertPosition = featureStatusPosition + nextSectionMatch.index;
        } else {
          insertPosition = reportContent.length;
        }
        
        reportContent = 
          reportContent.substring(0, insertPosition) + 
          validationSection + 
          reportContent.substring(insertPosition);
      } else {
        // If Feature Status section doesn't exist, append to the end
        reportContent += validationSection;
      }
    }
    
    // Update the feature status table to reflect validated percentages
    for (const [serviceName, service] of Object.entries(validationResults)) {
      const regex = new RegExp(`\\| ${serviceName} \\| [^|]+ \\| (\\d+)% \\|`, 'i');
      reportContent = reportContent.replace(regex, `| ${serviceName} | In Progress | ${service.completeness}% |`);
    }
    
    fs.writeFileSync(PROGRESS_REPORT_PATH, reportContent);
    console.log('Progress report updated with validation results.');
  } catch (error) {
    console.error('Error updating progress report:', error);
  }
}

/**
 * Calculate overall completeness across all services
 */
function calculateOverallCompleteness(validatedServices) {
  const services = Object.values(validatedServices);
  if (services.length === 0) return 0;
  
  return Math.round(
    services.reduce((sum, service) => sum + service.completeness, 0) / services.length
  );
}

/**
 * Create a test runner script
 */
function createTestRunnerScript() {
  const scriptContent = `/**
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
  
  let report = '# Test Execution Report\\n';
  report += \`Generated on: \${new Date().toISOString()}\\n\\n\`;
  
  report += '## Summary\\n\\n';
  report += \`- **Pass Rate**: \${passRate}%\\n\`;
  report += \`- **Total Tests**: \${numTotalTests}\\n\`;
  report += \`- **Passed**: \${numPassedTests}\\n\`;
  report += \`- **Failed**: \${numFailedTests}\\n\\n\`;
  
  report += '## Test Suites\\n\\n';
  report += '| Test Suite | Status | Duration | Failed Tests |\\n';
  report += '|------------|--------|----------|-------------|\\n';
  
  for (const suite of suites) {
    const status = suite.status === 'passed' ? '✅ Passed' : '❌ Failed';
    const duration = (suite.endTime - suite.startTime) / 1000;
    const failedTests = suite.assertionResults
      .filter(test => test.status === 'failed')
      .map(test => test.title)
      .join(', ');
    
    report += \`| \${suite.name} | \${status} | \${duration.toFixed(2)}s | \${failedTests || '-'} |\\n\`;
  }
  
  // Add detailed failure section if there are failures
  if (numFailedTests > 0) {
    report += '\\n## Failed Tests\\n\\n';
    
    for (const suite of suites) {
      const failedTests = suite.assertionResults.filter(test => test.status === 'failed');
      
      if (failedTests.length > 0) {
        report += \`### \${suite.name}\\n\\n\`;
        
        for (const test of failedTests) {
          report += \`#### \${test.title}\\n\\n\`;
          report += \`\\\`\\\`\\\`\\n\${test.failureMessages.join('\\n')}\\n\\\`\\\`\\\`\\n\\n\`;
        }
      }
    }
  }
  
  // Add coverage section if available
  if (testResults.coverageMap) {
    const coverage = testResults.coverageMap.getCoverageSummary();
    
    report += '\\n## Coverage Summary\\n\\n';
    report += '| Type | Covered | Total | Coverage |\\n';
    report += '|------|---------|-------|----------|\\n';
    
    for (const [type, data] of Object.entries(coverage)) {
      const percentage = data.pct.toFixed(2);
      report += \`| \${type} | \${data.covered} | \${data.total} | \${percentage}% |\\n\`;
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
`;

  fs.writeFileSync(path.join(__dirname, 'test-runner.js'), scriptContent);
  console.log('Created test-runner.js');
}

// Run the update if executed directly
if (require.main === module) {
  updateAutonomousDev().catch(error => {
    console.error('Update failed:', error);
    process.exit(1);
  });
}

module.exports = {
  updateAutonomousDev
}; 