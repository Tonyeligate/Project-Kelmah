const axios = require('axios');

async function testConnections() {
    console.log('🧪 Testing Backend Connectivity\n');

    // Test 1: Local API Gateway
    try {
        const localResponse = await axios.get('http://localhost:5000/health');
        console.log('✅ Local API Gateway (localhost:5000): WORKING');
        console.log('   Services:', localResponse.data.services);
    } catch (error) {
        console.log('❌ Local API Gateway: FAILED -', error.message);
    }

    // Test 2: LocalTunnel tunnel
    try {
        const tunnelResponse = await axios.get('https://kelmah-api.loca.lt/health', {
            timeout: 10000
        });
        console.log('✅ LocalTunnel Tunnel: WORKING');
        console.log('   Response:', tunnelResponse.data);
    } catch (error) {
        console.log('❌ LocalTunnel Tunnel: FAILED -', error.message);
        if (error.code) console.log('   Error Code:', error.code);
    }

    // Test 3: Job service endpoint via LocalTunnel
    try {
        const jobResponse = await axios.get('https://kelmah-api.loca.lt/api/jobs?limit=1', {
            timeout: 10000
        });
        console.log('✅ Job API through LocalTunnel: WORKING');
    } catch (error) {
        console.log('❌ Job API through LocalTunnel: FAILED -', error.message);
    }

    // Test 4: Local job service direct
    try {
        const localJobResponse = await axios.get('http://localhost:5000/api/jobs?limit=1', {
            timeout: 5000
        });
        console.log('✅ Job API locally: WORKING');
    } catch (error) {
        console.log('❌ Job API locally: FAILED -', error.message);
    }
}

testConnections();
