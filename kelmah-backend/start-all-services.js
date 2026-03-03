#!/usr/bin/env node

/**
 * Start All Kelmah Services
 * Starts all microservices in the correct order with proper error handling
 */

const { spawn } = require('child_process');
const path = require('path');

const services = [
  {
    name: 'API Gateway',
    path: './api-gateway/server.js',
    port: 5000,
    dependsOn: []
  },
  {
    name: 'Auth Service',
    path: './services/auth-service/server.js',
    port: 5001,
    dependsOn: []
  },
  {
    name: 'User Service',
    path: './services/user-service/server.js',
    port: 5002,
    dependsOn: ['Auth Service']
  },
  {
    name: 'Job Service',
    path: './services/job-service/server.js',
    port: 5003,
    dependsOn: ['Auth Service']
  },
  {
    name: 'Messaging Service',
    path: './services/messaging-service/server.js',
    port: 5005,
    dependsOn: ['Auth Service']
  },
  {
    name: 'Payment Service',
    path: './services/payment-service/server.js',
    port: 5004,
    dependsOn: ['Auth Service']
  },
  {
    name: 'Review Service',
    path: './services/review-service/server.js',
    port: 5006,
    dependsOn: ['Auth Service', 'User Service']
  }
];

const runningProcesses = new Map();

function startService(service) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting ${service.name}...`);

    const process = spawn('node', [service.path], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    runningProcesses.set(service.name, process);

    let startupTimeout = setTimeout(() => {
      console.log(`⏰ ${service.name} startup timeout - may still be initializing...`);
      resolve();
    }, 10000);

    // Listen for successful startup
    process.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[${service.name}] ${output.trim()}`);

      // Check for successful startup indicators
      if (output.includes(`running on port ${service.port}`) ||
          output.includes('fully initialized') ||
          output.includes('connected to MongoDB')) {
        clearTimeout(startupTimeout);
        console.log(`✅ ${service.name} started successfully on port ${service.port}`);
        resolve();
      }
    });

    process.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[${service.name} ERROR] ${error.trim()}`);
    });

    process.on('close', (code) => {
      clearTimeout(startupTimeout);
      if (code !== 0) {
        console.log(`❌ ${service.name} exited with code ${code}`);
        reject(new Error(`${service.name} failed to start`));
      }
    });

    process.on('error', (error) => {
      clearTimeout(startupTimeout);
      console.error(`❌ ${service.name} failed to start: ${error.message}`);
      reject(error);
    });
  });
}

async function waitForDependencies(service) {
  for (const dep of service.dependsOn) {
    const depService = services.find(s => s.name === dep);
    if (depService) {
      console.log(`⏳ Waiting for ${dep} to be ready before starting ${service.name}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function startAllServices() {
  console.log('🚀 Starting Kelmah Services...\n');

  for (const service of services) {
    try {
      await waitForDependencies(service);
      await startService(service);
      console.log('');
    } catch (error) {
      console.error(`Failed to start ${service.name}: ${error.message}`);
      // Continue with other services
    }
  }

  console.log('✅ All services startup initiated!');
  console.log('\n📊 Service Status:');
  runningProcesses.forEach((process, name) => {
    console.log(`   ${name}: PID ${process.pid}`);
  });

  console.log('\n🔗 Service URLs:');
  services.forEach(service => {
    console.log(`   ${service.name}: http://localhost:${service.port}`);
  });

  console.log('\n💡 Use Ctrl+C to stop all services');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');

    runningProcesses.forEach((process, name) => {
      console.log(`Stopping ${name}...`);
      process.kill('SIGTERM');
    });

    setTimeout(() => {
      console.log('✅ All services stopped');
      process.exit(0);
    }, 5000);
  });
}

async function main() {
  try {
    // Check if MongoDB is running
    console.log('🔍 Checking MongoDB connection...');

    const checkMongo = async () => {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient('mongodb://localhost:27017');
      try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log('✅ MongoDB is running');
        return true;
      } catch (error) {
        console.log('❌ MongoDB not accessible:', error.message);
        console.log('💡 Make sure MongoDB is running on localhost:27017');
        return false;
      } finally {
        await client.close();
      }
    };

    const mongoRunning = await checkMongo();

    if (!mongoRunning) {
      console.log('⚠️  Starting services without MongoDB - some features may not work');
    }

    await startAllServices();

  } catch (error) {
    console.error('❌ Failed to start services:', error);
    process.exit(1);
  }
}

// Run the startup script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { startAllServices, startService };
