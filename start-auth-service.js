const { spawn } = require('child_process');
const path = require('path');

console.log('🔐 Starting Auth Service...');
console.log('📁 Working directory:', process.cwd());

const authService = spawn('node', ['-r', path.resolve(__dirname, 'kelmah-backend/dns-fix.js'), 'server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '5001',
    AUTH_SERVICE_PORT: process.env.PORT || '5001'
  },
  cwd: path.resolve(__dirname, 'kelmah-backend/services/auth-service')
});

authService.on('error', (error) => {
  console.error('❌ Auth Service failed to start:', error);
});

authService.on('close', (code) => {
  console.log(`🔐 Auth Service exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Auth Service...');
  authService.kill('SIGINT');
  process.exit(0);
});
