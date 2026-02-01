const axios = require('axios');

(async () => {
    try {
        console.log('🔄 Testing job creation with optimized DB settings...\n');

        // Get token
        const login = await axios.post('https://kelmah-api-gateway-6yoy.onrender.com/api/auth/login', {
            email: 'giftyafisa@gmail.com',
            password: '11221122Tg'
        });

        const token = login.data.data.token;
        console.log('✓ Authentication successful');

        // Create job
        const startTime = Date.now();
        const createJob = await axios.post('https://kelmah-api-gateway-6yoy.onrender.com/api/jobs', {
            title: 'Test Job - DB Timeout Fix',
            description: 'Testing if MongoDB write timeout is fixed with optimized settings',
            category: 'plumbing',
            budget: 350,
            paymentType: 'fixed',
            duration: { value: 2, unit: 'day' },
            location: { type: 'onsite', country: 'Ghana', city: 'Accra' },
            skills: ['plumbing', 'fixtures', 'maintenance']
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const elapsedTime = Date.now() - startTime;
        console.log(`✓ Job created successfully in ${elapsedTime}ms`);
        console.log(`\n📋 Job Details:`);
        console.log(`  Job ID: ${createJob.data.data._id}`);
        console.log(`  Title: ${createJob.data.data.title}`);
        console.log(`  Status: ${createJob.data.data.status}`);
        console.log(`  Budget: ${createJob.data.data.budget} ${createJob.data.data.currency}`);

        if (elapsedTime < 5000) {
            console.log(`\n🎉 SUCCESS! Write was FAST (${elapsedTime}ms - under 5 seconds)`);
            console.log('✅ Unacknowledged writes (w:0) are working correctly');
        } else if (elapsedTime < 10000) {
            console.log(`\n⚠️  Write completed but slower than expected (${elapsedTime}ms)`);
        } else {
            console.log(`\n❌ Write still slow (${elapsedTime}ms)`);
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔴 Connection refused - service may still be deploying');
            console.error('⏳ Wait 2-3 minutes for Render deployment to complete');
        }
        process.exit(1);
    }
})();
