const { spawn } = require('child_process');
const path = require('path');

console.log('🚪 Starting API Gateway...');
console.log('📁 Working directory:', process.cwd());

const apiGateway = spawn('node', ['-r', path.resolve(__dirname, 'kelmah-backend/dns-fix.js'), 'server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '5000',
    API_GATEWAY_PORT: process.env.PORT || '5000',
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001',
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://127.0.0.1:5002',
    JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || 'http://127.0.0.1:5003',
    PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:5004',
    MESSAGING_SERVICE_URL: process.env.MESSAGING_SERVICE_URL || 'http://127.0.0.1:5005',
    REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || 'http://127.0.0.1:5006'
  },
  cwd: path.resolve(__dirname, 'kelmah-backend/api-gateway')
});

apiGateway.on('error', (error) => {
  console.error('❌ API Gateway failed to start:', error);
});

apiGateway.on('close', (code) => {
  console.log(`🚪 API Gateway exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API Gateway...');
  apiGateway.kill('SIGINT');
  process.exit(0);
});
