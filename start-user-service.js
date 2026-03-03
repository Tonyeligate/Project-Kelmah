const { spawn } = require('child_process');
const path = require('path');

console.log('👤 Starting User Service...');
console.log('📁 Working directory:', process.cwd());

const userService = spawn('node', ['-r', path.resolve(__dirname, 'kelmah-backend/dns-fix.js'), 'server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '5002',
    USER_SERVICE_PORT: process.env.PORT || '5002'
  },
  cwd: path.resolve(__dirname, 'kelmah-backend/services/user-service')
});

userService.on('error', (error) => {
  console.error('❌ User Service failed to start:', error);
});

userService.on('close', (code) => {
  console.log(`👤 User Service exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down User Service...');
  userService.kill('SIGINT');
  process.exit(0);
});
