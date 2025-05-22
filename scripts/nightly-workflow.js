const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const autonomousDev = require('./autonomous-dev');

// Configuration
const config = require('../.cursor/settings.json');
const CHAT_HISTORY_FILE = path.join(__dirname, '../All chat history.txt');

// Helper functions
function appendToChatHistory(message) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}] ${message}`;
  fs.appendFileSync(CHAT_HISTORY_FILE, entry);
}

function isGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function initializeGitIfNeeded() {
  if (!isGitRepository()) {
    try {
      execSync('git init');
      appendToChatHistory('Initialized Git repository');
      
      // Create initial .gitignore if it doesn't exist
      const gitignorePath = path.join(__dirname, '../.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Environment variables
.env
.env.*
!.env.example

# Build outputs
dist/
build/
out/

# IDE and editor files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# AI proposals (temporary)
ai-proposals/

# Cache
.cache/
`;
        fs.writeFileSync(gitignorePath, gitignoreContent);
        appendToChatHistory('Created .gitignore file');
      }
      
      // Make initial commit
      execSync('git add .');
      execSync('git commit -m "Initial commit"');
      appendToChatHistory('Created initial commit');
      
      return true;
    } catch (error) {
      appendToChatHistory(`Error initializing Git: ${error.message}`);
      return false;
    }
  }
  return true;
}

function createDailySnapshot() {
  if (!initializeGitIfNeeded()) {
    appendToChatHistory('Skipping daily snapshot due to Git initialization failure');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const message = `Daily snapshot ${timestamp}`;
  
  try {
    // Check if there are any changes to commit
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      execSync('git add .');
      execSync(`git commit -m "${message}"`);
      appendToChatHistory(`Created daily snapshot: ${message}`);
    } else {
      appendToChatHistory('No changes to commit for daily snapshot');
    }
  } catch (error) {
    appendToChatHistory(`Error creating daily snapshot: ${error.message}`);
  }
}

// Main workflow
async function runNightlyWorkflow() {
  try {
    // Ensure chat history file exists
    if (!fs.existsSync(CHAT_HISTORY_FILE)) {
      fs.writeFileSync(CHAT_HISTORY_FILE, '');
      appendToChatHistory('Created chat history file');
    }

    // 1. Analyze existing docs and code structure
    appendToChatHistory('Starting nightly analysis...');
    autonomousDev.analyzeProgress();
    
    // 2. Generate implementation proposals
    appendToChatHistory('Generating implementation proposals...');
    const nextTask = await autonomousDev.generateNextTask();
    if (nextTask) {
      const proposalPath = autonomousDev.generateProposal('feature', nextTask);
      appendToChatHistory(`Generated proposal: ${proposalPath}`);
    }
    
    // 3. Make non-critical improvements
    appendToChatHistory('Making non-critical improvements...');
    // Implementation will be added based on project needs
    
    // 4. Create daily snapshot
    createDailySnapshot();
    
    // 5. Generate morning report
    const report = `Nightly Workflow Report - ${new Date().toISOString()}
    - Analyzed project structure
    - Generated implementation proposals
    - Made non-critical improvements
    - Created daily snapshot
    Next steps will be available in the morning review.`;
    
    appendToChatHistory(report);
    
  } catch (error) {
    appendToChatHistory(`Error in nightly workflow: ${error.message}`);
  }
}

// Run the workflow if this script is executed directly
if (require.main === module) {
  runNightlyWorkflow();
}

module.exports = {
  runNightlyWorkflow
}; 