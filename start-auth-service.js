<<<<<<< HEAD
const { spawn } = require('child_process');
const path = require('path');

console.log('🔐 Starting Auth Service...');
console.log('📁 Working directory:', process.cwd());

const authService = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5001',
    AUTH_SERVICE_PORT: '5001'
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
=======
const { spawn } = require('child_process');
const path = require('path');

console.log('🔐 Starting Auth Service...');
console.log('📁 Working directory:', process.cwd());

const authService = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5001',
    AUTH_SERVICE_PORT: '5001'
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
>>>>>>> 41273844ebd7694fd6f3910546fa94a2d2a2003c
