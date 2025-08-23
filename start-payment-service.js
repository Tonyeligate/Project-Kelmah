<<<<<<< HEAD
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Payment Service...');

const paymentService = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/payment-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5004'
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
=======
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Payment Service...');

const paymentService = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/payment-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5004'
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
>>>>>>> 41273844ebd7694fd6f3910546fa94a2d2a2003c
