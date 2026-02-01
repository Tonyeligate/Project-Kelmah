const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Messaging Service...');

const messagingService = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'kelmah-backend/services/messaging-service'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5005'
  }
});

messagingService.on('error', (error) => {
  console.error('❌ Messaging Service failed to start:', error);
});

messagingService.on('close', (code) => {
  console.log(`💬 Messaging Service exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Messaging Service...');
  messagingService.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Messaging Service...');
  messagingService.kill('SIGTERM');
});
