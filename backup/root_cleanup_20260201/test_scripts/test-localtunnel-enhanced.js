const https = require('https');
const http = require('http');

async function testEndpointWithHeaders(url, name) {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };

        const request = https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${name}: Status ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log(`   Response: ${data.substring(0, 100)}...`);
                } else if (res.statusCode === 511) {
                    console.log(`   🚨 Network Authentication Required - LocalTunnel may need browser headers`);
                } else if (res.statusCode === 503) {
                    console.log(`   ⚠️ Service Unavailable - Backend service may be down`);
                }
                resolve({ status: res.statusCode, data });
            });
        });

        request.on('error', (err) => {
            console.log(`❌ ${name}: ${err.message}`);
            resolve({ status: 'error', error: err.message });
        });

        request.setTimeout(15000, () => {
            console.log(`⏱️ ${name}: Timeout after 15s`);
            request.destroy();
            resolve({ status: 'timeout' });
        });
    });
}

async function testLocalServices() {
    console.log('🧪 Testing Local Services First...\n');

    // Test local API Gateway
    try {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/health',
            method: 'GET'
        };

        await new Promise((resolve) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`✅ Local API Gateway: Status ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        console.log(`   Response: ${data}`);
                    }
                    resolve();
                });
            });

            req.on('error', (err) => {
                console.log(`❌ Local API Gateway: ${err.message}`);
                resolve();
            });

            req.setTimeout(5000, () => {
                console.log(`⏱️ Local API Gateway: Timeout`);
                req.destroy();
                resolve();
            });

            req.end();
        });
    } catch (err) {
        console.log(`❌ Local test error: ${err.message}`);
    }

    console.log('\n🌐 Testing LocalTunnel Endpoints...\n');

    // Test API Gateway health via LocalTunnel with browser headers
    await testEndpointWithHeaders('https://kelmah-api.loca.lt/health', 'LocalTunnel API Gateway Health');

    // Test API Gateway aggregate health
    await testEndpointWithHeaders('https://kelmah-api.loca.lt/api/health/aggregate', 'LocalTunnel Aggregate Health');

    // Test a simple API endpoint
    await testEndpointWithHeaders('https://kelmah-api.loca.lt/api/health', 'LocalTunnel API Health');

    console.log('\n🎯 LocalTunnel connectivity test completed!');
    console.log('\n💡 If seeing 511 errors, LocalTunnel may require browser access or have rate limits');
    console.log('🔗 Try opening https://kelmah-api.loca.lt/health in a browser first');
}

testLocalServices();
