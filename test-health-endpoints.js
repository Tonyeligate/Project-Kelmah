#!/usr/bin/env node
/**
 * Health Endpoint Test Script
 * Tests all service health endpoints for API Gateway compatibility
 */

const axios = require('axios');
const chalk = require('chalk');

const SERVICES = {
  'Job Service': 'http://localhost:5003',
  'Auth Service': 'http://localhost:5001', 
  'User Service': 'http://localhost:5002',
  'Payment Service': 'http://localhost:5004',
  'Messaging Service': 'http://localhost:5005',
  'Review Service': 'http://localhost:5006',
  'API Gateway': 'http://localhost:5000'
};

const HEALTH_ENDPOINTS = [
  '/health',
  '/api/health',
  '/health/ready',
  '/api/health/ready', 
  '/health/live',
  '/api/health/live'
];

const SPECIAL_ENDPOINTS = {
  'Payment Service': ['/health/providers', '/api/health/providers'],
  'API Gateway': ['/api/health/aggregate']
};

async function testEndpoint(service, baseUrl, endpoint) {
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      timeout: 5000,
      validateStatus: () => true // Accept all status codes
    });
    
    const status = response.status;
    const statusColor = status === 200 ? chalk.green : 
                       status === 503 ? chalk.yellow : 
                       chalk.red;
    
    console.log(`  ${statusColor(status)} ${endpoint}`);
    
    return {
      endpoint,
      status,
      success: status === 200 || status === 503,
      data: response.data
    };
  } catch (error) {
    console.log(`  ${chalk.red('ERR')} ${endpoint} - ${error.message}`);
    return {
      endpoint,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

async function testService(serviceName, baseUrl) {
  console.log(chalk.cyan(`\n🔍 Testing ${serviceName} (${baseUrl})`));
  
  const results = [];
  
  // Test standard health endpoints
  for (const endpoint of HEALTH_ENDPOINTS) {
    const result = await testEndpoint(serviceName, baseUrl, endpoint);
    results.push(result);
  }
  
  // Test special endpoints
  if (SPECIAL_ENDPOINTS[serviceName]) {
    for (const endpoint of SPECIAL_ENDPOINTS[serviceName]) {
      const result = await testEndpoint(serviceName, baseUrl, endpoint);
      results.push(result);
    }
  }
  
  return results;
}

async function main() {
  console.log(chalk.yellow('🏥 Service Health Endpoint Compatibility Test'));
  console.log(chalk.yellow('='.repeat(50)));
  
  const allResults = {};
  let totalEndpoints = 0;
  let successfulEndpoints = 0;
  
  for (const [serviceName, baseUrl] of Object.entries(SERVICES)) {
    const results = await testService(serviceName, baseUrl);
    allResults[serviceName] = results;
    
    totalEndpoints += results.length;
    successfulEndpoints += results.filter(r => r.success).length;
  }
  
  // Summary
  console.log(chalk.yellow(`\n📊 SUMMARY`));
  console.log(chalk.yellow('='.repeat(50)));
  
  for (const [serviceName, results] of Object.entries(allResults)) {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const percentage = Math.round((successful / total) * 100);
    
    const color = percentage === 100 ? chalk.green : 
                  percentage >= 50 ? chalk.yellow : 
                  chalk.red;
    
    console.log(`${color(`${serviceName}: ${successful}/${total} (${percentage}%)`)})`);
  }
  
  const overallPercentage = Math.round((successfulEndpoints / totalEndpoints) * 100);
  const overallColor = overallPercentage === 100 ? chalk.green : 
                      overallPercentage >= 50 ? chalk.yellow : 
                      chalk.red;
  
  console.log(chalk.yellow('\n' + '='.repeat(50)));
  console.log(overallColor(`Overall: ${successfulEndpoints}/${totalEndpoints} (${overallPercentage}%)`));
  
  if (overallPercentage === 100) {
    console.log(chalk.green('✅ All health endpoints are working correctly!'));
  } else {
    console.log(chalk.red('❌ Some health endpoints need attention.'));
    
    // Show failed endpoints
    console.log(chalk.red('\n🚨 Failed Endpoints:'));
    for (const [serviceName, results] of Object.entries(allResults)) {
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.log(chalk.red(`  ${serviceName}:`));
        failed.forEach(result => {
          console.log(chalk.red(`    - ${result.endpoint}: ${result.status} ${result.error || ''}`));
        });
      }
    }
  }
  
  console.log(chalk.yellow('\n' + '='.repeat(50)));
  
  process.exit(overallPercentage === 100 ? 0 : 1);
}

main().catch(error => {
  console.error(chalk.red('Test script failed:'), error);
  process.exit(1);
});
