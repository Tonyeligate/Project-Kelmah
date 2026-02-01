/**
 * Render Service Environment Check and Fix Script
 * Uses Render API to check and update environment variables
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Gur2yPUwz2RORCOwP7vbjYZvzZ5s';
const MONGODB_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// Service URLs to check
const SERVICES = [
  'https://kelmah-api-gateway-5loa.onrender.com',
  'https://kelmah-user-service-47ot.onrender.com',
  'https://kelmah-job-service-wlyu.onrender.com',
  'https://kelmah-messaging-service-rjot.onrender.com',
  'https://kelmah-auth-service-d2d1.onrender.com',
  'https://kelmah-review-service-xhvb.onrender.com',
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
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkAndFixServices() {
  console.log('🔍 Checking Render Services...\n');

  try {
    // Get all services
    const response = await makeRenderRequest('/services');
    const serviceWrappers = Array.isArray(response) ? response : (response.services || []);
    
    console.log(`📊 Found ${serviceWrappers.length} services\n`);

    for (const wrapper of serviceWrappers) {
      const service = wrapper.service; // Extract actual service object
      
      console.log(`\n🔧 Service: ${service.name}`);
      console.log(`   ID: ${service.id}`);
      console.log(`   URL: ${service.serviceDetails?.url || 'N/A'}`);
      
      // Get environment variables
      const envResponse = await makeRenderRequest(`/services/${service.id}/env-vars`);
      const envVars = Array.isArray(envResponse) ? envResponse : (envResponse.envVars || []);
      
      console.log(`   Found ${envVars.length} environment variables`);
      
      // Check if MONGODB_URI exists
      const mongoUri = envVars.find(env => env.key === 'MONGODB_URI');
      
      if (!mongoUri) {
        console.log('   ❌ MONGODB_URI is MISSING!');
        console.log('   ⏳ Adding MONGODB_URI...');
        
        // Add MONGODB_URI
        await makeRenderRequest(`/services/${service.id}/env-vars`, 'POST', {
          key: 'MONGODB_URI',
          value: MONGODB_URI
        });
        
        console.log('   ✅ MONGODB_URI added!');
      } else if (mongoUri.value !== MONGODB_URI) {
        console.log('   ⚠️ MONGODB_URI exists but is different!');
        console.log('   Current:', mongoUri.value.substring(0, 50) + '...');
        console.log('   ⏳ Updating MONGODB_URI...');
        
        // Update MONGODB_URI
        await makeRenderRequest(`/services/${service.id}/env-vars/${mongoUri.id}`, 'PUT', {
          value: MONGODB_URI
        });
        
        console.log('   ✅ MONGODB_URI updated!');
      } else {
        console.log('   ✅ MONGODB_URI is correct');
      }
    }

    console.log('\n\n✅ All services checked and fixed!');
    console.log('\n📝 Next steps:');
    console.log('1. Services will auto-deploy with new environment variables');
    console.log('2. Wait 3-5 minutes for all services to restart');
    console.log('3. Test: https://project-kelmah.vercel.app');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

checkAndFixServices();
