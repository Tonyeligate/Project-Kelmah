<<<<<<< HEAD
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Review Service...');

const reviewService = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/review-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5006'
  }
});

reviewService.on('error', (error) => {
  console.error('❌ Review Service failed to start:', error);
});

reviewService.on('close', (code) => {
  console.log(`⭐ Review Service exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Review Service...');
  reviewService.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Review Service...');
  reviewService.kill('SIGTERM');
});
=======
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Review Service...');

const reviewService = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/review-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5006'
  }
});

reviewService.on('error', (error) => {
  console.error('❌ Review Service failed to start:', error);
});

reviewService.on('close', (code) => {
  console.log(`⭐ Review Service exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Review Service...');
  reviewService.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Review Service...');
  reviewService.kill('SIGTERM');
});
>>>>>>> 41273844ebd7694fd6f3910546fa94a2d2a2003c
