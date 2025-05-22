const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = require('../.cursor/settings.json');
const DOCS_DIR = path.join(__dirname, '..');
const AI_PROPOSALS_DIR = path.join(__dirname, '../ai-proposals');

// Ensure ai-proposals directory exists
if (!fs.existsSync(AI_PROPOSALS_DIR)) {
  fs.mkdirSync(AI_PROPOSALS_DIR);
}

// Helper functions
function readDocumentation() {
  const docs = {};
  config.documentation.sources.forEach(doc => {
    const docPath = path.join(DOCS_DIR, doc);
    if (fs.existsSync(docPath)) {
      docs[doc] = fs.readFileSync(docPath, 'utf8');
    }
  });
  return docs;
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

// Main workflow functions
function analyzeProgress() {
  console.log('Analyzing project progress...');
  const docs = readDocumentation();
  const progress = {
    documentation: Object.keys(docs).length,
    features: {
      auth: {
        implemented: fs.existsSync(path.join(__dirname, '../kelmah-backend/services/auth-service')),
        status: 'In Progress'
      },
      messaging: {
        implemented: fs.existsSync(path.join(__dirname, '../kelmah-backend/services/messaging-service')),
        status: 'In Progress'
      },
      payment: {
        implemented: fs.existsSync(path.join(__dirname, '../kelmah-backend/services/payment-service')),
        status: 'In Progress'
      },
      notification: {
        implemented: fs.existsSync(path.join(__dirname, '../kelmah-backend/services/notification-service')),
        status: 'In Progress'
      }
    }
  };
  
  // Write progress to a file
  const progressPath = path.join(AI_PROPOSALS_DIR, 'progress.json');
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  
  return progress;
}

async function generateNextTask() {
  console.log('Generating next development task...');
  const progress = analyzeProgress();
  
  // Read the "To add.txt" file for task requirements
  const toAddPath = path.join(DOCS_DIR, 'To add.txt');
  let requirements = [];
  if (fs.existsSync(toAddPath)) {
    requirements = fs.readFileSync(toAddPath, 'utf8').split('\n')
      .filter(line => line.trim() && !line.startsWith('//'));
  }
  
  // Find the next incomplete feature
  const nextFeature = Object.entries(progress.features)
    .find(([key, value]) => !value.implemented);
  
  if (nextFeature) {
    const [feature, status] = nextFeature;
    const task = {
      type: 'feature',
      name: `Implement ${feature} service`,
      description: `Complete the implementation of the ${feature} service according to requirements`,
      priority: 'high',
      requirements: requirements.filter(req => req.toLowerCase().includes(feature))
    };
    
    return task;
  }
  
  return null;
}

function implementFeatureProposal() {
  console.log('Implementing feature proposal...');
  // Implementation will be added based on project needs
}

function createPullRequest() {
  console.log('Creating pull request...');
  // Implementation will be added based on project needs
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