const axios = require('axios');

(async () => {
  try {
    console.log('Getting job service logs to find the actual error...\n');
    
    // First, try to get the service info
    const info = await axios.get('https://kelmah-api-gateway-50z3.onrender.com/api/health/aggregate', {
      timeout: 5000
    }).catch(() => null);
    
    if (info) {
      console.log('Service Status:', JSON.stringify(info.data, null, 2));
    }
    
    // Attempt a job creation to trigger the error
    const login = await axios.post('https://kelmah-api-gateway-50z3.onrender.com/api/auth/login', {
      email: 'giftyafisa@gmail.com',
      password: '11221122Tg'
    });
    
    const token = login.data.data.token;
    console.log('\n✓ Got auth token');
    console.log('Now attempting job creation to trigger error...\n');
    
    try {
      const startTime = Date.now();
      const response = await axios.post('https://kelmah-api-gateway-50z3.onrender.com/api/jobs', {
        title: 'Audit Test Job',
        description: 'Testing to capture error details',
        category: 'plumbing',
        budget: 250,
        paymentType: 'fixed',
        duration: { value: 1, unit: 'day' },
        location: { type: 'onsite', country: 'Ghana', city: 'Accra' },
        skills: ['plumbing']
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      
      const elapsedTime = Date.now() - startTime;
      console.log(`✓ SUCCESS in ${elapsedTime}ms`);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (jobError) {
      const elapsedTime = jobError.config?.timeout || '?';
      console.log('❌ ERROR Details:');
      console.log(`Time elapsed: ${elapsedTime}ms`);
      console.log(`Status: ${jobError.response?.status}`);
      console.log(`Message: ${jobError.response?.data?.message}`);
      console.log(`Full Error:`, JSON.stringify(jobError.response?.data, null, 2));
    }
    
  } catch(error) {
    console.error('Fatal error:', error.message);
  }
})();
