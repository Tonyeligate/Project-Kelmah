const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Job Service...');

const jobService = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/job-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5003'
  }
});

jobService.on('error', (error) => {
  console.error('❌ Job Service failed to start:', error);
});

jobService.on('close', (code) => {
  console.log(`📦 Job Service exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Job Service...');
  jobService.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Job Service...');
  jobService.kill('SIGTERM');
});
