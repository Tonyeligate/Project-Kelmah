#!/usr/bin/env node

/**
 * Comprehensive Job Creation Test
 * Tests the complete flow: Login → Create Job → Verify
 */

const axios = require('axios');

// Use the Render API Gateway URL
const API_BASE = 'https://kelmah-api-gateway-50z3.onrender.com/api';

const logger = {
    info: (msg, data) => console.log(`✅ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    error: (msg, data) => console.error(`❌ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    warn: (msg, data) => console.warn(`⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    divider: () => console.log('\n' + '='.repeat(80) + '\n')
};

async function testJobCreation() {
    try {
        logger.divider();
        logger.info('Starting Comprehensive Job Creation Test');
        logger.info('API Base URL:', API_BASE);
        logger.divider();

        // Step 1: Login
        logger.info('Step 1: Authenticating user...');
        let loginResponse;
        try {
            loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'giftyafisa@gmail.com',
                password: '11221122Tg'
            });
        } catch (loginErr) {
            logger.error('Login failed', {
                status: loginErr.response?.status,
                message: loginErr.response?.data?.error?.message || loginErr.message,
                fullError: loginErr.response?.data
            });
            return;
        }

        const { token, user } = loginResponse.data.data;
        logger.info('✅ Login successful', {
            userId: user._id,
            email: user.email,
            role: user.role,
            tokenPreview: token.substring(0, 20) + '...'
        });
        logger.divider();

        // Step 2: Create Job
        logger.info('Step 2: Creating a new job posting...');
        const jobData = {
            title: 'Test Plumbing Job - ' + new Date().toISOString(),
            description: 'Need a plumber to fix pipes in my bathroom',
            category: 'Plumbing',
            budget: 500,
            currency: 'GHS',
            paymentType: 'fixed', // Must be 'fixed' or 'hourly'
            skills: ['Plumbing', 'Pipe Installation'], // Array of strings
            duration: {
                value: 1,
                unit: 'week' // Must be 'hour', 'day', 'week', or 'month'
            },
            location: {
                type: 'onsite', // Must be 'remote', 'onsite', or 'hybrid'
                city: 'Accra',
                country: 'Ghana'
            }
        }; logger.info('Sending job data:', jobData);

        let createJobResponse;
        const startTime = Date.now();
        try {
            createJobResponse = await axios.post(`${API_BASE}/jobs`, jobData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60 second timeout for the request
            });
            const duration = Date.now() - startTime;
            logger.info(`Job creation successful (${duration}ms)`, {
                jobId: createJobResponse.data.data._id,
                title: createJobResponse.data.data.title,
                status: createJobResponse.data.data.status
            });
        } catch (jobErr) {
            const duration = Date.now() - startTime;
            logger.error(`Job creation failed after ${duration}ms`, {
                status: jobErr.response?.status,
                statusText: jobErr.response?.statusText,
                message: jobErr.response?.data?.error?.message || jobErr.message,
                fullError: jobErr.response?.data,
                timeout: jobErr.code === 'ECONNABORTED' ? 'REQUEST TIMEOUT' : jobErr.code
            });

            // Check if it's a connection error
            if (jobErr.code === 'ECONNREFUSED') {
                logger.error('Connection refused - API Gateway may not be running');
            }
            if (jobErr.code === 'ENOTFOUND') {
                logger.error('DNS resolution failed - hostname may be invalid');
            }
            return;
        }
        logger.divider();

        // Step 3: Verify job was created
        logger.info('Step 3: Verifying job was created...');
        const jobId = createJobResponse.data.data._id;
        try {
            const getJobResponse = await axios.get(`${API_BASE}/jobs/${jobId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            logger.info('Job verification successful', {
                jobId: getJobResponse.data.data._id,
                title: getJobResponse.data.data.title,
                createdAt: getJobResponse.data.data.createdAt
            });
        } catch (verifyErr) {
            logger.error('Job verification failed', {
                status: verifyErr.response?.status,
                message: verifyErr.response?.data?.error?.message
            });
        }
        logger.divider();

        logger.info('✅ TEST COMPLETED SUCCESSFULLY');

    } catch (err) {
        logger.error('Unexpected error during test', {
            message: err.message,
            code: err.code,
            fullError: err.toString()
        });
    }
}

// Run the test
testJobCreation().catch(err => {
    logger.error('Fatal error', err);
    process.exit(1);
});
