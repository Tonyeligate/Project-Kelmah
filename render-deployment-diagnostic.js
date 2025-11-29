#!/usr/bin/env node

/**
 * Render Deployment Diagnostic
 * Checks if the API Gateway is responding and what the job service is doing
 */

const axios = require('axios');

const logger = {
    info: (msg, data) => console.log(`✅ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    error: (msg, data) => console.error(`❌ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    warn: (msg, data) => console.warn(`⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    divider: () => console.log('\n' + '='.repeat(80) + '\n')
};

async function runDiagnostics() {
    try {
        logger.divider();
        logger.info('Starting Render Deployment Diagnostics');
        logger.divider();

        // 1. Check API Gateway health
        logger.info('1. Checking API Gateway health...');
        try {
            const healthResponse = await axios.get(
                'https://kelmah-api-gateway-50z3.onrender.com/health',
                { timeout: 10000 }
            );
            logger.info('✅ API Gateway is responding', {
                status: healthResponse.status,
                uptime: healthResponse.data.uptime
            });
        } catch (err) {
            logger.error('API Gateway health check failed', {
                status: err.response?.status,
                message: err.message
            });
            return;
        }
        logger.divider();

        // 2. Check aggregate health (all services)
        logger.info('2. Checking all services health aggregate...');
        try {
            const aggregateResponse = await axios.get(
                'https://kelmah-api-gateway-50z3.onrender.com/api/health/aggregate',
                { timeout: 15000 }
            );
            logger.info('✅ Health aggregate retrieved', aggregateResponse.data);
        } catch (err) {
            logger.error('Health aggregate check failed', {
                status: err.response?.status,
                message: err.message,
                timeout: err.code
            });
        }
        logger.divider();

        // 3. Check job service directly
        logger.info('3. Checking job service health...');
        try {
            const jobHealthResponse = await axios.get(
                'https://kelmah-api-gateway-50z3.onrender.com/api/jobs/health',
                { timeout: 10000 }
            );
            logger.info('✅ Job service is responding', jobHealthResponse.data);
        } catch (err) {
            logger.error('Job service health check failed', {
                status: err.response?.status,
                message: err.message,
                timeout: err.code
            });
        }
        logger.divider();

        // 4. Check database connectivity via gateway
        logger.info('4. Checking database connectivity via gateway...');
        try {
            const dbCheckResponse = await axios.post(
                'https://kelmah-api-gateway-50z3.onrender.com/api/debug/db-status',
                {},
                { timeout: 10000 }
            );
            logger.info('✅ Database status via gateway', dbCheckResponse.data);
        } catch (err) {
            if (err.response?.status === 404) {
                logger.warn('Debug endpoint not available (expected for production)');
            } else {
                logger.error('Database status check failed', {
                    status: err.response?.status,
                    message: err.message,
                    timeout: err.code
                });
            }
        }
        logger.divider();

        logger.info('✅ DIAGNOSTICS COMPLETED');

    } catch (err) {
        logger.error('Fatal error during diagnostics', {
            message: err.message,
            code: err.code
        });
    }
}

// Run diagnostics
runDiagnostics().catch(err => {
    logger.error('Fatal error', err);
    process.exit(1);
});
