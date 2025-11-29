const axios = require('axios');

(async () => {
    try {
        console.log('Testing w:0 unacknowledged writes...');

        // Get token
        const login = await axios.post('https://kelmah-api-gateway-50z3.onrender.com/api/auth/login', {
            email: 'giftyafisa@gmail.com',
            password: '11221122Tg'
        });

        const token = login.data.data.token;
        console.log('✓ Token obtained');

        // Create job with w:0 setting
        const startTime = Date.now();
        const createJob = await axios.post('https://kelmah-api-gateway-50z3.onrender.com/api/jobs', {
            title: 'w:0 Test Job',
            description: 'Testing w:0 unacknowledged writes',
            category: 'plumbing',
            budget: 250,
            location: 'Accra',
            requiredSkills: ['plumbing', 'fixtures']
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const elapsedTime = Date.now() - startTime;
        console.log(`✓ Job created successfully in ${elapsedTime}ms`);
        console.log('Response:', JSON.stringify(createJob.data, null, 2));

    } catch (error) {
        console.error('✗ Error:', error.response?.data || error.message);
        process.exit(1);
    }
})();
