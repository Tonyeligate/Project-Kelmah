/**
 * Monitor Render service deployment status
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Gur2yPUwz2RORCOwP7vbjYZvzZ5s';

const SERVICES = [
  { id: 'srv-d3hjv0buibrs73avs5rg', name: 'API Gateway', url: 'https://kelmah-api-gateway-5loa.onrender.com' },
  { id: 'srv-d3hk2p15pdvs73fb5qjg', name: 'Auth Service', url: 'https://kelmah-auth-service-d2d1.onrender.com' },
  { id: 'srv-d3hk4fe3jp1c73fk1hjg', name: 'User Service', url: 'https://kelmah-user-service-47ot.onrender.com' },
  { id: 'srv-d3hk3r3uibrs73avvgog', name: 'Job Service', url: 'https://kelmah-job-service-wlyu.onrender.com' },
  { id: 'srv-d3hk9615pdvs73fbauj0', name: 'Messaging Service', url: 'https://kelmah-messaging-service-rjot.onrender.com' },
  { id: 'srv-d3hk9pm3jp1c73fk5550', name: 'Review Service', url: 'https://kelmah-review-service-xhvb.onrender.com' },
];

function makeRequest(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', () => resolve({ status: 0, data: 'Connection error' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, data: 'Timeout' });
    });
    req.end();
  });
}

async function checkServices() {
  console.log('🔍 Checking service deployment status...\n');
  
  let allHealthy = true;
  
  for (const service of SERVICES) {
    process.stdout.write(`📡 ${service.name.padEnd(20)} ... `);
    
    const result = await makeRequest(`${service.url}/health`);
    
    if (result.status === 200) {
      console.log('✅ HEALTHY');
    } else if (result.status === 503) {
      console.log('⏳ DEPLOYING (503)');
      allHealthy = false;
    } else if (result.status === 0) {
      console.log('⏳ STARTING (no response)');
      allHealthy = false;
    } else {
      console.log(`⚠️ STATUS ${result.status}`);
      allHealthy = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allHealthy) {
    console.log('\n✅ ALL SERVICES ARE HEALTHY!\n');
    console.log('🧪 Testing user service endpoint...\n');
    
    const testResult = await makeRequest('https://kelmah-user-service-47ot.onrender.com/api/users/dashboard/metrics');
    console.log(`Status: ${testResult.status}`);
    if (testResult.status === 200) {
      console.log('✅ Database connection working!');
      console.log('Data:', JSON.stringify(testResult.data, null, 2).substring(0, 500));
    } else {
      console.log('Response:', testResult.data.substring(0, 200));
    }
  } else {
    console.log('\n⏳ Some services still deploying... Check again in 30 seconds');
  }
}

checkServices();
