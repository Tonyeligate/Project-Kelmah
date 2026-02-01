/**
 * Simple job creation test
 */

const https = require('https');

// Step 1: Login
const loginData = JSON.stringify({
    email: 'giftyafisa@gmail.com',
    password: '11221122Tg'
});

const loginReq = https.request('https://kelmah-api-gateway-kubd.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error('❌ Login failed:', res.statusCode, data);
            return;
        }

        const { token } = JSON.parse(data).data;
        console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

        // Step 2: Create job
        const jobData = JSON.stringify({
            title: "Test Carpentry Job",
            description: "We need an experienced carpenter for home renovation work",
            category: "Carpentry",
            location: {
                type: "onsite",
                coordinates: { lat: 5.6037, lng: -0.1870 },
                address: "Accra, Ghana"
            },
            skills: ["Carpentry"],
            duration: { value: 2, unit: "day" },
            budget: 500,
            paymentType: "fixed"
        });

        const jobReq = https.request('https://kelmah-api-gateway-kubd.onrender.com/api/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': jobData.length
            }
        }, (jobRes) => {
            let jobResponseData = '';
            jobRes.on('data', chunk => jobResponseData += chunk);
            jobRes.on('end', () => {
                console.log('\n📝 Job creation response:');
                console.log('Status:', jobRes.statusCode);
                console.log('Body:', jobResponseData);

                if (jobRes.statusCode === 201) {
                    console.log('\n✅ Job created successfully!');
                } else {
                    console.log('\n❌ Job creation failed');
                }
            });
        });

        jobReq.on('error', (err) => {
            console.error('❌ Job request error:', err.message);
        });

        jobReq.write(jobData);
        jobReq.end();
    });
});

loginReq.on('error', (err) => {
    console.error('❌ Login request error:', err.message);
});

loginReq.write(loginData);
loginReq.end();
