/**
 * Verify environment variables were saved
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

async function checkEnvVars() {
  const SERVICE_ID = 'srv-d3hk4fe3jp1c73fk1hjg'; // User service
  
  console.log('🔍 Checking User Service environment variables...\n');
  
  const response = await makeRenderRequest(`/services/${SERVICE_ID}/env-vars`);
  
  // Debug: show raw response structure
  console.log('Raw response sample:', JSON.stringify(response.slice(0, 2), null, 2));
  
  // Extract env vars - response is array of objects with {envVar: {key, value}}
  const envVars = response.map(item => item.envVar);
  
  console.log(`\nFound ${envVars.length} environment variables\n`);
  
  // Find MONGODB_URI
  const mongoUri = envVars.find(env => env.key === 'MONGODB_URI');
  
  if (mongoUri) {
    console.log('✅ MONGODB_URI found!');
    console.log('   Key:', mongoUri.key);
    console.log('   Value:', mongoUri.value);
  } else {
    console.log('❌ MONGODB_URI NOT FOUND!');
    console.log('\nAll environment variables:');
    envVars.forEach(env => {
      console.log(`   - ${env.key}`);
    });
  }
}

checkEnvVars();
