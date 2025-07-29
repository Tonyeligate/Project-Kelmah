const https = require('https');
const http = require('http');

const FRONTEND_URL = 'https://kelmah-frontend-cyan.vercel.app';
const BACKEND_SERVICES = {
  'API Gateway': 'https://kelmah-backend-six.vercel.app',
  'Auth Service': 'https://kelmah-auth-service.onrender.com',
  'User Service': 'https://kelmah-user-service.onrender.com',
  'Job Service': 'https://kelmah-job-service.onrender.com',
  'Messaging Service': 'https://kelmah-messaging-service.onrender.com',
  'Payment Service': 'https://kelmah-payment-service.onrender.com'
};

console.log('🚀 Verifying Production Setup...\n');

// Check if URL is accessible
function checkUrl(name, url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✅ ${name}: ${res.statusCode} - ${url}`);
      resolve({ name, url, status: res.statusCode, success: true });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name}: ERROR - ${url} - ${err.message}`);
      resolve({ name, url, error: err.message, success: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏱️ ${name}: TIMEOUT - ${url}`);
      resolve({ name, url, error: 'Timeout', success: false });
    });
  });
}

async function verifyServices() {
  console.log('🔍 Checking Frontend...');
  await checkUrl('Frontend', FRONTEND_URL);
  
  console.log('\n🔍 Checking Backend Services...');
  const promises = Object.entries(BACKEND_SERVICES).map(([name, url]) => 
    checkUrl(name, url + '/health')
  );
  
  const results = await Promise.all(promises);
  
  console.log('\n📊 Summary:');
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('Backend Services:');
  
  results.forEach(result => {
    const status = result.success ? '✅ ONLINE' : '❌ OFFLINE';
    console.log(`  ${result.name}: ${status}`);
  });
  
  const allServicesOnline = results.every(r => r.success);
  console.log(`\n${allServicesOnline ? '🎉 All services are online!' : '⚠️ Some services are offline'}`);
  
  return {
    frontend: FRONTEND_URL,
    services: results,
    allOnline: allServicesOnline
  };
}

// CORS verification
async function verifyCORS() {
  console.log('\n🔐 Verifying CORS Configuration...');
  
  // This would typically require a browser environment, but we can check headers
  for (const [name, url] of Object.entries(BACKEND_SERVICES)) {
    try {
      const response = await fetch(url + '/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = response.headers.get('Access-Control-Allow-Origin');
      if (corsHeaders && (corsHeaders === '*' || corsHeaders === FRONTEND_URL)) {
        console.log(`✅ ${name}: CORS configured correctly`);
      } else {
        console.log(`⚠️ ${name}: CORS might need configuration`);
      }
    } catch (error) {
      console.log(`❌ ${name}: CORS check failed - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  try {
    const results = await verifyServices();
    await verifyCORS();
    
    console.log('\n📋 Configuration Checklist:');
    console.log('□ Frontend deployed at:', FRONTEND_URL);
    console.log('□ Backend services accessible');
    console.log('□ CORS configured for frontend domain');
    console.log('□ OAuth redirects updated');
    console.log('□ Environment variables set');
    
    if (!results.allOnline) {
      console.log('\n⚠️ Action Required:');
      console.log('1. Deploy any offline services');
      console.log('2. Update environment variables');
      console.log('3. Verify CORS configuration');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

main(); 