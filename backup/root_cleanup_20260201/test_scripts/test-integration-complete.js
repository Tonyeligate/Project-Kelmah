#!/usr/bin/env node

/**
 * Frontend-Backend Integration Fix
 * Addresses WebSocket, notifications, and configuration issues
 */

const axios = require('axios');

async function testIntegration() {
    console.log('🔧 Testing Frontend-Backend Integration...\n');

    // Test configuration
    const baseUrl = 'https://wonderful-mouse-71.loca.lt';
    const headers = {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Integration-Test-Script'
    };

    try {
        // 1. Test API Gateway Health
        console.log('1️⃣ Testing API Gateway Health...');
        const gatewayHealth = await axios.get(`${baseUrl}/api/health`, { headers });
        console.log('✅ API Gateway:', gatewayHealth.data?.status || 'healthy');

        // 2. Test Messaging Service Health via Gateway
        console.log('\n2️⃣ Testing Messaging Service Health...');
        const messagingHealth = await axios.get(`${baseUrl}/api/messaging/health`, { headers });
        console.log('✅ Messaging Service:', messagingHealth.data?.status || 'healthy');

        // 3. Test Notifications Endpoint (without auth - should get 401)
        console.log('\n3️⃣ Testing Notifications Endpoint...');
        try {
            await axios.get(`${baseUrl}/api/notifications`, { headers });
            console.log('❌ Notifications endpoint should require authentication');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Notifications endpoint properly requires authentication (401)');
            } else {
                console.log('❌ Notifications endpoint error:', error.response?.status, error.message);
            }
        }

        // 4. Test Authentication
        console.log('\n4️⃣ Testing Authentication...');
        const loginData = {
            email: 'tony2gist@gmail.com',
            password: '1122112Ga'
        };

        try {
            const authResponse = await axios.post(`${baseUrl}/api/auth/login`, loginData, { headers });
            console.log('✅ Authentication successful');

            const token = authResponse.data.token;
            const authHeaders = { ...headers, 'Authorization': `Bearer ${token}` };

            // 5. Test Authenticated Notifications Request
            console.log('\n5️⃣ Testing Authenticated Notifications...');
            try {
                const notificationsResponse = await axios.get(`${baseUrl}/api/notifications`, { headers: authHeaders });
                console.log('✅ Notifications endpoint accessible with auth:', notificationsResponse.data);
            } catch (notifError) {
                console.log('❌ Notifications error with auth:', notifError.response?.status, notifError.response?.data);
            }

        } catch (authError) {
            console.log('❌ Authentication failed:', authError.response?.status, authError.response?.data);
        }

        // 6. Test WebSocket endpoint
        console.log('\n6️⃣ Testing WebSocket Endpoint...');
        try {
            const socketResponse = await axios.get(`${baseUrl}/socket.io/?transport=polling`, { headers });
            console.log('✅ WebSocket endpoint responding (Socket.IO polling)');
        } catch (socketError) {
            console.log('❌ WebSocket endpoint error:', socketError.response?.status, socketError.message);
        }

        console.log('\n🎉 Integration test completed!');

    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Frontend Configuration Check
async function checkFrontendConfig() {
    console.log('\n📋 Frontend Configuration Check...');

    try {
        // Check runtime config
        const fs = require('fs');
        const path = require('path');

        const configPath = path.join(__dirname, 'kelmah-frontend', 'public', 'runtime-config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log('✅ Runtime Config:', {
                API_URL: config.API_URL,
                WS_URL: config.WS_URL,
                TUNNEL_TYPE: config.TUNNEL_TYPE
            });
        } else {
            console.log('❌ Runtime config not found');
        }

    } catch (error) {
        console.error('❌ Frontend config check failed:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Frontend-Backend Integration Tests\n');

    await testIntegration();
    await checkFrontendConfig();

    console.log('\n📝 Issues to Fix:');
    console.log('1. If WebSocket connection fails in browser, clear browser cache');
    console.log('2. If notifications 404, verify messaging service is running');
    console.log('3. If auth fails, verify user credentials in database');
    console.log('4. If Socket.IO fails, verify API Gateway proxy mounting');
}

if (require.main === module) {
    runTests();
}

module.exports = { testIntegration, checkFrontendConfig };
