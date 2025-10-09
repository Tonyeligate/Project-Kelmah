/**
 * Monitor Render Deployment Status
 * Checks user-service health every 30 seconds until deployment completes
 */

const https = require('https');

const USER_SERVICE_URL = 'https://kelmah-user-service-47ot.onrender.com';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_CHECKS = 10; // 5 minutes total

let checkCount = 0;

function checkHealth() {
  checkCount++;
  console.log(`\n🔍 Health check #${checkCount}/${MAX_CHECKS} at ${new Date().toLocaleTimeString()}`);
  console.log(`📡 Checking: ${USER_SERVICE_URL}/health`);

  https.get(`${USER_SERVICE_URL}/health`, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('📊 Response:', JSON.stringify(response, null, 2));
          console.log('\n🎉 SUCCESS! User service is healthy!');
          console.log('\n📝 Next steps:');
          console.log('   1. Check Render logs for "User model registered successfully"');
          console.log('   2. Test dashboard endpoint: node test-render-live.js');
          console.log('   3. Verify 200 OK response instead of 500 error');
          process.exit(0);
        } catch (e) {
          console.log('✅ Service responding but JSON parse failed:', data.substring(0, 200));
        }
      } else {
        console.log(`⚠️  Got ${res.statusCode}, deployment may still be in progress`);
        scheduleNextCheck();
      }
    });
  }).on('error', (error) => {
    console.log(`❌ Error: ${error.message}`);
    console.log('   (This is expected during deployment - service is restarting)');
    scheduleNextCheck();
  });
}

function scheduleNextCheck() {
  if (checkCount >= MAX_CHECKS) {
    console.log('\n⏰ Reached maximum check attempts');
    console.log('💡 Deployment may be taking longer than expected');
    console.log('   Check Render dashboard manually: https://dashboard.render.com/');
    process.exit(1);
  } else {
    console.log(`⏳ Waiting 30 seconds before next check...`);
    setTimeout(checkHealth, CHECK_INTERVAL);
  }
}

console.log('🚀 Starting Render Deployment Monitor');
console.log('📦 Monitoring user-service deployment (Commit 474bbf19)');
console.log('⏱️  Will check every 30 seconds for up to 5 minutes\n');

// Start first check immediately
checkHealth();
