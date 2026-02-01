/**
 * Check latest deployment status
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Gur2yPUwz2RORCOwP7vbjYZvzZ5s';

function makeRenderRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path: `/v1${path}`,
      method: 'GET',
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
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkDeployments() {
  const SERVICE_ID = 'srv-d3hk4fe3jp1c73fk1hjg'; // User service
  
  console.log('🔍 Checking User Service deployment status...\n');
  
  const response = await makeRenderRequest(`/services/${SERVICE_ID}/deploys`);
  const deploys = response.map(item => item.deploy);
  
  console.log(`Found ${deploys.length} deployments\n`);
  
  // Show last 3 deployments
  for (let i = 0; i < Math.min(3, deploys.length); i++) {
    const deploy = deploys[i];
    console.log(`📦 Deploy #${i + 1}:`);
    console.log(`   ID: ${deploy.id}`);
    console.log(`   Status: ${deploy.status}`);
    console.log(`   Created: ${deploy.createdAt}`);
    console.log(`   Updated: ${deploy.updatedAt}`);
    console.log(`   Finished: ${deploy.finishedAt || 'Not finished'}`);
    console.log('');
  }
}

checkDeployments();
