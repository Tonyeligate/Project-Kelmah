/**
 * Verify User Service Routes After Deployment
 * Tests all routes that were returning 404 errors
 */

const https = require('https');

const USER_SERVICE_URL = 'https://kelmah-user-service-47ot.onrender.com';
const API_GATEWAY_URL = 'https://kelmah-api-gateway-nhxc.onrender.com';

// Test user credentials (from spec-kit)
const TEST_CREDENTIALS = {
  email: 'giftyafisa@gmail.com',
  password: '11221122Tg'
};

let authToken = null;
let testUserId = null;

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            data: JSON.parse(body),
            headers: res.headers
          });
        } catch {
          resolve({ 
            status: res.statusCode, 
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => resolve({ 
      status: 0, 
      data: `Connection error: ${err.message}` 
    }));
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, data: 'Request timeout' });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function login() {
  console.log('🔐 Logging in to get auth token...\n');
  
  const result = await makeRequest(`${API_GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    body: TEST_CREDENTIALS
  });

  if (result.status === 200 && result.data.token) {
    authToken = result.data.token;
    testUserId = result.data.user?.id || result.data.user?._id;
    console.log('✅ Login successful');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function testRoute(name, url, description) {
  process.stdout.write(`\n🧪 Testing: ${name}\n`);
  process.stdout.write(`   ${description}\n`);
  process.stdout.write(`   URL: ${url}\n`);
  process.stdout.write(`   Sending request... `);
  
  const result = await makeRequest(url, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (result.status === 200) {
    console.log('✅ SUCCESS (200)');
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 150)}...`);
    return true;
  } else if (result.status === 404) {
    console.log('❌ FAILED (404) - Route not found!');
    console.log(`   Response: ${JSON.stringify(result.data)}`);
    return false;
  } else if (result.status === 500) {
    console.log('⚠️ FAILED (500) - Server error!');
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}`);
    return false;
  } else {
    console.log(`⚠️ FAILED (${result.status})`);
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}`);
    return false;
  }
}

async function runTests() {
  console.log('=' .repeat(80));
  console.log('USER SERVICE ROUTE VERIFICATION AFTER DEPLOYMENT');
  console.log('=' .repeat(80));
  console.log('\nThis script tests all routes that were previously returning 404 errors\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication. Exiting...\n');
    return;
  }

  console.log('\n' + '-'.repeat(80));
  console.log('TESTING ROUTES THAT WERE RETURNING 404');
  console.log('-'.repeat(80));

  const results = [];

  // Test 1: Worker Availability (ERROR #1)
  results.push(await testRoute(
    'Worker Availability',
    `${API_GATEWAY_URL}/api/users/workers/${testUserId}/availability`,
    'Get worker availability schedule'
  ));

  // Test 2: Worker Completeness (ERROR #4)
  results.push(await testRoute(
    'Profile Completeness',
    `${API_GATEWAY_URL}/api/users/workers/${testUserId}/completeness`,
    'Get profile completion percentage'
  ));

  // Test 3: Recent Jobs (ERROR #5)
  results.push(await testRoute(
    'Recent Jobs',
    `${API_GATEWAY_URL}/api/users/workers/jobs/recent?limit=6`,
    'Get recently completed jobs'
  ));

  // Test 4: Availability Alias (ERROR #3)
  results.push(await testRoute(
    'Availability Alias',
    `${API_GATEWAY_URL}/api/availability/${testUserId}`,
    'Test availability endpoint alias (should rewrite to /api/users/workers/...)'
  ));

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! User service deployment successful!\n');
    console.log('✅ All previously failing routes are now working');
    console.log('✅ Errors #1, #3, #4, and #5 are FIXED');
  } else {
    console.log('\n⚠️ Some tests failed. User service may need redeployment.\n');
    console.log('Next steps:');
    console.log('1. Check if user-service has been redeployed with latest code');
    console.log('2. Verify routes exist in kelmah-backend/services/user-service/routes/');
    console.log('3. Check user-service logs on Render for errors');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run tests
runTests().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
