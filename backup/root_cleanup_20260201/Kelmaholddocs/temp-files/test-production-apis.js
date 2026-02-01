// Using Node.js built-in fetch (Node 18+)
const BACKEND_URL = 'https://kelmah-backend-six.vercel.app';
const FRONTEND_URL = 'https://kelmah-frontend-cyan.vercel.app';

console.log('🧪 Testing Production API Endpoints...\n');

// Test endpoints that the frontend actually uses
const endpoints = [
  { name: 'API Root', url: `${BACKEND_URL}/api` },
  { name: 'Health Check', url: `${BACKEND_URL}/api/health` },
  { name: 'Auth Status', url: `${BACKEND_URL}/api/auth/status` },
  { name: 'Jobs API', url: `${BACKEND_URL}/api/jobs` },
  { name: 'Users API', url: `${BACKEND_URL}/api/users` },
  { name: 'Skills API', url: `${BACKEND_URL}/api/skills` },
];

async function testEndpoint(name, url) {
  try {
    console.log(`🔍 Testing ${name}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json',
      },
    });

    const corsHeader = response.headers.get('access-control-allow-origin');
    const status = response.status;
    
    console.log(`   Status: ${status}`);
    console.log(`   CORS: ${corsHeader || 'Not set'}`);
    
    if (status === 200) {
      try {
        const data = await response.json();
        console.log(`   ✅ Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (e) {
        console.log(`   ✅ Response received (non-JSON)`);
      }
    } else if (status === 404) {
      console.log(`   ⚠️  Endpoint not found (might need implementation)`);
    } else {
      console.log(`   ❌ Error status: ${status}`);
    }
    
    return { name, url, status, cors: corsHeader, success: status < 500 };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { name, url, error: error.message, success: false };
  }
}

async function main() {
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}\n`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push(result);
    console.log(''); // spacing
  }
  
  console.log('📊 Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status || 'ERROR'}`);
  });
  
  const workingEndpoints = results.filter(r => r.success).length;
  const totalEndpoints = results.length;
  
  console.log(`\n🎯 ${workingEndpoints}/${totalEndpoints} endpoints accessible`);
  
  if (workingEndpoints > 0) {
    console.log('\n✅ Good news! Your backend is accessible from the frontend domain.');
    console.log('🔍 Check your frontend app for actual functionality.');
    console.log('\n📋 Next Steps:');
    console.log('1. Open your frontend: https://kelmah-frontend-cyan.vercel.app');
    console.log('2. Check browser developer tools for any errors');
    console.log('3. Test key features like login, job search, profile');
    console.log('4. Monitor API calls in Network tab');
  } else {
    console.log('\n⚠️ No endpoints accessible. Check deployment status.');
  }
}

main().catch(console.error); 