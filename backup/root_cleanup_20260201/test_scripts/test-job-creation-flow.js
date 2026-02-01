/**
 * Test Job Creation via API Gateway
 * Authenticates and creates a test job
 */

const https = require('https');

const GATEWAY_URL = 'https://kelmah-api-gateway-kubd.onrender.com';
const TEST_EMAIL = 'giftyafisa@gmail.com';
const TEST_PASSWORD = '11221122Tg';

console.log('🔐 Step 1: Authenticating...\n');

// Step 1: Login to get valid JWT token
const login = () => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(`${GATEWAY_URL}/api/auth/login`, options, (res) => {
            let response = '';
            res.on('data', chunk => response += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const parsed = JSON.parse(response);
                    console.log('✅ Authentication successful');
                    console.log(`   User: ${parsed.data?.user?.email}`);
                    console.log(`   Role: ${parsed.data?.user?.role}`);
                    console.log(`   Token: ${parsed.data?.token?.substring(0, 20)}...`);
                    resolve(parsed.data.token);
                } else {
                    console.log(`❌ Authentication failed: ${res.statusCode}`);
                    console.log('   Response:', response);
                    reject(new Error(`Login failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

// Step 2: Create a job with the token
const createJob = (token) => {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Step 2: Creating test job...\n');

        const jobData = JSON.stringify({
            title: 'Test Carpentry Job - ' + Date.now(),
            description: 'Need a skilled carpenter for furniture repair. This is a test job posting.',
            budget: 500,
            paymentType: 'fixed',
            currency: 'GHS',
            skills: ['Carpentry', 'Woodworking'],
            locationType: 'remote',
            region: 'Greater Accra',
            duration: {
                value: 2,
                unit: 'week'
            },
            requirements: {
                experienceLevel: 'intermediate',
                primarySkills: ['Carpentry'],
                secondarySkills: ['Woodworking']
            }
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': jobData.length,
                'Authorization': `Bearer ${token}`
            }
        };

        const startTime = Date.now();
        const req = https.request(`${GATEWAY_URL}/api/jobs`, options, (res) => {
            let response = '';
            res.on('data', chunk => response += chunk);
            res.on('end', () => {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);

                if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log(`✅ Job created successfully (${duration}s)`);
                    try {
                        const parsed = JSON.parse(response);
                        console.log(`   Job ID: ${parsed.data?._id || parsed.data?.id}`);
                        console.log(`   Title: ${parsed.data?.title}`);
                        console.log(`   Budget: ${parsed.data?.currency} ${parsed.data?.budget}`);
                        resolve(parsed.data);
                    } catch (e) {
                        console.log('   Response:', response.substring(0, 200));
                        resolve(response);
                    }
                } else if (res.statusCode === 504) {
                    console.log(`❌ Job creation timed out (${duration}s)`);
                    console.log('   This indicates the Job Service is taking too long to respond');
                    console.log('   Likely cause: MongoDB slow query or connection issue');
                    console.log('   Response:', response);
                    reject(new Error(`Timeout: ${res.statusCode}`));
                } else {
                    console.log(`❌ Job creation failed: ${res.statusCode} (${duration}s)`);
                    console.log('   Response:', response);
                    reject(new Error(`Job creation failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`❌ Request error after ${duration}s:`, error.message);
            reject(error);
        });

        req.setTimeout(25000, () => {
            console.log('❌ Request timeout after 25 seconds');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(jobData);
        req.end();
    });
};

// Run the test
(async () => {
    try {
        const token = await login();
        await createJob(token);
        console.log('\n✅ TEST PASSED');
        console.log('🎉 Job posting feature is working correctly');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(`📛 Error: ${error.message}`);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check if user account is verified');
        console.error('   2. Verify Job Service is running and database connected');
        console.error('   3. Check API Gateway logs for routing issues');
        console.error('   4. Test MongoDB connection speed from Render');
        process.exit(1);
    }
})();
