const https = require('https');

const data = JSON.stringify({
    email: 'kwame.asante1@kelmah.test',
    password: 'TestUser123!'
});

const options = {
    hostname: 'kelmah-api-gateway-6yoy.onrender.com',
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('=== Testing Talent Login ===');
console.log('Email:', 'kwame.asante1@kelmah.test');
console.log('Password:', 'TestUser123!');
console.log('Endpoint:', 'POST /api/auth/login');
console.log('');

const req = https.request(options, (res) => {
    let body = '';

    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('\n=== Response Body ===');
        try {
            const parsed = JSON.parse(body);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(body);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e.message);
});

req.write(data);
req.end();
