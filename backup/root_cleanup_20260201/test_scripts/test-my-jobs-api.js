const https = require('https');

// Get a valid token first
const loginData = JSON.stringify({
    email: 'giftyafisa@gmail.com',
    password: '11221122Tg'
});

const loginOptions = {
    hostname: 'kelmah-api-gateway-6yoy.onrender.com',
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

console.log('=== Testing My Jobs API ===\n');
console.log('Step 1: Logging in as Gifty...');

const loginReq = https.request(loginOptions, (loginRes) => {
    let loginBody = '';

    loginRes.on('data', (chunk) => {
        loginBody += chunk;
    });

    loginRes.on('end', () => {
        try {
            const loginResult = JSON.parse(loginBody);
            if (loginResult.success && loginResult.data?.token) {
                const token = loginResult.data.token;
                console.log('✅ Login successful\n');

                // Now test the my-jobs endpoint
                console.log('Step 2: Fetching /api/jobs/my-jobs...');

                const jobsOptions = {
                    hostname: 'kelmah-api-gateway-6yoy.onrender.com',
                    path: '/api/jobs/my-jobs?status=active&role=hirer',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };

                const jobsReq = https.request(jobsOptions, (jobsRes) => {
                    let jobsBody = '';

                    console.log('Status Code:', jobsRes.statusCode);

                    jobsRes.on('data', (chunk) => {
                        jobsBody += chunk;
                    });

                    jobsRes.on('end', () => {
                        console.log('\n=== Response ===');
                        try {
                            const jobsResult = JSON.parse(jobsBody);
                            console.log(JSON.stringify(jobsResult, null, 2));

                            // Analyze the response structure
                            console.log('\n=== Analysis ===');
                            console.log('success:', jobsResult.success);
                            console.log('data type:', typeof jobsResult.data);
                            if (jobsResult.data) {
                                console.log('data.items:', jobsResult.data.items?.length || 'not found');
                                console.log('data.jobs:', jobsResult.data.jobs?.length || 'not found');
                                console.log('data (array?):', Array.isArray(jobsResult.data) ? jobsResult.data.length : 'not array');
                            }
                        } catch (e) {
                            console.log(jobsBody);
                        }
                    });
                });

                jobsReq.on('error', (e) => {
                    console.error('Jobs Request Error:', e.message);
                });

                jobsReq.end();
            } else {
                console.log('❌ Login failed:', loginResult.message || 'Unknown error');
            }
        } catch (e) {
            console.log('Parse error:', e.message);
            console.log(loginBody);
        }
    });
});

loginReq.on('error', (e) => {
    console.error('Login Request Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
