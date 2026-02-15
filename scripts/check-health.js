const https = require('https');

const services = [
  ['api-gateway', 'https://kelmah-api-gateway-hkke.onrender.com/health'],
  ['auth-service', 'https://kelmah-auth-service-dw1u.onrender.com/health'],
  ['user-service', 'https://kelmah-user-service-tb8s.onrender.com/health'],
  ['job-service', 'https://kelmah-job-service-1k2m.onrender.com/health'],
  ['payment-service', 'https://kelmah-payment-service-fnqn.onrender.com/health'],
  ['messaging-service', 'https://kelmah-messaging-service-kbis.onrender.com/health'],
  ['review-service', 'https://kelmah-review-service-u7rs.onrender.com/health']
];

function check(name, url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: 45000 }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({ name, status: res.statusCode, ok: res.statusCode === 200 });
      });
    });
    req.on('error', e => resolve({ name, status: 'error', error: e.message, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ name, status: 'timeout', ok: false }); });
  });
}

async function main() {
  console.log('🔍 Checking health of all services...\n');

  const results = await Promise.all(services.map(([n, u]) => check(n, u)));

  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    const detail = r.error ? ` (${r.error})` : '';
    console.log(`  ${icon} ${r.name}: ${r.status}${detail}`);
  }

  const upCount = results.filter(r => r.ok).length;
  console.log(`\n📊 ${upCount}/${results.length} services healthy`);
}

main();
