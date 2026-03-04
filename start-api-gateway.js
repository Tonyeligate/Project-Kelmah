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
    API_GATEWAY_PORT: process.env.PORT || '5000'
    // Service URLs resolved by serviceDiscovery.js using *_SERVICE_CLOUD_URL env vars.
    // Do NOT set *_SERVICE_URL defaults to localhost here — they override cloud discovery.
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
