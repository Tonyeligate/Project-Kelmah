const BACKEND_URL = 'https://kelmah-backend-six.vercel.app';

console.log('🔍 Testing Backend Route Structure...\n');

// Test different possible route patterns
const routesToTest = [
  // Root level
  { name: 'Root', url: `${BACKEND_URL}/` },
  { name: 'API Base', url: `${BACKEND_URL}/api` },
  
  // Different API patterns
  { name: 'Auth Routes', url: `${BACKEND_URL}/auth` },
  { name: 'API Auth', url: `${BACKEND_URL}/api/auth` },
  { name: 'Jobs', url: `${BACKEND_URL}/jobs` },
  { name: 'API Jobs', url: `${BACKEND_URL}/api/jobs` },
  
  // Service endpoints
  { name: 'Health', url: `${BACKEND_URL}/health` },
  { name: 'Status', url: `${BACKEND_URL}/status` },
  { name: 'API Health', url: `${BACKEND_URL}/api/health` },
  
  // Test specific endpoints that might exist
  { name: 'Users', url: `${BACKEND_URL}/users` },
  { name: 'API Users', url: `${BACKEND_URL}/api/users` },
];

async function testRoute(name, url) {
  try {
    const response = await fetch(url);
    const status = response.status;
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    let message = '';
    if (status === 200) message = '✅ Working!';
    else if (status === 404) message = '❌ Not found';
    else if (status === 401) message = '🔐 Auth required';
    else if (status === 403) message = '🚫 Forbidden';
    else message = `⚠️ Status: ${status}`;
    
    console.log(`${message} ${name}: ${url}`);
    if (corsHeader) console.log(`    CORS: ${corsHeader}`);
    
    return { name, url, status, working: status === 200 };
  } catch (error) {
    console.log(`❌ Error ${name}: ${error.message}`);
    return { name, url, error: error.message, working: false };
  }
}

async function main() {
  console.log(`Testing: ${BACKEND_URL}\n`);
  
  const results = [];
  for (const route of routesToTest) {
    const result = await testRoute(route.name, route.url);
    results.push(result);
  }
  
  const workingRoutes = results.filter(r => r.working);
  console.log(`\n📊 Found ${workingRoutes.length} working routes:`);
  workingRoutes.forEach(r => console.log(`✅ ${r.name}: ${r.url}`));
  
  if (workingRoutes.length === 0) {
    console.log('\n🔧 Recommendations:');
    console.log('1. Check if the backend is properly deployed');
    console.log('2. Verify the main entry point (app.js or server.js)');
    console.log('3. Ensure routes are properly mounted');
    console.log('4. Check deployment logs for errors');
  }
}

main().catch(console.error); 