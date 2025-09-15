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

    // Test 2: Ngrok tunnel
    try {
        const ngrokResponse = await axios.get('https://c0e9d514fa18.ngrok-free.app/health', {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 10000
        });
        console.log('✅ Ngrok Tunnel: WORKING');
        console.log('   Response:', ngrokResponse.data);
    } catch (error) {
        console.log('❌ Ngrok Tunnel: FAILED -', error.message);
        if (error.code) console.log('   Error Code:', error.code);
    }

    // Test 3: Job service endpoint
    try {
        const jobResponse = await axios.get('https://c0e9d514fa18.ngrok-free.app/api/jobs?limit=1', {
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 10000
        });
        console.log('✅ Job API through ngrok: WORKING');
    } catch (error) {
        console.log('❌ Job API through ngrok: FAILED -', error.message);
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
