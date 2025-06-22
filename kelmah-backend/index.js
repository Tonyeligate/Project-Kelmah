/**
 * Kelmah Platform Backend Orchestrator
 * This script starts all the microservices and the API gateway
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

// Service definitions with configuration
const services = [
  {
    name: 'API Gateway',
    path: path.join(__dirname, 'api-gateway'),
    script: 'server.js',
    color: colors.green
  },
  {
    name: 'Auth Service',
    path: path.join(__dirname, 'services', 'auth-service'),
    script: 'server.js',
    color: colors.blue
  },
  {
    name: 'User Service',
    path: path.join(__dirname, 'services', 'user-service'),
    script: 'server.js',
    color: colors.magenta
  },
  {
    name: 'Job Service',
    path: path.join(__dirname, 'services', 'job-service'),
    script: 'server.js',
    color: colors.cyan
  },
  {
    name: 'Messaging Service',
    path: path.join(__dirname, 'services', 'messaging-service'),
    script: 'server.js',
    color: colors.yellow
  },
  {
    name: 'Review Service',
    path: path.join(__dirname, 'services', 'review-service'),
    script: 'server.js',
    color: colors.white
  },
  {
    name: 'Notification Service',
    path: path.join(__dirname, 'services', 'notification-service'),
    script: 'server.js',
    color: colors.red
  }
];

// Track running services
const runningProcesses = new Map();

// Function to start a service
function startService(service) {
  console.log(`${service.color}Starting ${service.name}...${colors.reset}`);
  
  // Check if service directory exists
  if (!fs.existsSync(service.path)) {
    console.error(`${colors.red}Error: Directory for ${service.name} not found at ${service.path}${colors.reset}`);
    return;
  }
  
  // Check if service script exists
  const scriptPath = path.join(service.path, service.script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`${colors.red}Error: Script for ${service.name} not found at ${scriptPath}${colors.reset}`);
    return;
  }
  
  // Spawn the process
  const proc = spawn('node', [service.script], {
    cwd: service.path,
    stdio: 'pipe',
    env: { ...process.env, SERVICE_NAME: service.name }
  });
  
  // Add to running processes
  runningProcesses.set(service.name, proc);
  
  // Handle process output
  proc.stdout.on('data', (data) => {
    console.log(`${service.color}[${service.name}] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`${colors.red}[${service.name}] ${data.toString().trim()}${colors.reset}`);
  });
  
  // Handle process exit
  proc.on('exit', (code) => {
    console.log(`${service.color}[${service.name}] Process exited with code ${code}${colors.reset}`);
    runningProcesses.delete(service.name);
    
    // Restart service if exited unexpectedly
    if (code !== 0 && !shuttingDown) {
      console.log(`${service.color}[${service.name}] Restarting service...${colors.reset}`);
      setTimeout(() => startService(service), 5000);
    }
  });
}

// Track if we're shutting down
let shuttingDown = false;

// Function to shutdown all services
function shutdown() {
  console.log(`${colors.yellow}Shutting down all services...${colors.reset}`);
  shuttingDown = true;
  
  // Send SIGTERM to all processes
  for (const [name, process] of runningProcesses.entries()) {
    console.log(`${colors.yellow}Stopping ${name}...${colors.reset}`);
    process.kill('SIGTERM');
  }
  
  // Allow some time for graceful shutdown
  setTimeout(() => {
    // Force kill any remaining processes
    for (const [name, process] of runningProcesses.entries()) {
      console.log(`${colors.red}Forcing ${name} to stop...${colors.reset}`);
      process.kill('SIGKILL');
    }
    
    process.exit(0);
  }, 5000);
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start all services
console.log(`${colors.green}Starting Kelmah Platform Backend...${colors.reset}`);
services.forEach(startService);

console.log(`${colors.green}Kelmah Platform Backend orchestrator running${colors.reset}`);
console.log(`${colors.yellow}Press Ctrl+C to stop all services${colors.reset}`); 