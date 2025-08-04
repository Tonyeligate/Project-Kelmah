#!/usr/bin/env node

/**
 * Kelmah Backend Services Startup Script
 * Starts all microservices in the correct order
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Service configuration
const services = [
  {
    name: 'Auth Service',
    path: './services/auth-service',
    port: 3001,
    command: 'node server.js',
    color: 'green'
  },
  {
    name: 'User Service',
    path: './services/user-service',
    port: 3002,
    command: 'node server.js',
    color: 'blue'
  },
  {
    name: 'Job Service',
    path: './services/job-service',
    port: 3003,
    command: 'node server.js',
    color: 'yellow'
  },
  {
    name: 'Payment Service',
    path: './services/payment-service',
    port: 3004,
    command: 'node server.js',
    color: 'magenta'
  },
  {
    name: 'Messaging Service',
    path: './services/messaging-service',
    port: 3005,
    command: 'node server.js',
    color: 'cyan'
  },
  {
    name: 'API Gateway',
    path: './api-gateway',
    port: 3000,
    command: 'node server.js',
    color: 'bright',
    waitForServices: true
  }
];

// Store running processes
const runningProcesses = [];

// Graceful shutdown handler
const shutdown = () => {
  log('\n🛑 Shutting down all services...', 'red');
  
  runningProcesses.forEach((process, index) => {
    if (process && process.pid) {
      log(`   Stopping ${services[index].name}...`, 'yellow');
      process.kill('SIGTERM');
    }
  });

  setTimeout(() => {
    log('✅ All services stopped', 'green');
    process.exit(0);
  }, 2000);
};

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Check if a port is available
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
};

// Wait for a service to be ready
const waitForService = (port, maxAttempts = 30) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      const http = require('http');
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error(`Service on port ${port} not ready after ${maxAttempts} attempts`));
          } else {
            setTimeout(check, 1000);
          }
        }
      });

      req.on('error', () => {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`Service on port ${port} not ready after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 1000);
        }
      });

      req.setTimeout(1000, () => {
        req.destroy();
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`Service on port ${port} not ready after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    
    check();
  });
};

// Start a single service
const startService = async (service, index) => {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(__dirname, service.path);
    
    // Check if service directory exists
    if (!fs.existsSync(servicePath)) {
      log(`❌ Service directory not found: ${servicePath}`, 'red');
      reject(new Error(`Service directory not found: ${servicePath}`));
      return;
    }

    // Check if package.json exists
    const packagePath = path.join(servicePath, 'package.json');
    if (!fs.existsSync(packagePath)) {
      log(`❌ package.json not found for ${service.name}`, 'red');
      reject(new Error(`package.json not found for ${service.name}`));
      return;
    }

    log(`🚀 Starting ${service.name} on port ${service.port}...`, service.color);

    // Start the service process
    const child = spawn('node', ['server.js'], {
      cwd: servicePath,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: service.port.toString(),
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    // Store the process
    runningProcesses[index] = child;

    // Handle stdout
    child.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[${service.name}] ${message}`, service.color);
      }
    });

    // Handle stderr
    child.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('DeprecationWarning')) {
        log(`[${service.name}] ERROR: ${message}`, 'red');
      }
    });

    // Handle process exit
    child.on('close', (code) => {
      if (code !== null && code !== 0) {
        log(`❌ ${service.name} exited with code ${code}`, 'red');
        reject(new Error(`${service.name} exited with code ${code}`));
      } else {
        log(`🔄 ${service.name} stopped`, 'yellow');
      }
    });

    child.on('error', (error) => {
      log(`❌ Failed to start ${service.name}: ${error.message}`, 'red');
      reject(error);
    });

    // Wait for service to be ready
    setTimeout(async () => {
      try {
        await waitForService(service.port);
        log(`✅ ${service.name} ready on port ${service.port}`, service.color);
        resolve();
      } catch (error) {
        log(`❌ ${service.name} failed to start: ${error.message}`, 'red');
        reject(error);
      }
    }, 2000);
  });
};

// Main startup function
const startAllServices = async () => {
  log('🎯 Starting Kelmah Backend Services...', 'bright');
  log('=========================================', 'bright');

  try {
    // Check for required environment variables
    const requiredEnvVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'DATABASE_HOST',
      'DATABASE_NAME',
      'DATABASE_USER',
      'DATABASE_PASSWORD'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      log(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`, 'red');
      log('   Please check your .env file', 'yellow');
      process.exit(1);
    }

    // Check if ports are available
    log('🔍 Checking port availability...', 'cyan');
    for (const service of services) {
      const available = await checkPort(service.port);
      if (!available) {
        log(`❌ Port ${service.port} is already in use (needed for ${service.name})`, 'red');
        process.exit(1);
      }
    }

    // Start services (API Gateway last)
    const servicesToStart = services.filter(s => !s.waitForServices);
    const gatewayService = services.find(s => s.waitForServices);

    // Start core services first
    log('🔧 Starting core services...', 'cyan');
    for (let i = 0; i < servicesToStart.length; i++) {
      await startService(servicesToStart[i], i);
      // Small delay between services
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Start API Gateway last
    if (gatewayService) {
      log('🌐 Starting API Gateway...', 'cyan');
      const gatewayIndex = services.indexOf(gatewayService);
      await startService(gatewayService, gatewayIndex);
    }

    log('', 'reset');
    log('🎉 All services started successfully!', 'green');
    log('=========================================', 'bright');
    log('', 'reset');
    
    // Display service status
    services.forEach(service => {
      log(`   ${service.name}: http://localhost:${service.port}`, service.color);
    });
    
    log('', 'reset');
    log('📋 Health checks:', 'cyan');
    services.forEach(service => {
      log(`   ${service.name}: http://localhost:${service.port}/health`, 'cyan');
    });
    
    log('', 'reset');
    log('🚀 API Gateway (main entry): http://localhost:3000', 'bright');
    log('📚 API Documentation: http://localhost:3000/api/docs', 'bright');
    log('', 'reset');
    log('Press Ctrl+C to stop all services', 'yellow');

  } catch (error) {
    log(`❌ Failed to start services: ${error.message}`, 'red');
    shutdown();
  }
};

// Start the services
startAllServices();