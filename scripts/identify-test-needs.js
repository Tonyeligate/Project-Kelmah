/**
 * Test Coverage Analysis Tool
 * 
 * This script identifies components that need testing based on:
 * 1. Complexity (functions per file)
 * 2. Business criticality
 * 3. Existing test coverage
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROGRESS_FILE = path.join(__dirname, '../ai-proposals/progress.json');
const OUTPUT_FILE = path.join(__dirname, '../ai-proposals/test-priorities.md');

// Critical path components that must be tested first
const CRITICAL_COMPONENTS = {
  auth: ['login', 'register', 'authentication', 'authorization'],
  payment: ['checkout', 'subscription', 'invoice', 'payment-processor'],
  messaging: ['chat', 'socket', 'message-store'],
  notification: ['email', 'push-notification']
};

/**
 * Load the progress data from the progress file
 */
function loadProgressData() {
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading progress data:', error);
    return null;
  }
}

/**
 * Check if a file is a critical component
 */
function isCriticalComponent(filePath) {
  const lowerPath = filePath.toLowerCase();
  
  for (const category in CRITICAL_COMPONENTS) {
    for (const keyword of CRITICAL_COMPONENTS[category]) {
      if (lowerPath.includes(keyword)) {
        return { isCritical: true, category };
      }
    }
  }
  
  return { isCritical: false };
}

/**
 * Check if a file probably has tests based on naming conventions
 */
function hasTests(file, allFiles) {
  const fileName = path.basename(file, path.extname(file));
  const possibleTestNames = [
    `${fileName}.test.js`,
    `${fileName}.test.jsx`,
    `${fileName}.test.ts`,
    `${fileName}.test.tsx`,
    `${fileName}.spec.js`,
    `${fileName}.spec.jsx`,
    `${fileName}.spec.ts`,
    `${fileName}.spec.tsx`,
    `__tests__/${fileName}.js`,
    `__tests__/${fileName}.ts`,
    `__tests__/${fileName}.jsx`,
    `__tests__/${fileName}.tsx`
  ];
  
  return allFiles.some(testFile => possibleTestNames.some(testName => testFile.endsWith(testName)));
}

/**
 * Analyze the codebase for test needs
 */
async function analyzeTestNeeds() {
  const progressData = loadProgressData();
  if (!progressData) return;
  
  // Extract all files from features
  const allFiles = [];
  for (const featureName in progressData.features) {
    const feature = progressData.features[featureName];
    if (feature.files && Array.isArray(feature.files)) {
      allFiles.push(...feature.files);
    }
  }
  
  // Assess each file
  const assessedFiles = allFiles
    .filter(filePath => {
      // Skip test files themselves
      const isTestFile = filePath.includes('.test.') || 
                         filePath.includes('.spec.') || 
                         filePath.includes('__tests__');
      // Skip node_modules and other non-source files
      const isSourceFile = !filePath.includes('node_modules') &&
                           !filePath.includes('dist') &&
                           !filePath.includes('.git');
      
      return !isTestFile && isSourceFile;
    })
    .map(filePath => {
      const { isCritical, category } = isCriticalComponent(filePath);
      const probablyHasTests = hasTests(filePath, allFiles);
      
      // Estimated complexity based on code quality issues in the progress data
      // This is a rough heuristic - we would ideally parse the actual code
      let estimatedComplexity = 1; // Default complexity
      
      if (progressData.codeQuality && progressData.codeQuality.issues) {
        const qualityIssues = progressData.codeQuality.issues || [];
        const fileIssues = qualityIssues.filter(issue => issue.file === filePath);
        
        if (fileIssues.length > 0) {
          // Add complexity based on number of issues
          estimatedComplexity += fileIssues.length * 0.5;
          
          // Add complexity if the file has the "too many functions" issue
          if (fileIssues.some(issue => issue.type === 'tooManyFunctions')) {
            estimatedComplexity += 3;
          }
        }
      }
      
      return {
        path: filePath,
        isCritical,
        category,
        probablyHasTests,
        estimatedComplexity
      };
    });
  
  // Calculate test priority score
  const prioritizedFiles = assessedFiles.map(file => {
    // Priority calculation:
    // - Critical path components: +10
    // - No tests but high complexity: +5
    // - High complexity: +3
    // - No tests: +2
    let priority = 0;
    
    if (file.isCritical) priority += 10;
    if (file.estimatedComplexity > 3 && !file.probablyHasTests) priority += 5;
    if (file.estimatedComplexity > 3) priority += 3;
    if (!file.probablyHasTests) priority += 2;
    
    return {
      ...file,
      testPriority: priority
    };
  });
  
  // Sort by priority (highest first)
  prioritizedFiles.sort((a, b) => b.testPriority - a.testPriority);
  
  // Generate the report
  generateTestPriorityReport(prioritizedFiles);
  
  return prioritizedFiles;
}

/**
 * Generate a test priority report in Markdown format
 */
function generateTestPriorityReport(prioritizedFiles) {
  let report = `# Test Priority Report\nGenerated on: ${new Date().toISOString()}\n\n`;
  
  // Summary statistics
  const totalFiles = prioritizedFiles.length;
  const untested = prioritizedFiles.filter(f => !f.probablyHasTests).length;
  const critical = prioritizedFiles.filter(f => f.isCritical).length;
  const criticalUntested = prioritizedFiles.filter(f => f.isCritical && !f.probablyHasTests).length;
  
  report += `## Summary\n\n`;
  report += `- **Total Files Analyzed**: ${totalFiles}\n`;
  report += `- **Files Without Tests**: ${untested} (${Math.round(untested/totalFiles*100) || 0}%)\n`;
  report += `- **Critical Path Components**: ${critical}\n`;
  report += `- **Critical Components Without Tests**: ${criticalUntested}\n\n`;
  
  // Critical components that need testing
  report += `## Critical Components Needing Tests\n\n`;
  report += `| File Path | Category | Estimated Complexity | Priority Score |\n`;
  report += `|-----------|----------|---------------------|---------------|\n`;
  
  prioritizedFiles
    .filter(f => f.isCritical && !f.probablyHasTests)
    .slice(0, 20) // Limit to top 20
    .forEach(file => {
      report += `| ${file.path} | ${file.category || 'Unknown'} | ${file.estimatedComplexity.toFixed(1)} | ${file.testPriority} |\n`;
    });
  
  report += `\n## High Complexity Components\n\n`;
  report += `| File Path | Has Tests | Estimated Complexity | Priority Score |\n`;
  report += `|-----------|----------|---------------------|---------------|\n`;
  
  prioritizedFiles
    .filter(f => f.estimatedComplexity > 3)
    .slice(0, 20) // Limit to top 20
    .forEach(file => {
      report += `| ${file.path} | ${file.probablyHasTests ? 'Yes' : 'No'} | ${file.estimatedComplexity.toFixed(1)} | ${file.testPriority} |\n`;
    });
  
  // Top 50 files that need testing
  report += `\n## Top 50 Files Needing Tests\n\n`;
  report += `| File Path | Critical | Estimated Complexity | Priority Score |\n`;
  report += `|-----------|----------|---------------------|---------------|\n`;
  
  prioritizedFiles
    .filter(f => !f.probablyHasTests)
    .slice(0, 50)
    .forEach(file => {
      report += `| ${file.path} | ${file.isCritical ? 'Yes' : 'No'} | ${file.estimatedComplexity.toFixed(1)} | ${file.testPriority} |\n`;
    });
  
  report += `\n## Recommended Test Implementation Order\n\n`;
  report += `1. Critical auth-related components (login, register, authentication)\n`;
  report += `2. Payment processing components\n`;
  report += `3. High-complexity messaging components\n`;
  report += `4. Notification system components\n`;
  report += `5. Remaining high-complexity components\n\n`;
  
  report += `## Next Steps\n\n`;
  report += `1. Create test fixtures and mocks for auth, database, and API calls\n`;
  report += `2. Implement unit tests for the critical auth components identified above\n`;
  report += `3. Create integration tests for authentication workflows\n`;
  report += `4. Implement unit tests for payment processing components\n`;
  report += `5. Set up E2E testing framework for critical user journeys\n`;
  
  // Write the report file
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Test priority report generated at ${OUTPUT_FILE}`);
}

// Run the analysis if executed directly
if (require.main === module) {
  analyzeTestNeeds().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = {
  analyzeTestNeeds
}; 