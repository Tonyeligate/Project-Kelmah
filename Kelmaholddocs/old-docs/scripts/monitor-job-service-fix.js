/**
 * Monitor Job Service Deployment Fix
 * Checks if Job Service deployment has been corrected
 */

const axios = require('axios');

const JOB_SERVICE_URL = 'https://kelmah-job-service.onrender.com';

/**
 * Check if Job Service is correctly deployed
 */
async function checkJobServiceStatus() {
  try {
    console.log('🔍 Checking Job Service deployment status...');
    
    // Test health endpoint
    const healthResponse = await axios.get(`${JOB_SERVICE_URL}/health`, {
      timeout: 10000
    });
    
    const serviceNameInHealth = healthResponse.data.service;
    console.log(`📋 Health endpoint reports: "${serviceNameInHealth}"`);
    
    // Test root endpoint  
    const rootResponse = await axios.get(`${JOB_SERVICE_URL}/`, {
      timeout: 10000
    });
    
    const serviceNameInRoot = rootResponse.data.name;
    console.log(`📋 Root endpoint reports: "${serviceNameInRoot}"`);
    
    // Test contracts endpoint
    let contractsWorking = false;
    try {
      const contractsResponse = await axios.get(`${JOB_SERVICE_URL}/api/jobs/contracts`, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      if (contractsResponse.status === 200) {
        contractsWorking = true;
        console.log('✅ Contracts endpoint working!');
      } else if (contractsResponse.status === 401) {
        contractsWorking = true; // 401 is expected without auth token
        console.log('✅ Contracts endpoint working (401 is expected without token)');
      } else {
        console.log(`🟡 Contracts endpoint returned: ${contractsResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Contracts endpoint failed: ${error.message}`);
    }
    
    // Determine if deployment is fixed
    const isJobService = serviceNameInHealth === 'Job Service' && 
                        serviceNameInRoot === 'Job Service API';
    
    if (isJobService && contractsWorking) {
      console.log('\n🎉 ✅ JOB SERVICE DEPLOYMENT IS FIXED!');
      console.log('✅ Service identity correct');
      console.log('✅ Contracts endpoint working');
      console.log('\n📝 Next steps:');
      console.log('1. Remove fallback contract data from contractService.js');
      console.log('2. Frontend should now load real contract data');
      return true;
    } else {
      console.log('\n🚨 ❌ Job Service deployment still broken:');
      if (!isJobService) {
        console.log(`❌ Service identity wrong: Health="${serviceNameInHealth}", Root="${serviceNameInRoot}"`);
        console.log('   Expected: Health="Job Service", Root="Job Service API"');
      }
      if (!contractsWorking) {
        console.log('❌ Contracts endpoint not working');
      }
      console.log('\n⏳ Will check again in 30 seconds...');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Failed to check Job Service: ${error.message}`);
    console.log('⏳ Will retry in 30 seconds...');
    return false;
  }
}

/**
 * Monitor until Job Service is fixed
 */
async function monitorUntilFixed() {
  console.log('🚀 Starting Job Service deployment monitoring...\n');
  
  let attempts = 0;
  const maxAttempts = 40; // 20 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`📊 Attempt ${attempts}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
    
    const isFixed = await checkJobServiceStatus();
    
    if (isFixed) {
      console.log('\n🎯 Job Service monitoring completed successfully!');
      process.exit(0);
    }
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
    console.log('\n' + '─'.repeat(60) + '\n');
  }
  
  console.log('\n⚠️  Monitoring timeout reached. Job Service may need manual intervention.');
  console.log('Check Render deployment logs for more details.');
}

// Run monitoring if called directly
if (require.main === module) {
  monitorUntilFixed().catch(console.error);
}

module.exports = { checkJobServiceStatus };