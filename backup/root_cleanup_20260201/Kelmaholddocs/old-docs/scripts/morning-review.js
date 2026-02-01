const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const autonomousDev = require('./autonomous-dev');

// Configuration
const config = require('../.cursor/settings.json');
const AI_PROPOSALS_DIR = path.join(__dirname, '../ai-proposals');
const CHAT_HISTORY_FILE = path.join(__dirname, '../All chat history.txt');

// Helper functions
function readProposals() {
  const proposals = [];
  if (fs.existsSync(AI_PROPOSALS_DIR)) {
    const files = fs.readdirSync(AI_PROPOSALS_DIR);
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(AI_PROPOSALS_DIR, file), 'utf8');
        proposals.push({
          file,
          content,
          timestamp: fs.statSync(path.join(AI_PROPOSALS_DIR, file)).mtime
        });
      }
    });
  }
  // Sort proposals by timestamp, newest first
  return proposals.sort((a, b) => b.timestamp - a.timestamp);
}

function readChatHistory() {
  if (fs.existsSync(CHAT_HISTORY_FILE)) {
    return fs.readFileSync(CHAT_HISTORY_FILE, 'utf8');
  }
  return '';
}

function getLastNightlyReport() {
  const chatHistory = readChatHistory();
  const lines = chatHistory.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('Nightly Workflow Report')) {
      return lines[i];
    }
  }
  return null;
}

function applyApprovedChanges(proposalFile) {
  try {
    // Implementation will be added based on project needs
    console.log(`Applying changes from ${proposalFile}`);
  } catch (error) {
    console.error(`Error applying changes: ${error.message}`);
  }
}

// Main review process
async function runMorningReview() {
  try {
    console.log('Starting morning review...');
    
    // 1. Read proposals
    const proposals = readProposals();
    console.log(`Found ${proposals.length} proposals to review`);
    
    // 2. Read chat history
    const chatHistory = readChatHistory();
    console.log('Chat history loaded');
    
    // 3. Get last nightly report
    const lastReport = getLastNightlyReport();
    if (lastReport) {
      console.log('\nLast Nightly Report:');
      console.log(lastReport);
    }
    
    if (proposals.length === 0) {
      console.log('\nNo new proposals to review.');
      console.log('This could mean:');
      console.log('1. The nightly workflow is still running');
      console.log('2. No new features were proposed');
      console.log('3. The AI proposals directory is empty');
      return;
    }
    
    // 4. Display proposals for review
    proposals.forEach(proposal => {
      console.log('\n--- Proposal Review ---');
      console.log(`File: ${proposal.file}`);
      console.log(`Created: ${proposal.timestamp.toLocaleString()}`);
      console.log('Content:');
      console.log(proposal.content);
      console.log('-------------------\n');
    });
    
    // 5. Process approved changes
    console.log('To approve changes:');
    console.log('1. Review each proposal carefully');
    console.log('2. Check for any potential issues');
    console.log('3. Run the following command for each approved proposal:');
    console.log('   node scripts/morning-review.js --approve <proposal-file>');
    
  } catch (error) {
    console.error(`Error in morning review: ${error.message}`);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--approve')) {
    const proposalFile = args[args.indexOf('--approve') + 1];
    if (proposalFile) {
      applyApprovedChanges(proposalFile);
    } else {
      console.error('Please specify a proposal file to approve');
    }
  } else {
    runMorningReview();
  }
}

module.exports = {
  runMorningReview,
  readProposals,
  readChatHistory,
  applyApprovedChanges
}; 