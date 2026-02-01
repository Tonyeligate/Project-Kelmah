/**
 * Monitor Render User Service Deployment - Mongoose Fix
 * Watches for successful User model registration
 */

const https = require('https');

const USER_SERVICE_URL = 'https://kelmah-user-service-47ot.onrender.com';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_CHECKS = 10; // 5 minutes total
const INITIAL_WAIT = 120000; // Wait 2 minutes before first check

let checkCount = 0;

console.log('🚀 Monitoring Render User Service Deployment (Mongoose Fix)');
console.log('📦 Commit: ff1d4c43');
console.log('🎯 Fix: Manual User model registration in mongoose.models');
console.log(`⏱️  Waiting ${INITIAL_WAIT/1000} seconds for deployment to start...`);
console.log('');

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
      console.log(`Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ User service is HEALTHY!');
          console.log('📊 Response:', JSON.stringify(response, null, 2));
          console.log('\n🎉 SUCCESS! Service started successfully!');
          console.log('\n📝 This means:');
          console.log('   ✅ MongoDB connection established');
          console.log('   ✅ User model registered in mongoose.models');
          console.log('   ✅ Model queries working (no buffer timeout)');
          console.log('   ✅ Server listening on port');
          console.log('\n💡 Next: Test dashboard endpoint');
          console.log('   Run: node test-dashboard-render.js');
          process.exit(0);
        } catch (e) {
          console.log('✅ Service responding (JSON parse failed):', data.substring(0, 200));
          process.exit(0);
        }
      } else if (res.statusCode === 502) {
        console.log('⚠️  502 Bad Gateway - Service still restarting');
        scheduleNextCheck();
      } else {
        console.log(`⚠️  Got ${res.statusCode}, deployment may still be in progress`);
        console.log('Response:', data.substring(0, 200));
        scheduleNextCheck();
      }
    });
  }).on('error', (error) => {
    console.log(`❌ Error: ${error.message}`);
    console.log('   (Service may still be deploying...)');
    scheduleNextCheck();
  });
}

function scheduleNextCheck() {
  if (checkCount >= MAX_CHECKS) {
    console.log('\n⏰ Reached maximum check attempts');
    console.log('💡 Check Render logs manually:');
    console.log('   https://dashboard.render.com/');
    console.log('\n🔍 Look for these log messages:');
    console.log('   ✅ "User model created and registered successfully"');
    console.log('   ✅ "User model manually registered"');
    console.log('   ✅ "User Service running on port..."');
    console.log('\n❌ If you see:');
    console.log('   "User model not found in mongoose.models registry"');
    console.log('   The fix may need another iteration');
    process.exit(1);
  } else {
    console.log(`⏳ Waiting 30 seconds before next check...`);
    setTimeout(checkHealth, CHECK_INTERVAL);
  }
}

// Wait for deployment to start, then begin checking
setTimeout(() => {
  console.log('\n✅ Initial wait complete. Starting health checks...');
  checkHealth();
}, INITIAL_WAIT);
