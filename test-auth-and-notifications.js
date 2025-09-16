#!/usr/bin/env node

/**
 * Comprehensive Test for Authentication and Notifications
 * Tests the complete flow: Login -> Get Token -> Access Protected Endpoints
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const LOCALTUNNEL_URL = 'https://red-bobcat-90.loca.lt';

// Test user credentials
const TEST_USERS = [
    {
        email: 'giftyafisa@gmail.com',
        password: '1221122Ga', // Corrected password
        name: 'Gifty Test User'
    },
    {
        email: 'test@example.com',
        password: 'TestUser123!',
        name: 'Generic Test User'
    }
];

/**
 * Test authentication and get valid token
 */
async function testAuth(baseUrl, user) {
    console.log(`\n🔐 Testing authentication for: ${user.email}`);
    console.log(`📍 Base URL: ${baseUrl}`);

    try {
        const loginData = {
            email: user.email,
            password: user.password,
            rememberMe: false
        };

        console.log('📤 Sending login request...');
        const response = await axios.post(`${baseUrl}/api/auth/login`, loginData, {
            headers: {
                'Content-Type': 'application/json',
                'localtunnel-skip-browser-warning': 'true'
            },
            timeout: 30000
        });

        if (response.status === 200 && response.data.token) {
            console.log('✅ Login successful!');
            console.log(`🎫 Token: ${response.data.token.substring(0, 20)}...`);
            console.log(`👤 User ID: ${response.data.user?.id || 'N/A'}`);
            console.log(`👤 User Role: ${response.data.user?.role || 'N/A'}`);

            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };
        } else {
            console.log('❌ Login failed: Invalid response format');
            return { success: false, error: 'Invalid response format' };
        }

    } catch (error) {
        console.log('❌ Login failed!');
        console.log(`📊 Status: ${error.response?.status || 'N/A'}`);
        console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
        console.log(`🔍 Response:`, error.response?.data);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
}

/**
 * Test protected endpoints with valid token
 */
async function testProtectedEndpoints(baseUrl, token, userId) {
    console.log('\n🛡️  Testing protected endpoints...');

    const endpoints = [
        {
            name: 'Notifications',
            url: `${baseUrl}/api/notifications`,
            method: 'GET'
        },
        {
            name: 'User Dashboard Analytics',
            url: `${baseUrl}/api/users/dashboard/analytics`,
            method: 'GET'
        },
        {
            name: 'User Dashboard Metrics',
            url: `${baseUrl}/api/users/dashboard/metrics`,
            method: 'GET'
        },
        {
            name: 'Worker Completeness',
            url: `${baseUrl}/api/workers/${userId}/completeness`,
            method: 'GET'
        }
    ];

    const results = [];

    for (const endpoint of endpoints) {
        console.log(`\n📡 Testing: ${endpoint.name}`);

        try {
            const response = await axios({
                method: endpoint.method,
                url: endpoint.url,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'localtunnel-skip-browser-warning': 'true'
                },
                timeout: 15000
            });

            console.log(`✅ ${endpoint.name}: ${response.status} - Success`);
            console.log(`📊 Data length: ${JSON.stringify(response.data).length} characters`);

            results.push({
                endpoint: endpoint.name,
                status: response.status,
                success: true,
                dataLength: JSON.stringify(response.data).length
            });

        } catch (error) {
            const status = error.response?.status || 'N/A';
            const message = error.response?.data?.message || error.message;

            console.log(`❌ ${endpoint.name}: ${status} - ${message}`);

            results.push({
                endpoint: endpoint.name,
                status: status,
                success: false,
                error: message
            });
        }
    }

    return results;
}

/**
 * Test service health endpoints
 */
async function testHealthEndpoints(baseUrl) {
    console.log('\n🏥 Testing health endpoints...');

    const healthEndpoints = [
        `${baseUrl}/api/health`,
        `${baseUrl}/health/aggregate`
    ];

    for (const endpoint of healthEndpoints) {
        try {
            const response = await axios.get(endpoint, {
                headers: {
                    'localtunnel-skip-browser-warning': 'true'
                },
                timeout: 10000
            });

            console.log(`✅ Health check: ${endpoint} - ${response.status}`);

            if (endpoint.includes('aggregate')) {
                console.log('📊 Services status:');
                const services = response.data.services;
                if (services) {
                    Object.entries(services).forEach(([service, status]) => {
                        const icon = status.status === 'healthy' ? '✅' : '❌';
                        console.log(`   ${icon} ${service}: ${status.status}`);
                    });
                }
            }

        } catch (error) {
            console.log(`❌ Health check failed: ${endpoint} - ${error.response?.status || error.message}`);
        }
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🎯 Kelmah Authentication & Notification Test Suite');
    console.log('==================================================');

    // Test both localhost and LocalTunnel
    const testUrls = [
        { name: 'Localhost', url: API_BASE_URL },
        { name: 'LocalTunnel', url: LOCALTUNNEL_URL }
    ];

    for (const testUrl of testUrls) {
        console.log(`\n\n🌐 Testing ${testUrl.name}: ${testUrl.url}`);
        console.log('='.repeat(50));

        // Test health first
        await testHealthEndpoints(testUrl.url);

        // Test authentication with each user
        for (const user of TEST_USERS) {
            const authResult = await testAuth(testUrl.url, user);

            if (authResult.success) {
                // Test protected endpoints
                const endpointResults = await testProtectedEndpoints(
                    testUrl.url,
                    authResult.token,
                    authResult.user?.id || 'unknown-user-id'
                );

                console.log('\n📋 Protected Endpoints Summary:');
                endpointResults.forEach(result => {
                    const icon = result.success ? '✅' : '❌';
                    console.log(`   ${icon} ${result.endpoint}: ${result.status}`);
                });

                break; // Stop after first successful auth
            }
        }
    }

    console.log('\n\n🎉 Test suite completed!');
    console.log('\n💡 Key Issues to Fix:');
    console.log('   1. If login fails: Check auth service and user credentials');
    console.log('   2. If notifications 404: Check API Gateway routing');
    console.log('   3. If notifications 401: Check JWT token validation');
    console.log('   4. If services down: Restart microservices');
}

// Run the tests
if (require.main === module) {
    runTests().catch(error => {
        console.error('💥 Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = { testAuth, testProtectedEndpoints, testHealthEndpoints };
