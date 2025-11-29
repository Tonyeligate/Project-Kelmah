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

console.log('=== Testing Status Filtering ===\n');

const loginReq = https.request(loginOptions, (loginRes) => {
    let loginBody = '';

    loginRes.on('data', (chunk) => {
        loginBody += chunk;
    });

    loginRes.on('end', async () => {
        try {
            const loginResult = JSON.parse(loginBody);
            if (loginResult.success && loginResult.data?.token) {
                const token = loginResult.data.token;
                console.log('✅ Login successful\n');

                // Test different status values
                const statuses = ['all', 'active', 'open', 'completed', 'in-progress'];

                for (const status of statuses) {
                    await testStatus(token, status);
                }
            } else {
                console.log('❌ Login failed:', loginResult.message);
            }
        } catch (e) {
            console.log('Parse error:', e.message);
        }
    });
});

function testStatus(token, status) {
    return new Promise((resolve) => {
        const path = status === 'all'
            ? '/api/jobs/my-jobs?role=hirer'
            : `/api/jobs/my-jobs?status=${status}&role=hirer`;

        const options = {
            hostname: 'kelmah-api-gateway-6yoy.onrender.com',
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    const count = result.data?.items?.length || result.data?.pagination?.total || 0;
                    console.log(`status=${status}: ${count} jobs (HTTP ${res.statusCode})`);
                } catch (e) {
                    console.log(`status=${status}: Parse error`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`status=${status}: Error - ${e.message}`);
            resolve();
        });

        req.end();
    });
}

loginReq.on('error', (e) => {
    console.error('Login Request Error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
