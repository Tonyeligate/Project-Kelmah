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
  const baseName = path.basename(file, path.extname(file));
  const dir = path.dirname(file);
  
  const possibleTestNames = [
    `${baseName}.test.js`,
    `${baseName}.test.jsx`,
    `${baseName}.spec.js`,
    `${baseName}.spec.jsx`,
    path.join(dir, '__tests__', `${baseName}.test.js`),
    path.join(dir, '__tests__', `${baseName}.test.jsx`)
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
      const needsTests = !hasTests(filePath, allFiles);
      const priority = getTestPriority(filePath);
      
      return {
        file: filePath,
        needsTests,
        priority,
        testTypes: suggestTestTypes(filePath)
      };
    });

  // Filter files that need tests
  const filesNeedingTests = assessedFiles.filter(file => file.needsTests);
  
  // Generate report
  const report = {
    summary: {
      totalFiles: assessedFiles.length,
      filesNeedingTests: filesNeedingTests.length,
      coverage: ((assessedFiles.length - filesNeedingTests.length) / assessedFiles.length * 100).toFixed(1)
    },
    highPriority: filesNeedingTests.filter(f => f.priority === 'high'),
    mediumPriority: filesNeedingTests.filter(f => f.priority === 'medium'),
    lowPriority: filesNeedingTests.filter(f => f.priority === 'low')
  };
  
  // Write report
  const outputPath = path.join(__dirname, '../ai-proposals/test-needs-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log('📊 Test Needs Analysis Complete:');
  console.log(`   Total files: ${report.summary.totalFiles}`);
  console.log(`   Files needing tests: ${report.summary.filesNeedingTests}`);
  console.log(`   Current coverage: ${report.summary.coverage}%`);
  console.log(`   High priority: ${report.highPriority.length}`);
  console.log(`   Medium priority: ${report.mediumPriority.length}`);
  console.log(`   Low priority: ${report.lowPriority.length}`);
  
  return report;
}

function getTestPriority(filePath) {
  // High priority: services, controllers, core business logic
  if (filePath.includes('/services/') || 
      filePath.includes('/controllers/') ||
      filePath.includes('Service.js') ||
      filePath.includes('Controller.js')) {
    return 'high';
  }
  
  // Medium priority: components, utilities
  if (filePath.includes('/components/') ||
      filePath.includes('/utils/') ||
      filePath.includes('/helpers/')) {
    return 'medium';
  }
  
  // Low priority: everything else
  return 'low';
}

function suggestTestTypes(filePath) {
  const types = [];
  
  if (filePath.includes('/services/') || filePath.includes('Service.js')) {
    types.push('unit', 'integration');
  }
  
  if (filePath.includes('/components/') || filePath.includes('.jsx')) {
    types.push('unit', 'snapshot');
  }
  
  if (filePath.includes('/controllers/') || filePath.includes('Controller.js')) {
    types.push('unit', 'integration');
  }
  
  if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
    types.push('unit');
  }
  
  return types.length > 0 ? types : ['unit'];
}

// Export for module use
module.exports = { analyzeTestNeeds, hasTests, getTestPriority };

// Run if called directly
if (require.main === module) {
  analyzeTestNeeds().catch(console.error);
}