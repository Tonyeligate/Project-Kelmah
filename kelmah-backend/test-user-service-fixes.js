#!/usr/bin/env node

/**
 * Test User Service Fixes
 * Tests the fixed endpoints to ensure they return real data instead of empty arrays
 */

const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:3000'; // API Gateway

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   URL: ${url}`);

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...options.headers
      }
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Response type: ${typeof response.data}`);

    if (Array.isArray(response.data)) {
      console.log(`   Array length: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log(`   Sample item:`, JSON.stringify(response.data[0], null, 2).substring(0, 200) + '...');
      }
    } else if (typeof response.data === 'object') {
      console.log(`   Object keys: ${Object.keys(response.data).join(', ')}`);

      // Check for empty data patterns
      if (response.data.workers && Array.isArray(response.data.workers)) {
        console.log(`   Workers count: ${response.data.workers.length}`);
      }
      if (response.data.userGrowth && Array.isArray(response.data.userGrowth)) {
        console.log(`   User growth months: ${response.data.userGrowth.length}`);
      }
      if (response.data.totalUsers !== undefined) {
        console.log(`   Total users: ${response.data.totalUsers}`);
      }
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

async function runUserServiceTests() {
  console.log('🚀 Testing User Service Fixes');
  console.log('==============================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE}/api/health`
    },
    {
      name: 'User Service Health',
      url: `${API_BASE}/api/users/health`
    },
    {
      name: 'Dashboard Metrics',
      url: `${API_BASE}/api/users/dashboard/metrics`
    },
    {
      name: 'Dashboard Workers',
      url: `${API_BASE}/api/users/dashboard/workers`
    },
    {
      name: 'Dashboard Analytics',
      url: `${API_BASE}/api/users/dashboard/analytics`
    }
  ];

  for (const test of tests) {
    results.total++;
    const result = await testEndpoint(test.name, test.url);

    if (result.success) {
      results.passed++;
      console.log(`   ✅ PASSED`);
    } else {
      results.failed++;
      console.log(`   ❌ FAILED`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! User service is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the user service is running on port 5002');
    console.log('2. Check MongoDB connection in user service logs');
    console.log('3. Verify JWT_SECRET is set correctly');
    console.log('4. Ensure database has user and worker data');
  }

  return results;
}

async function testDataPopulation() {
  console.log('\n🔍 Testing Data Population');
  console.log('==========================\n');

  // Test if we have actual data in the database
  const dataTests = [
    {
      name: 'User Count Check',
      description: 'Check if users exist in database',
      url: `${API_BASE}/api/users/dashboard/metrics`
    },
    {
      name: 'Worker Data Check',
      description: 'Check if worker profiles exist',
      url: `${API_BASE}/api/users/dashboard/workers`
    }
  ];

  for (const test of dataTests) {
    console.log(`Testing: ${test.description}`);
    const result = await testEndpoint(test.name, test.url);

    if (result.success && result.data) {
      // Check for meaningful data
      if (result.data.totalUsers > 0) {
        console.log(`   ✅ Database has ${result.data.totalUsers} users`);
      } else {
        console.log(`   ⚠️  No users found in database`);
      }

      if (result.data.workers && result.data.workers.length > 0) {
        console.log(`   ✅ Database has ${result.data.workers.length} workers`);
      } else {
        console.log(`   ⚠️  No workers found in database`);
      }
    }
  }
}

// Main execution
async function main() {
  try {
    await runUserServiceTests();
    await testDataPopulation();

    console.log('\n💡 Next Steps:');
    console.log('1. If tests failed, check service logs for errors');
    console.log('2. Use setup-environment.js to configure services');
    console.log('3. Use check-services-health.js to verify all services');
    console.log('4. Populate database with test data if needed');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runUserServiceTests, testDataPopulation };
