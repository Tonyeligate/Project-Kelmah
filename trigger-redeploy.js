/**
 * Trigger manual redeploy of all Render services
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Gur2yPUwz2RORCOwP7vbjYZvzZ5s';

const SERVICE_IDS = [
  { id: 'srv-d3hjv0buibrs73avs5rg', name: 'kelmah-api-gateway' },
  { id: 'srv-d3hk2p15pdvs73fb5qjg', name: 'kelmah-auth-service' },
  { id: 'srv-d3hk4fe3jp1c73fk1hjg', name: 'kelmah-user-service' },
  { id: 'srv-d3hk3r3uibrs73avvgog', name: 'kelmah-job-service' },
  { id: 'srv-d3hk9615pdvs73fbauj0', name: 'kelmah-messaging-service' },
  { id: 'srv-d3hk9pm3jp1c73fk5550', name: 'kelmah-review-service' },
];

function makeRenderRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
      }
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

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function triggerRedeploys() {
  console.log('🚀 Triggering manual redeploy for all services...\n');

  for (const service of SERVICE_IDS) {
    console.log(`📦 Redeploying ${service.name}...`);
    
    try {
      const result = await makeRenderRequest(`/services/${service.id}/deploys`, 'POST', {
        clearCache: 'do_not_clear'
      });
      
      if (result.status === 201 || result.status === 200) {
        console.log(`   ✅ Deploy triggered successfully!`);
        console.log(`   Deploy ID: ${result.data.id || 'N/A'}`);
      } else {
        console.log(`   ⚠️ Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('\n✅ All redeploy triggers sent!');
  console.log('\n⏳ Services will restart with new MONGODB_URI in 2-4 minutes');
  console.log('\n📝 Monitor status at: https://dashboard.render.com/');
}

triggerRedeploys();
