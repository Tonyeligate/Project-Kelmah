#!/usr/bin/env node

/**
 * Database Write Operation Test
 * Tests if basic database writes work through the API
 */

const axios = require('axios');

const API_BASE = 'https://kelmah-api-gateway-6yoy.onrender.com/api';

const logger = {
    info: (msg, data) => console.log(`✅ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    error: (msg, data) => console.error(`❌ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    warn: (msg, data) => console.warn(`⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    divider: () => console.log('\n' + '='.repeat(80) + '\n')
};

async function testDatabaseWrites() {
    try {
        logger.divider();
        logger.info('Testing Database Write Operations');
        logger.divider();

        // Get auth token first
        logger.info('Step 1: Authenticating...');
        let token;
        try {
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'giftyafisa@gmail.com',
                password: '11221122Tg'
            });
            token = loginResponse.data.data.token;
            logger.info('✅ Authentication successful');
        } catch (err) {
            logger.error('Login failed', err.message);
            return;
        }
        logger.divider();

        // Test 1: Simple GET (read)
        logger.info('Test 1: Simple READ operation (GET /jobs)...');
        const readStart = Date.now();
        try {
            const readResponse = await axios.get(`${API_BASE}/jobs?limit=5`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000
            });
            const readTime = Date.now() - readStart;
            logger.info(`✅ READ completed in ${readTime}ms`, {
                jobsRetrieved: readResponse.data.data?.length || 0
            });
        } catch (err) {
            logger.error(`READ failed: ${Date.now() - readStart}ms`, {
                status: err.response?.status,
                message: err.message
            });
        }
        logger.divider();

        // Test 2: Try a WRITE operation through a different endpoint
        // Let's try creating a saved job instead (simpler than creating a full job)
        logger.info('Test 2: Simple WRITE operation (save job)...');
        const saveStart = Date.now();
        try {
            const saveResponse = await axios.post(`${API_BASE}/jobs/999/save`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000
            });
            const saveTime = Date.now() - saveStart;
            logger.info(`✅ SAVE completed in ${saveTime}ms`);
        } catch (err) {
            const saveTime = Date.now() - saveStart;
            if (err.response?.status === 404) {
                logger.warn(`Job doesn't exist (expected), but endpoint responded in ${saveTime}ms`);
            } else {
                logger.error(`SAVE failed after ${saveTime}ms`, {
                    status: err.response?.status,
                    message: err.message
                });
            }
        }
        logger.divider();

        // Test 3: Try job creation again with increased timeout
        logger.info('Test 3: CREATE JOB with 60s timeout...');
        const createStart = Date.now();
        try {
            const createResponse = await axios.post(`${API_BASE}/jobs`, {
                title: 'Diagnostic Test Job - ' + new Date().toISOString(),
                description: 'Testing database write timeout',
                category: 'Plumbing',
                budget: 100,
                currency: 'GHS',
                paymentType: 'fixed',
                skills: ['Plumbing'],
                duration: { value: 1, unit: 'day' },
                location: {
                    type: 'onsite',
                    city: 'Accra',
                    country: 'Ghana'
                }
            }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 60000 // 60 second timeout
            });
            const createTime = Date.now() - createStart;
            logger.info(`✅ CREATE completed in ${createTime}ms`, {
                jobId: createResponse.data.data._id
            });
        } catch (err) {
            const createTime = Date.now() - createStart;
            logger.error(`CREATE failed after ${createTime}ms`, {
                status: err.response?.status,
                message: err.response?.data?.error?.message || err.message,
                timeout: err.code
            });
        }
        logger.divider();

        logger.info('✅ All tests completed');

    } catch (err) {
        logger.error('Fatal error', err);
    }
}

testDatabaseWrites().catch(err => {
    logger.error('Fatal error', err);
    process.exit(1);
});
