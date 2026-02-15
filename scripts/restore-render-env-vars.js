/**
 * Restore and configure all environment variables on Render services.
 * This restores the original vars that were accidentally replaced,
 * plus adds the new inter-service URL vars for keep-alive and discovery.
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_GFPlvRagdHGH06bA8Xl8n7lCPt3z';
const MONGO_URI = 'mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';
const MESSAGING_MONGO_URI = 'mongodb+srv://Tonygb:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging';

// ---- Service URL mapping ----
const SERVICE_URLS = {
  API_GATEWAY_URL: 'https://kelmah-api-gateway-hkke.onrender.com',
  AUTH_SERVICE_URL: 'https://kelmah-auth-service-dw1u.onrender.com',
  USER_SERVICE_URL: 'https://kelmah-user-service-tb8s.onrender.com',
  JOB_SERVICE_URL: 'https://kelmah-job-service-1k2m.onrender.com',
  PAYMENT_SERVICE_URL: 'https://kelmah-payment-service-fnqn.onrender.com',
  MESSAGING_SERVICE_URL: 'https://kelmah-messaging-service-kbis.onrender.com',
  REVIEW_SERVICE_URL: 'https://kelmah-review-service-u7rs.onrender.com'
};

// ---- Shared env vars (all services get these) ----
const SHARED_VARS = {
  JWT_SECRET: 'Deladem_Tony',
  JWT_REFRESH_SECRET: 'Tony_Deladem',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '465',
  SMTP_USER: 'anthonyjioeeli@gmail.com',
  SMTP_PASS: 'gagqcptenhykvzbm',
  EMAIL_FROM: 'anthonyjioeeli@gmail.com',
  FRONTEND_URL: 'https://kelmah-frontend-cyan.vercel.app',
  NODE_DEBUG: 'mail',
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  INTERNAL_API_KEY: 'kelmah-internal-key-2024',
  MONGODB_URI: MONGO_URI,
  AUTH_MONGO_URI: MONGO_URI,
  USER_MONGO_URI: MONGO_URI,
  JOB_MONGO_URI: MONGO_URI,
  PAYMENT_MONGO_URI: MONGO_URI,
  MESSAGING_MONGO_URI: MESSAGING_MONGO_URI,
  REVIEW_MONGO_URI: MONGO_URI,
  DB_NAME: 'kelmah_platform',
  DB_HOST: 'kelmah-messaging.xyqcurn.mongodb.net',
  DB_USER: 'TonyGate',
  DB_PASSWORD: '0553366244Aj',
  KEEP_ALIVE_ENABLED: 'true',
  ...SERVICE_URLS
};

// ---- Per-service configurations ----
const SERVICES = {
  'api-gateway': {
    id: 'srv-d68i3ah4tr6s73c7kv50',
    extraVars: {
      API_GATEWAY_PORT: '5000',
      ALLOWED_ORIGINS: 'https://kelmah-frontend-cyan.vercel.app,http://localhost:3000,http://localhost:5000',
      ENABLE_AUTO_SERVICE_DISCOVERY: 'true',
      SERVICE_HEALTH_CHECK_TIMEOUT: '15000',
      // Cloud URLs for service discovery
      AUTH_SERVICE_CLOUD_URL: SERVICE_URLS.AUTH_SERVICE_URL,
      USER_SERVICE_CLOUD_URL: SERVICE_URLS.USER_SERVICE_URL,
      JOB_SERVICE_CLOUD_URL: SERVICE_URLS.JOB_SERVICE_URL,
      PAYMENT_SERVICE_CLOUD_URL: SERVICE_URLS.PAYMENT_SERVICE_URL,
      MESSAGING_SERVICE_CLOUD_URL: SERVICE_URLS.MESSAGING_SERVICE_URL,
      REVIEW_SERVICE_CLOUD_URL: SERVICE_URLS.REVIEW_SERVICE_URL
    }
  },
  'auth-service': { id: 'srv-d68i1asr85hc73csu2lg', extraVars: {} },
  'user-service': { id: 'srv-d68i1ci48b3s73amdu8g', extraVars: {} },
  'job-service': { id: 'srv-d68i1bjuibrs73925cfg', extraVars: {} },
  'payment-service': { id: 'srv-d68i1e3uibrs73925dr0', extraVars: {} },
  'messaging-service': { id: 'srv-d68i1d6mcj7s738b5reg', extraVars: {} },
  'review-service': { id: 'srv-d68i1f14tr6s73c7k9i0', extraVars: {} }
};

// ---- Render API helper ----
function renderPut(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path,
      method: 'PUT',
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ---- Main ----
async function main() {
  console.log('🔧 Restoring environment variables on all Render services...\n');

  for (const [name, config] of Object.entries(SERVICES)) {
    const vars = { ...SHARED_VARS, ...config.extraVars };
    const envArray = Object.entries(vars).map(([key, value]) => ({ key, value }));

    console.log(`📦 ${name} (${config.id}): ${envArray.length} env vars`);

    try {
      await renderPut(`/v1/services/${config.id}/env-vars`, envArray);
      console.log(`   ✅ ${name} env vars restored successfully`);
    } catch (err) {
      console.error(`   ❌ ${name} failed: ${err.message}`);
    }
  }

  console.log('\n✅ All service environment variables restored!');
  console.log('⚠️  Services will need to be redeployed for changes to take effect.');
}

main().catch(console.error);
