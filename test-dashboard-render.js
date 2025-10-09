/**
 * Test Render User Service Dashboard Endpoint
 * Tests the exact endpoint that was failing with 500 errors
 */

const https = require('https');

const USER_SERVICE_URL = 'https://kelmah-user-service-47ot.onrender.com';

// Test user credentials from create-gifty-user.js
const TEST_EMAIL = 'giftyafisa@gmail.com';
const TEST_PASSWORD = '1221122Ga';

console.log('🧪 Testing Render User Service Dashboard Endpoint');
console.log('📍 Service URL:', USER_SERVICE_URL);
console.log('👤 Test user:', TEST_EMAIL);
console.log('');

// Step 1: Login to get token
function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const options = {
      hostname: 'project-kelmah-6i4g.onrender.com',
      path: '/auth/login',  // Auth service direct endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    console.log('🔐 Step 1: Logging in to auth service...');
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Login successful!');
            console.log('📊 User role:', response.user?.role);
            resolve(response.token);
          } catch (e) {
            reject(new Error(`JSON parse failed: ${e.message}`));
          }
        } else {
          console.log(`❌ Login failed: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Login failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

// Step 2: Test dashboard endpoint
function testDashboard(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'kelmah-user-service-47ot.onrender.com',
      path: '/api/users/dashboard/metrics',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('\n📊 Step 2: Testing dashboard metrics endpoint...');
    console.log('🔗 URL:', `${USER_SERVICE_URL}/api/users/dashboard/metrics`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📈 Response Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ SUCCESS! Dashboard endpoint working!');
            console.log('\n📊 Dashboard Metrics:');
            console.log(JSON.stringify(response, null, 2));
            console.log('\n🎉 FIX VERIFIED! User model registration is working!');
            resolve(response);
          } catch (e) {
            console.log('⚠️  Got 200 but JSON parse failed');
            console.log('Response:', data.substring(0, 500));
            reject(new Error(`JSON parse failed: ${e.message}`));
          }
        } else {
          console.log(`❌ FAILED: ${res.statusCode}`);
          console.log('Response:', data);
          console.log('\n⚠️  If you see "buffering timed out" or "User model not found",');
          console.log('   the fix hasn\'t been deployed yet. Wait 1-2 more minutes.');
          reject(new Error(`Dashboard request failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

// Run the test
(async () => {
  try {
    const token = await login();
    await testDashboard(token);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
})();
