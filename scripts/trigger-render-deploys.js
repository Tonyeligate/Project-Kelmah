/**
 * Trigger deployments on all Render services
 */
const https = require('https');

const RENDER_API_KEY = 'rnd_GFPlvRagdHGH06bA8Xl8n7lCPt3z';

const SERVICES = [
  { name: 'api-gateway', id: 'srv-d68i3ah4tr6s73c7kv50' },
  { name: 'auth-service', id: 'srv-d68i1asr85hc73csu2lg' },
  { name: 'user-service', id: 'srv-d68i1ci48b3s73amdu8g' },
  { name: 'job-service', id: 'srv-d68i1bjuibrs73925cfg' },
  { name: 'payment-service', id: 'srv-d68i1e3uibrs73925dr0' },
  { name: 'messaging-service', id: 'srv-d68i1d6mcj7s738b5reg' },
  { name: 'review-service', id: 'srv-d68i1f14tr6s73c7k9i0' }
];

function triggerDeploy(serviceId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ clearCache: 'do_not_clear' });
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${serviceId}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🚀 Triggering deployments on all Render services...\n');

  for (const svc of SERVICES) {
    try {
      const result = await triggerDeploy(svc.id);
      if (result.status >= 200 && result.status < 300) {
        console.log(`  ✅ ${svc.name} — deploy triggered (HTTP ${result.status})`);
      } else {
        console.log(`  ❌ ${svc.name} — HTTP ${result.status}: ${result.body.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`  ❌ ${svc.name} — Error: ${err.message}`);
    }
  }

  console.log('\n✅ Done! Deployments building. Expect 2-4 minutes for services to come online.');
}

main();
