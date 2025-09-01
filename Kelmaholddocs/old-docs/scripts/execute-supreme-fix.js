#!/usr/bin/env node

/**
 * 🚀 SUPREME EXECUTION SCRIPT
 * Runs all fixes in the correct order to completely resolve Kelmah issues
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SUPREME KELMAH FIX EXECUTION');
console.log('==============================');
console.log('This script will execute all fixes in the correct order\n');

const SCRIPTS_TO_RUN = [
  {
    name: 'Database Schema Fix',
    script: 'fix-production-database.js',
    description: 'Fix missing database columns and schema issues',
    critical: true
  },
  {
    name: 'Mock Data Elimination',
    script: 'remove-all-mock-fallbacks.js',
    description: 'Remove all mock data fallbacks from frontend',
    critical: true
  },
  {
    name: 'Create Hirer Users',
    script: 'create-hirer-users.js',
    description: 'Create 20 professional hirer users',
    critical: false
  },
  {
    name: 'Enhance Worker Profiles',
    script: 'enhance-worker-profiles.js',
    description: 'Add complete portfolio data to existing workers',
    critical: false
  },
  {
    name: 'System Verification',
    script: 'test-complete-system.js',
    description: 'Verify all systems are working with real data',
    critical: true
  },
  {
    name: 'Generate Documentation',
    script: 'generate-user-documentation.js',
    description: 'Create complete user and system documentation',
    critical: false
  }
];

async function runScript(scriptInfo) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Running: ${scriptInfo.name}`);
    console.log(`📋 Description: ${scriptInfo.description}`);
    
    const scriptPath = path.join(__dirname, scriptInfo.script);
    
    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️  Script not found: ${scriptPath}`);
      resolve({ success: false, skipped: true });
      return;
    }

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptInfo.name} completed successfully`);
        resolve({ success: true, code });
      } else {
        console.log(`❌ ${scriptInfo.name} failed with code ${code}`);
        resolve({ success: false, code });
      }
    });

    child.on('error', (error) => {
      console.error(`💥 ${scriptInfo.name} execution error:`, error.message);
      resolve({ success: false, error: error.message });
    });
  });
}

async function executeSupremeFix() {
  console.log('📋 EXECUTION PLAN:');
  SCRIPTS_TO_RUN.forEach((script, index) => {
    const priority = script.critical ? '🚨 CRITICAL' : '📋 OPTIONAL';
    console.log(`   ${index + 1}. ${script.name} - ${priority}`);
  });

  console.log('\n⚡ Starting execution...\n');

  const results = [];
  let criticalFailures = 0;

  for (let i = 0; i < SCRIPTS_TO_RUN.length; i++) {
    const script = SCRIPTS_TO_RUN[i];
    const result = await runScript(script);
    
    results.push({
      script: script.name,
      ...result,
      critical: script.critical
    });

    if (!result.success && script.critical && !result.skipped) {
      criticalFailures++;
      console.log(`\n⚠️  CRITICAL FAILURE in ${script.name}`);
      
      // Ask user if they want to continue
      console.log('❓ Do you want to continue with non-critical scripts? (Ctrl+C to stop)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Add delay between scripts
    if (i < SCRIPTS_TO_RUN.length - 1) {
      console.log('\n⏱️  Waiting 2 seconds before next script...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate execution summary
  console.log('\n🎯 EXECUTION SUMMARY');
  console.log('===================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`🚨 Critical Failures: ${criticalFailures}`);

  if (criticalFailures === 0) {
    console.log('\n🎉 SUCCESS! All critical fixes completed successfully!');
    console.log('🚀 Your Kelmah platform should now be working with real data');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open https://kelmah-frontend-mu.vercel.app/');
    console.log('2. Test login with any user from verified-users-final.json');
    console.log('3. Verify no mock data is being used');
    console.log('4. Test complete workflows (job posting, applications, messaging)');
    
  } else {
    console.log('\n⚠️  ATTENTION REQUIRED!');
    console.log(`${criticalFailures} critical script(s) failed.`);
    console.log('\nFailed critical scripts:');
    results.filter(r => !r.success && r.critical && !r.skipped).forEach(r => {
      console.log(`   ❌ ${r.script}`);
    });
    
    console.log('\n📋 RECOMMENDED ACTIONS:');
    console.log('1. Check the error messages above');
    console.log('2. Verify your DATABASE_URL environment variable');
    console.log('3. Ensure all backend services are running');
    console.log('4. Run failed scripts individually for debugging');
  }

  // Save results
  const resultFile = path.join(__dirname, 'supreme-fix-results.json');
  fs.writeFileSync(resultFile, JSON.stringify({
    executionTime: new Date().toISOString(),
    summary: { successful, failed, skipped, criticalFailures },
    results
  }, null, 2));

  console.log(`\n💾 Execution results saved to: ${resultFile}`);
}

async function checkPrerequisites() {
  console.log('🔍 CHECKING PREREQUISITES');
  console.log('=========================');

  // Check if all script files exist
  const missingScripts = [];
  SCRIPTS_TO_RUN.forEach(script => {
    const scriptPath = path.join(__dirname, script.script);
    if (!fs.existsSync(scriptPath)) {
      missingScripts.push(script.script);
    }
  });

  if (missingScripts.length > 0) {
    console.log('❌ Missing script files:');
    missingScripts.forEach(script => console.log(`   • ${script}`));
    console.log('\nPlease ensure all scripts are created before running this executor.');
    process.exit(1);
  }

  console.log('✅ All script files found');

  // Check for environment variables
  if (!process.env.DATABASE_URL && !process.env.TIMESCALE_DATABASE_URL) {
    console.log('⚠️  Warning: No DATABASE_URL environment variable found');
    console.log('   Database fix script may fail without proper database connection');
    console.log('   Set DATABASE_URL with your TimescaleDB connection string');
  } else {
    console.log('✅ Database connection string found');
  }

  console.log('✅ Prerequisites check completed\n');
}

if (require.main === module) {
  checkPrerequisites()
    .then(() => executeSupremeFix())
    .catch(console.error);
}

module.exports = { executeSupremeFix };