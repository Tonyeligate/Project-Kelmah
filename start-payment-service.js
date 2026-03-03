const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Payment Service...');

const paymentService = spawn('node', ['-r', path.resolve(__dirname, 'kelmah-backend/dns-fix.js'), 'server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/payment-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '5004'
  }
});

paymentService.on('error', (error) => {
  console.error('❌ Payment Service failed to start:', error);
});

paymentService.on('close', (code) => {
  console.log(`💳 Payment Service exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Payment Service...');
  paymentService.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Payment Service...');
  paymentService.kill('SIGTERM');
});
