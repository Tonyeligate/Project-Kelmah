const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = require('../.cursor/settings.json');
const { validateFeatures } = require('./feature-validation');
const DOCS_DIR = path.join(__dirname, '..');
const AI_PROPOSALS_DIR = path.join(__dirname, '../ai-proposals');

// Ensure ai-proposals directory exists
if (!fs.existsSync(AI_PROPOSALS_DIR)) {
  fs.mkdirSync(AI_PROPOSALS_DIR);
}

// Helper functions
function readDocumentation() {
  const docs = {};
  const fileAnalysis = {
    frontend: {},
    backend: {},
    scripts: {},
    docs: {}
  };

  // Read all documentation files
  config.documentation.sources.forEach(doc => {
    const docPath = path.join(DOCS_DIR, doc);
    if (fs.existsSync(docPath)) {
      docs[doc] = fs.readFileSync(docPath, 'utf8');
    }
  });

  // Analyze frontend structure
  const frontendDir = path.join(__dirname, '../kelmah-frontend');
  if (fs.existsSync(frontendDir)) {
    analyzeDirectory(frontendDir, fileAnalysis.frontend);
  }

  // Analyze backend structure
  const backendDir = path.join(__dirname, '../kelmah-backend');
  if (fs.existsSync(backendDir)) {
    analyzeDirectory(backendDir, fileAnalysis.backend);
  }

  // Analyze scripts
  const scriptsDir = path.join(__dirname);
  analyzeDirectory(scriptsDir, fileAnalysis.scripts);

  // Analyze documentation
  analyzeDirectory(DOCS_DIR, fileAnalysis.docs);

  return {
    documentation: docs,
    fileAnalysis
  };
}

function analyzeDirectory(dir, analysis) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      analysis[file] = {
        type: 'directory',
        contents: {}
      };
      analyzeDirectory(filePath, analysis[file].contents);
    } else {
      analysis[file] = {
        type: 'file',
        size: stats.size,
        lastModified: stats.mtime,
        purpose: analyzeFilePurpose(filePath)
      };
    }
  });
}

function analyzeFilePurpose(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath);
  
  // Analyze based on file type and content
  switch (ext) {
    case '.js':
    case '.jsx':
      return analyzeJavaScriptFile(content);
    case '.md':
      return analyzeMarkdownFile(content);
    case '.json':
      return analyzeJsonFile(content);
    case '.txt':
      return analyzeTextFile(content);
    default:
      return 'Unknown purpose';
  }
}

function analyzeJavaScriptFile(content) {
  const purpose = {
    type: 'JavaScript',
    exports: [],
    imports: [],
    functions: [],
    components: [],
    description: ''
  };

  // Extract exports
  const exportMatches = content.match(/module\.exports\s*=\s*{([^}]*)}/g);
  if (exportMatches) {
    purpose.exports = exportMatches.map(match => 
      match.match(/\w+/g).filter(word => word !== 'exports' && word !== 'module')
    ).flat();
  }

  // Extract imports
  const importMatches = content.match(/require\(['"]([^'"]+)['"]\)/g);
  if (importMatches) {
    purpose.imports = importMatches.map(match => 
      match.match(/['"]([^'"]+)['"]/)[1]
    );
  }

  // Extract functions
  const functionMatches = content.match(/function\s+(\w+)/g);
  if (functionMatches) {
    purpose.functions = functionMatches.map(match => 
      match.match(/function\s+(\w+)/)[1]
    );
  }

  // Extract React components
  const componentMatches = content.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g);
  if (componentMatches) {
    purpose.components = componentMatches.map(match => 
      match.match(/const\s+(\w+)/)[1]
    );
  }

  // Generate description
  purpose.description = `This file contains ${purpose.functions.length} functions, ` +
    `${purpose.components.length} components, exports ${purpose.exports.join(', ')}, ` +
    `and imports from ${purpose.imports.join(', ')}.`;

  return purpose;
}

function analyzeMarkdownFile(content) {
  return {
    type: 'Markdown',
    title: content.match(/#\s+(.+)/)?.[1] || 'Untitled',
    sections: content.match(/##\s+(.+)/g)?.map(section => 
      section.replace('## ', '')
    ) || [],
    description: content.split('\n')[0]
  };
}

function analyzeJsonFile(content) {
  try {
    const json = JSON.parse(content);
    return {
      type: 'JSON',
      keys: Object.keys(json),
      description: `Configuration file with ${Object.keys(json).length} settings`
    };
  } catch (e) {
    return {
      type: 'JSON',
      description: 'Invalid JSON file'
    };
  }
}

function analyzeTextFile(content) {
  return {
    type: 'Text',
    lines: content.split('\n').length,
    description: content.split('\n')[0].substring(0, 100) + '...'
  };
}

function generateProposal(type, content) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const proposalPath = path.join(AI_PROPOSALS_DIR, `${type}-${timestamp}.md`);
  fs.writeFileSync(proposalPath, content);
  return proposalPath;
}

function requiresApproval(changeType) {
  return config.safetyNets.requireApprovalFor.includes(changeType);
}

function isProtectedFile(filePath) {
  return config.safetyNets.protectedFiles.some(pattern => 
    new RegExp(pattern.replace('*', '.*')).test(filePath)
  );
}

function logError(error, context = '') {
  const logPath = path.join(AI_PROPOSALS_DIR, 'error.log');
  const message = `[${new Date().toISOString()}] ${context}\n${error.stack || error}\n\n`;
  fs.appendFileSync(logPath, message);
  console.error(`Error in ${context}:`, error);
}

// Main workflow functions
function analyzeProgress() {
  try {
    console.log('Analyzing project progress...');
    const { documentation, fileAnalysis } = readDocumentation();
    
    // Analyze feature implementation status
    const features = {
      auth: analyzeFeature('auth', fileAnalysis),
      messaging: analyzeFeature('messaging', fileAnalysis),
      payment: analyzeFeature('payment', fileAnalysis),
      notification: analyzeFeature('notification', fileAnalysis)
    };

    // Analyze code quality and completeness
    const codeAnalysis = {
      frontend: analyzeCodeQuality(fileAnalysis.frontend),
      backend: analyzeCodeQuality(fileAnalysis.backend),
      scripts: analyzeCodeQuality(fileAnalysis.scripts)
    };

    // Analyze documentation coverage
    const docAnalysis = analyzeDocumentation(documentation, fileAnalysis);

    const progress = {
      documentation: {
        count: Object.keys(documentation).length,
        coverage: docAnalysis.coverage,
        missing: docAnalysis.missing
      },
      features,
      codeQuality: codeAnalysis,
      lastUpdated: new Date().toISOString()
    };
    
    // Write progress to a file
    const progressPath = path.join(AI_PROPOSALS_DIR, 'progress.json');
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
    
    // Also write a human-readable report
    const reportPath = path.join(AI_PROPOSALS_DIR, 'progress-report.md');
    const reportContent = generateProgressReport(progress);
    fs.writeFileSync(reportPath, reportContent);
    
    return progress;
  } catch (error) {
    logError(error, 'analyzeProgress');
    throw error;
  }
}

function analyzeFeature(featureName, fileAnalysis) {
  const featureFiles = [];
  const featureDirs = [];
  
  // Search for feature-related files and directories
  function searchForFeature(dir, path = '') {
    Object.entries(dir).forEach(([name, info]) => {
      if (name.toLowerCase().includes(featureName) || 
          (info.type === 'file' && info.purpose && info.purpose.description && info.purpose.description.toLowerCase().includes(featureName))) {
        if (info.type === 'directory') {
          featureDirs.push(path + name);
        } else {
          featureFiles.push(path + name);
        }
      }
      if (info.type === 'directory' && info.contents) {
        searchForFeature(info.contents, path + name + '/');
      }
    });
  }

  searchForFeature(fileAnalysis.frontend);
  searchForFeature(fileAnalysis.backend);
  searchForFeature(fileAnalysis.scripts);

  return {
    implemented: featureFiles.length > 0 || featureDirs.length > 0,
    status: featureFiles.length > 0 ? 'In Progress' : 'Not Started',
    files: featureFiles,
    directories: featureDirs,
    completeness: calculateFeatureCompleteness(featureFiles, featureDirs)
  };
}

function calculateFeatureCompleteness(files, dirs) {
  // This is a simple heuristic - you might want to make it more sophisticated
  const fileScore = files.length * 10;
  const dirScore = dirs.length * 20;
  const totalScore = fileScore + dirScore;
  
  if (totalScore === 0) return 0;
  if (totalScore < 30) return 25;
  if (totalScore < 60) return 50;
  if (totalScore < 90) return 75;
  return 100;
}

function analyzeCodeQuality(analysis) {
  const quality = {
    totalFiles: 0,
    documentedFiles: 0,
    testFiles: 0,
    complexity: 0,
    issues: []
  };

  function analyzeDirectory(dir) {
    Object.entries(dir).forEach(([name, info]) => {
      if (info.type === 'file') {
        quality.totalFiles++;
        
        // Check for documentation
        if (info.purpose.description && info.purpose.description.length > 0) {
          quality.documentedFiles++;
        }
        
        // Check for tests
        if (name.includes('.test.') || name.includes('.spec.')) {
          quality.testFiles++;
        }
        
        // Check for complexity
        if (info.purpose.type === 'JavaScript') {
          quality.complexity += info.purpose.functions.length;
          quality.complexity += info.purpose.components.length;
        }
        
        // Check for potential issues
        if (info.purpose.type === 'JavaScript' && info.purpose.functions.length > 10) {
          quality.issues.push(`${name} has too many functions (${info.purpose.functions.length})`);
        }
      } else if (info.type === 'directory' && info.contents) {
        analyzeDirectory(info.contents);
      }
    });
  }

  analyzeDirectory(analysis);

  return {
    ...quality,
    documentationCoverage: (quality.documentedFiles / quality.totalFiles) * 100,
    testCoverage: (quality.testFiles / quality.totalFiles) * 100,
    averageComplexity: quality.complexity / quality.totalFiles
  };
}

function analyzeDocumentation(docs, fileAnalysis) {
  const coverage = {
    total: 0,
    documented: 0,
    missing: []
  };

  // Count documented features
  Object.entries(fileAnalysis.frontend).forEach(([name, info]) => {
    if (info.type === 'file') {
      coverage.total++;
      if (info.purpose.description && info.purpose.description.length > 0) {
        coverage.documented++;
      } else {
        coverage.missing.push(`frontend/${name}`);
      }
    }
  });

  Object.entries(fileAnalysis.backend).forEach(([name, info]) => {
    if (info.type === 'file') {
      coverage.total++;
      if (info.purpose.description && info.purpose.description.length > 0) {
        coverage.documented++;
      } else {
        coverage.missing.push(`backend/${name}`);
      }
    }
  });

  return {
    coverage: (coverage.documented / coverage.total) * 100,
    missing: coverage.missing
  };
}

async function generateNextTask() {
  try {
    console.log('Generating next development task...');
    const progress = analyzeProgress();
    
    // Read the "To add.txt" file for task requirements
    const toAddPath = path.join(DOCS_DIR, 'To add.txt');
    let requirements = [];
    if (fs.existsSync(toAddPath)) {
      requirements = fs.readFileSync(toAddPath, 'utf8').split('\n')
        .filter(line => line.trim() && !line.startsWith('//'));
    }

    // Find incomplete features and their issues
    const incompleteFeatures = Object.entries(progress.features)
      .filter(([key, value]) => value.completeness < 100)
      .map(([key, value]) => ({
        name: key,
        ...value,
        issues: findFeatureIssues(key, progress)
      }));

    // Find code quality issues
    const qualityIssues = findQualityIssues(progress);

    // Find documentation gaps
    const docGaps = findDocumentationGaps(progress);

    // Prioritize tasks
    const tasks = [
      ...incompleteFeatures.map(feature => ({
        type: 'feature',
        name: `Complete ${feature.name} service`,
        description: `Complete the implementation of the ${feature.name} service (${feature.completeness}% complete)`,
        priority: feature.completeness < 50 ? 'high' : 'medium',
        requirements: requirements.filter(req => req.toLowerCase().includes(feature.name)),
        issues: feature.issues
      })),
      ...qualityIssues.map(issue => ({
        type: 'quality',
        name: `Fix ${issue.type} issue`,
        description: issue.description,
        priority: issue.severity === 'high' ? 'high' : 'medium',
        location: issue.location
      })),
      ...docGaps.map(gap => ({
        type: 'documentation',
        name: `Document ${gap.file}`,
        description: `Add documentation for ${gap.file}`,
        priority: 'low',
        location: gap.file
      }))
    ];

    // Sort tasks by priority and completeness
    tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Generate proposal for the highest priority task
    if (tasks.length > 0) {
      const task = tasks[0];
      const proposalContent = generateProposalContent(task, progress);
      const proposalPath = generateProposal(task.type, proposalContent);
      console.log(`Generated proposal at: ${proposalPath}`);
      return task;
    }

    return null;
  } catch (error) {
    logError(error, 'generateNextTask');
    throw error;
  }
}

function findFeatureIssues(featureName, progress) {
  const issues = [];
  const feature = progress.features[featureName];

  // Check for missing components
  if (feature.completeness < 100) {
    issues.push(`Feature is only ${feature.completeness}% complete`);
  }

  // Check for code quality issues in feature files
  feature.files.forEach(file => {
    const filePath = file.split('/');
    let current = progress.codeQuality;
    for (const part of filePath) {
      if (current[part]) {
        current = current[part];
      }
    }
    if (current.issues) {
      issues.push(...current.issues);
    }
  });

  return issues;
}

function findQualityIssues(progress) {
  const issues = [];

  // Check frontend quality
  if (progress.codeQuality.frontend.documentationCoverage < 80) {
    issues.push({
      type: 'documentation',
      description: `Frontend documentation coverage is only ${progress.codeQuality.frontend.documentationCoverage}%`,
      severity: 'high',
      location: 'frontend'
    });
  }

  if (progress.codeQuality.frontend.testCoverage < 70) {
    issues.push({
      type: 'testing',
      description: `Frontend test coverage is only ${progress.codeQuality.frontend.testCoverage}%`,
      severity: 'high',
      location: 'frontend'
    });
  }

  // Check backend quality
  if (progress.codeQuality.backend.documentationCoverage < 80) {
    issues.push({
      type: 'documentation',
      description: `Backend documentation coverage is only ${progress.codeQuality.backend.documentationCoverage}%`,
      severity: 'high',
      location: 'backend'
    });
  }

  if (progress.codeQuality.backend.testCoverage < 70) {
    issues.push({
      type: 'testing',
      description: `Backend test coverage is only ${progress.codeQuality.backend.testCoverage}%`,
      severity: 'high',
      location: 'backend'
    });
  }

  // Add specific code issues
  progress.codeQuality.frontend.issues.forEach(issue => {
    issues.push({
      type: 'code',
      description: issue,
      severity: 'medium',
      location: 'frontend'
    });
  });

  progress.codeQuality.backend.issues.forEach(issue => {
    issues.push({
      type: 'code',
      description: issue,
      severity: 'medium',
      location: 'backend'
    });
  });

  return issues;
}

function findDocumentationGaps(progress) {
  return progress.documentation.missing.map(file => ({
    file,
    type: 'documentation',
    priority: 'low'
  }));
}

function generateProposalContent(task, progress) {
  let content = `# ${task.name}

## Description
${task.description}

## Priority
${task.priority}

## Current Status
${generateStatusSection(task, progress)}

## Requirements
${task.requirements ? task.requirements.map(req => `- ${req}`).join('\n') : 'No specific requirements listed'}

## Implementation Plan
${generateImplementationPlan(task)}

## Notes
- Follow existing code style and patterns
- Ensure proper error handling
- Add logging for debugging
- Update progress tracking
- Update documentation after implementation
`;

  if (task.issues && task.issues.length > 0) {
    content += `
## Issues to Address
${task.issues.map(issue => `- ${issue}`).join('\n')}
`;
  }

  return content;
}

function generateStatusSection(task, progress) {
  switch (task.type) {
    case 'feature':
      const feature = progress.features[task.name.split(' ')[1]];
      return `- Implementation Progress: ${feature.completeness}%
- Files: ${feature.files.join(', ')}
- Directories: ${feature.directories.join(', ')}`;
    
    case 'quality':
      return `- Issue Type: ${task.type}
- Location: ${task.location}
- Severity: ${task.severity}`;
    
    case 'documentation':
      return `- File: ${task.location}
- Documentation Status: Missing`;
    
    default:
      return 'Status information not available';
  }
}

function generateImplementationPlan(task) {
  switch (task.type) {
    case 'feature':
      return `1. Review existing implementation
2. Complete missing components
3. Add tests
4. Update documentation
5. Verify functionality
6. Create pull request`;

    case 'quality':
      return `1. Review the issue
2. Plan the fix
3. Implement the solution
4. Add tests
5. Update documentation
6. Create pull request`;

    case 'documentation':
      return `1. Review the file
2. Add JSDoc comments
3. Update README if needed
4. Add usage examples
5. Create pull request`;

    default:
      return 'Implementation plan not available';
  }
}

function implementFeatureProposal() {
  console.log('Implementing feature proposal...');
  // Implementation will be added based on project needs
}

function createPullRequest() {
  console.log('Creating pull request...');
  // Implementation will be added based on project needs
}

function generateProgressReport(progress) {
  return `# Project Progress Report
Generated on: ${progress.lastUpdated}

## Documentation Status
- Total Documentation Files: ${progress.documentation.count}
- Documentation Coverage: ${progress.documentation.coverage.toFixed(1)}%
- Missing Documentation:
${progress.documentation.missing.map(file => `  - ${file}`).join('\n')}

## Feature Status
${Object.entries(progress.features).map(([name, feature]) => `
### ${name.charAt(0).toUpperCase() + name.slice(1)} Service
- Status: ${feature.status}
- Completeness: ${feature.completeness}%
- Files: ${feature.files.length}
- Directories: ${feature.directories.length}
${(feature.issues && feature.issues.length > 0) ? `- Issues:\n${feature.issues.map(issue => `  - ${issue}`).join('\n')}` : ''}
`).join('\n')}

## Code Quality
### Frontend
- Total Files: ${progress.codeQuality.frontend.totalFiles}
- Documentation Coverage: ${progress.codeQuality.frontend.documentationCoverage.toFixed(1)}%
- Test Coverage: ${progress.codeQuality.frontend.testCoverage.toFixed(1)}%
- Average Complexity: ${progress.codeQuality.frontend.averageComplexity.toFixed(1)}
${progress.codeQuality.frontend.issues.length > 0 ? `- Issues:\n${progress.codeQuality.frontend.issues.map(issue => `  - ${issue}`).join('\n')}` : ''}

### Backend
- Total Files: ${progress.codeQuality.backend.totalFiles}
- Documentation Coverage: ${progress.codeQuality.backend.documentationCoverage.toFixed(1)}%
- Test Coverage: ${progress.codeQuality.backend.testCoverage.toFixed(1)}%
- Average Complexity: ${progress.codeQuality.backend.averageComplexity.toFixed(1)}
${progress.codeQuality.backend.issues.length > 0 ? `- Issues:\n${progress.codeQuality.backend.issues.map(issue => `  - ${issue}`).join('\n')}` : ''}

## Next Steps
1. Complete features with low completeness
2. Address high-priority code quality issues
3. Improve documentation coverage
4. Increase test coverage
`;
}

// Export functions for use in other scripts
module.exports = {
  analyzeProgress,
  generateNextTask,
  implementFeatureProposal,
  createPullRequest,
  requiresApproval,
  isProtectedFile,
  generateProposal,
  readDocumentation
}; 