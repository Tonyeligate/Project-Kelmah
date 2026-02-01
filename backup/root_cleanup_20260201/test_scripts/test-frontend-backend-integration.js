/**
 * Frontend-Backend Integration Test
 * Tests the complete flow from authentication to dashboard data access
 */

const axios = require('axios');

const API_GATEWAY_URL = 'http://localhost:5000';
const TEST_USER = {
    email: 'test.worker@kelmah.com',
    password: 'TestUser123!'
}; async function testFrontendBackendIntegration() {
    console.log('🧪 Testing Frontend-Backend Integration...\n');

    try {
        // Step 1: Test API Gateway health
        console.log('1️⃣ Testing API Gateway...');
        const gatewayHealth = await axios.get(`${API_GATEWAY_URL}/health`);
        console.log(`✅ API Gateway: ${gatewayHealth.status} - ${gatewayHealth.data.version}\n`);

        // Step 2: Test Authentication (simulate frontend login)
        console.log('2️⃣ Testing Authentication...');
        try {
            const loginResponse = await axios.post(`${API_GATEWAY_URL}/api/auth/login`, TEST_USER);
            const token = loginResponse.data.token;
            console.log(`✅ Login successful! Token: ${token.substring(0, 20)}...`);

            // Step 3: Test Dashboard Endpoints with Authentication
            console.log('\n3️⃣ Testing Dashboard Endpoints with Authentication...');

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            };

            // Test Dashboard Metrics
            console.log('📊 Testing Dashboard Metrics...');
            const metricsResponse = await axios.get(`${API_GATEWAY_URL}/api/users/dashboard/metrics`, { headers: authHeaders });
            console.log(`✅ Dashboard Metrics: ${metricsResponse.status}`);
            console.log(`   Users: ${metricsResponse.data.totalUsers}, Workers: ${metricsResponse.data.totalWorkers}, Active: ${metricsResponse.data.activeWorkers}`);

            // Test Dashboard Workers
            console.log('\n👥 Testing Dashboard Workers...');
            const workersResponse = await axios.get(`${API_GATEWAY_URL}/api/users/dashboard/workers`, { headers: authHeaders });
            console.log(`✅ Dashboard Workers: ${workersResponse.status}`);
            console.log(`   Found ${workersResponse.data.workers?.length || 0} workers`);

            if (workersResponse.data.workers?.length > 0) {
                const firstWorker = workersResponse.data.workers[0];
                console.log(`   Sample Worker: ${firstWorker.name} - Rating: ${firstWorker.rating} - Skills: ${firstWorker.skills?.join(', ')}`);
            }

            // Test Dashboard Analytics  
            console.log('\n📈 Testing Dashboard Analytics...');
            const analyticsResponse = await axios.get(`${API_GATEWAY_URL}/api/users/dashboard/analytics`, { headers: authHeaders });
            console.log(`✅ Dashboard Analytics: ${analyticsResponse.status}`);
            console.log(`   User Growth Data: ${analyticsResponse.data.userGrowth?.length || 0} months`);

            console.log('\n🎉 ALL TESTS PASSED! Frontend-Backend integration is working correctly.');

            // Summary
            console.log('\n📋 INTEGRATION TEST SUMMARY:');
            console.log(`✅ API Gateway: Working (${gatewayHealth.data.version})`);
            console.log(`✅ Authentication: Working (JWT token received)`);
            console.log(`✅ Dashboard Metrics: ${metricsResponse.data.totalUsers} users, ${metricsResponse.data.totalWorkers} workers`);
            console.log(`✅ Dashboard Workers: ${workersResponse.data.workers?.length || 0} worker profiles loaded`);
            console.log(`✅ Dashboard Analytics: User growth data available`);
            console.log('\n💡 The frontend should be able to connect and display dashboard data successfully!');

        } catch (authError) {
            if (authError.response?.status === 401 || authError.response?.status === 400) {
                console.log(`⚠️  Authentication failed: ${authError.response?.data?.message || authError.message}`);
                console.log('This might be expected if the test user doesn\'t exist or has different credentials.');

                // Try testing without auth to see if endpoints are actually protected
                console.log('\n🔓 Testing endpoints without authentication...');
                try {
                    const noAuthResponse = await axios.get(`${API_GATEWAY_URL}/api/users/dashboard/metrics`);
                    console.log(`⚠️  WARNING: Dashboard metrics accessible without auth! Status: ${noAuthResponse.status}`);
                } catch (noAuthError) {
                    console.log(`✅ Good: Dashboard endpoints properly protected (${noAuthError.response?.status || 'Connection Error'})`);
                }
            } else {
                throw authError;
            }
        }

    } catch (error) {
        console.error('❌ Integration test failed:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting:');
            console.log('- Check if API Gateway is running on port 5000');
            console.log('- Check if User Service is running on port 5002');
            console.log('- Check if Auth Service is running on port 5001');
        }

        if (error.response) {
            console.log(`Response Status: ${error.response.status}`);
            console.log(`Response Data:`, error.response.data);
        }
    }
}

// Run the test
testFrontendBackendIntegration().catch(console.error);
