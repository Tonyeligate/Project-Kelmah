const https = require('https');

async function testEndpoint(url, name) {
    return new Promise((resolve) => {
        const request = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${name}: Status ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log(`   Response: ${data.substring(0, 100)}...`);
                }
                resolve({ status: res.statusCode, data });
            });
        });

        request.on('error', (err) => {
            console.log(`❌ ${name}: ${err.message}`);
            resolve({ status: 'error', error: err.message });
        });

        request.setTimeout(10000, () => {
            console.log(`⏱️ ${name}: Timeout after 10s`);
            request.destroy();
            resolve({ status: 'timeout' });
        });
    });
}

async function testLocalTunnel() {
    console.log('🧪 Testing LocalTunnel endpoints...\n');

    // Test API Gateway health
    await testEndpoint('https://kelmah-api.loca.lt/health', 'API Gateway Health');

    // Test API Gateway aggregate health
    await testEndpoint('https://kelmah-api.loca.lt/api/health/aggregate', 'Aggregate Health');

    // Test WebSocket tunnel
    await testEndpoint('https://kelmah-ws.loca.lt/health', 'WebSocket Health');

    console.log('\n🎯 LocalTunnel connectivity test completed!');
}

testLocalTunnel();
