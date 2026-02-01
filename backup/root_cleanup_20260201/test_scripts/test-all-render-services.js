#!/usr/bin/env node

/**
 * Test All Render Services
 */

const axios = require('axios');

const services = {
  'Auth Service': 'https://project-kelmah-6i4g.onrender.com',
  'User Service': 'https://kelmah-user-service-47ot.onrender.com',
  'Job Service': 'https://kelmah-job-service-wlyu.onrender.com',
  'Messaging Service': 'https://kelmah-messaging-service-rjot.onrender.com',
  'Payment Service': 'https://project-kelmah-fqoi.onrender.com',
  'Review Service': 'https://kelmah-review-service-zkwt.onrender.com'
};

async function testServices() {
  console.log('\n🔍 TESTING ALL RENDER SERVICES');
  console.log('='.repeat(70));
  
  for (const [name, url] of Object.entries(services)) {
    console.log(`\n📊 ${name}`);
    console.log(`URL: ${url}`);
    
    try {
      const response = await axios.get(`${url}/health`, { timeout: 10000 });
      console.log(`✅ HEALTHY - Status: ${response.status}`);
      if (response.data) {
        console.log(`Data:`, JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      if (error.response) {
        console.log(`⚠️  Response but unhealthy - Status: ${error.response.status}`);
        console.log(`Data:`, error.response.data);
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.log(`⏱️  TIMEOUT - Service may be sleeping or slow`);
      } else {
        console.log(`❌ ERROR: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
}

testServices();
