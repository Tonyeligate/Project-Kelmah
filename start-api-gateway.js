const { spawn } = require('child_process');
const path = require('path');

console.log('🚪 Starting API Gateway...');
console.log('📁 Working directory:', process.cwd());

const apiGateway = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5000',
    API_GATEWAY_PORT: '5000'
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
