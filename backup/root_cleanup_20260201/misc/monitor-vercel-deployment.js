/**
 * Monitor Vercel Frontend Deployment
 * Checks if frontend successfully connects to Render backend
 */

const https = require('https');

const FRONTEND_URL = 'https://kelmah-frontend-cyan.vercel.app';
const BACKEND_URL = 'https://kelmah-api-gateway-5loa.onrender.com';
const CHECK_INTERVAL = 15000; // 15 seconds
const MAX_CHECKS = 12; // 3 minutes total

let checkCount = 0;

console.log('🚀 Monitoring Vercel Frontend Deployment');
console.log('📦 Frontend URL:', FRONTEND_URL);
console.log('🔗 Backend URL:', BACKEND_URL);
console.log('⏱️  Will check every 15 seconds for up to 3 minutes\n');

function checkBackend() {
  return new Promise((resolve, reject) => {
    https.get(`${BACKEND_URL}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Backend returned ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

function checkFrontend() {
  return new Promise((resolve, reject) => {
    https.get(`${FRONTEND_URL}/runtime-config.json`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const config = JSON.parse(data);
            resolve(config);
          } catch (e) {
            reject(new Error('Failed to parse runtime-config.json'));
          }
        } else {
          reject(new Error(`Frontend returned ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function performCheck() {
  checkCount++;
  console.log(`\n🔍 Check #${checkCount}/${MAX_CHECKS} at ${new Date().toLocaleTimeString()}`);
  
  try {
    // Check backend is healthy
    console.log('📡 Checking backend health...');
    const backendHealth = await checkBackend();
    console.log(`✅ Backend healthy: ${backendHealth.services.length} services`);
    
    // Check frontend config
    console.log('📱 Checking frontend runtime config...');
    const frontendConfig = await checkFrontend();
    
    if (frontendConfig.API_URL === BACKEND_URL) {
      console.log('✅ Frontend config updated successfully!');
      console.log('\n🎉 DEPLOYMENT COMPLETE!');
      console.log('\n📊 Configuration:');
      console.log('   API URL:', frontendConfig.API_URL);
      console.log('   WebSocket URL:', frontendConfig.WS_URL);
      console.log('   Tunnel Type:', frontendConfig.TUNNEL_TYPE);
      console.log('   Timestamp:', frontendConfig.timestamp);
      console.log('\n✨ Your frontend is now connected to Render production backend!');
      console.log('🌐 Visit:', FRONTEND_URL);
      console.log('\n💡 Next steps:');
      console.log('   1. Open the site and check browser console');
      console.log('   2. CORS errors should be gone');
      console.log('   3. All API calls should succeed');
      process.exit(0);
    } else {
      console.log(`⚠️  Frontend still using: ${frontendConfig.API_URL}`);
      console.log('   Expected:', BACKEND_URL);
      console.log('   Vercel deployment may still be propagating...');
      scheduleNextCheck();
    }
  } catch (error) {
    console.log(`❌ Check failed: ${error.message}`);
    scheduleNextCheck();
  }
}

function scheduleNextCheck() {
  if (checkCount >= MAX_CHECKS) {
    console.log('\n⏰ Reached maximum check attempts');
    console.log('💡 Vercel deployment may be taking longer than expected');
    console.log('   Check manually:', FRONTEND_URL);
    console.log('   Or visit Vercel dashboard: https://vercel.com/');
    process.exit(1);
  } else {
    console.log(`⏳ Waiting 15 seconds before next check...`);
    setTimeout(performCheck, CHECK_INTERVAL);
  }
}

// Start first check
performCheck();
