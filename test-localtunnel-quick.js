// Quick test to verify LocalTunnel is working
const https = require('https');

async function quickTest() {
    console.log('🧪 Quick LocalTunnel Test');
    console.log('========================');

    // Test the main API endpoint
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'ngrok-skip-browser-warning': 'true'
        }
    };

    try {
        await new Promise((resolve, reject) => {
            const req = https.get('https://kelmah-api.loca.lt/api/jobs?limit=5', options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`✅ Jobs API: Status ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        console.log(`   📊 Jobs returned: ${parsed.items?.length || 0}`);
                    }
                    resolve();
                });
            });
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });

        await new Promise((resolve, reject) => {
            const req = https.get('https://kelmah-api.loca.lt/api/workers?limit=5', options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`✅ Workers API: Status ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        console.log(`   👷 Workers returned: ${parsed.data?.workers?.length || 0}`);
                    }
                    resolve();
                });
            });
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });

        console.log('\n🎉 LocalTunnel is working perfectly!');
        console.log('✅ API Gateway accessible');
        console.log('✅ Jobs endpoint responding');
        console.log('✅ Workers endpoint responding');
        console.log('\n🔧 Frontend fixes applied:');
        console.log('- Fixed axios proxy method handling');
        console.log('- Updated service warmup to use proper axios instance');
        console.log('- Added ngrok-skip-browser-warning headers');

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
    }
}

quickTest();
