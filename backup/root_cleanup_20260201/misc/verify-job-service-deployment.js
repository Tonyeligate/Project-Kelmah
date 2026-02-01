/**
 * Verify Job Service Deployment and MongoDB Connection
 * Tests the deployed Job Service on Render
 */

const https = require('https');
const http = require('http');

const JOB_SERVICE_URL = 'https://kelmah-job-service-xo0q.onrender.com';
const GATEWAY_URL = 'https://kelmah-api-gateway-kubd.onrender.com';

console.log('🔍 Verifying Job Service Deployment\n');

// Test 1: Health check
const testHealth = () => {
    return new Promise((resolve, reject) => {
        console.log('Test 1: Health Check');
        https.get(`${JOB_SERVICE_URL}/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Health check passed');
                    console.log('   Response:', JSON.parse(data));
                    resolve(true);
                } else {
                    console.log(`❌ Health check failed: ${res.statusCode}`);
                    reject(new Error(`Health check failed: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
};

// Test 2: Database ready check
const testDatabaseReady = () => {
    return new Promise((resolve, reject) => {
        console.log('\nTest 2: Database Ready Check');
        https.get(`${JOB_SERVICE_URL}/health/ready`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                if (res.statusCode === 200 && parsed.ready) {
                    console.log('✅ Database is ready');
                    console.log('   Response:', parsed);
                    resolve(true);
                } else {
                    console.log(`❌ Database not ready: ${res.statusCode}`);
                    console.log('   Response:', parsed);
                    console.log('\n💡 This indicates MongoDB connection issue');
                    console.log('   Check MongoDB Atlas IP whitelist configuration');
                    reject(new Error('Database not ready'));
                }
            });
        }).on('error', reject);
    });
};

// Test 3: Public jobs endpoint (no auth required)
const testPublicJobs = () => {
    return new Promise((resolve, reject) => {
        console.log('\nTest 3: Public Jobs Endpoint');
        https.get(`${JOB_SERVICE_URL}/api/jobs?limit=1`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Public jobs endpoint working');
                    const parsed = JSON.parse(data);
                    console.log(`   Found ${parsed.total || 0} jobs`);
                    resolve(true);
                } else {
                    console.log(`❌ Public jobs endpoint failed: ${res.statusCode}`);
                    console.log('   Response:', data);
                    reject(new Error(`Public jobs failed: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
};

// Test 4: Gateway to Job Service connection
const testGatewayConnection = () => {
    return new Promise((resolve, reject) => {
        console.log('\nTest 4: API Gateway to Job Service');
        https.get(`${GATEWAY_URL}/api/jobs?limit=1`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Gateway to Job Service connection working');
                    resolve(true);
                } else {
                    console.log(`❌ Gateway connection failed: ${res.statusCode}`);
                    console.log('   Response:', data);
                    reject(new Error(`Gateway connection failed: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
};

// Run all tests
(async () => {
    try {
        await testHealth();
        await testDatabaseReady();
        await testPublicJobs();
        await testGatewayConnection();

        console.log('\n✅ ALL TESTS PASSED');
        console.log('🎉 Job Service is fully operational');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ TESTS FAILED');
        console.error(`📛 Error: ${error.message}`);
        console.error('\n🔧 Next Steps:');
        console.error('   1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0)');
        console.error('   2. Verify MONGODB_URI environment variable in Render');
        console.error('   3. Check Render service logs for detailed errors');
        process.exit(1);
    }
})();
