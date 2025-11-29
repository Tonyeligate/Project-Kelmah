const axios = require('axios');

(async () => {
    try {
        console.log('Checking service health and deployment status...\n');

        // Check API Gateway health
        const gatewayHealth = await axios.get('https://kelmah-api-gateway-50z3.onrender.com/health');
        console.log('✓ API Gateway:', gatewayHealth.data);

        // Check Job Service health  
        const jobHealth = await axios.get('https://kelmah-api-gateway-50z3.onrender.com/api/health/aggregate');
        console.log('\n✓ Aggregate Health:', JSON.stringify(jobHealth.data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
