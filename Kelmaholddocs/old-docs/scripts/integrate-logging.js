#!/usr/bin/env node

/**
 * Logging Integration Script
 * Adds Winston logging to all microservices
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '../kelmah-backend/services');
const SHARED_LOGGER = path.join(__dirname, '../shared/logger.js');

console.log('🔧 Integrating Winston logging across all services...');

function integrateLoggingInService(serviceName) {
  const servicePath = path.join(SERVICES_DIR, serviceName);
  const serverJsPath = path.join(servicePath, 'server.js');
  
  console.log(`\n📝 Processing ${serviceName}...`);
  
  if (!fs.existsSync(serverJsPath)) {
    console.log(`⚠️  No server.js found in ${serviceName}, creating template...`);
    createServerTemplate(servicePath, serviceName);
    return;
  }
  
  // Read current server.js
  let serverContent = fs.readFileSync(serverJsPath, 'utf8');
  
  // Check if logging is already integrated
  if (serverContent.includes('winston') || serverContent.includes('logger')) {
    console.log(`ℹ️  Logging already integrated in ${serviceName}`);
    return;
  }
  
  // Add logging integration
  const loggingIntegration = `
// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('../../shared/logger');

// Create service logger
const logger = createLogger('${serviceName}');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('${serviceName} starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});
`;
  
  // Find the position to insert logging (after requires, before app creation)
  const appCreationRegex = /const app = express\(\);?/;
  const appMatch = serverContent.match(appCreationRegex);
  
  if (appMatch) {
    const insertPosition = appMatch.index;
    serverContent = 
      serverContent.slice(0, insertPosition) + 
      loggingIntegration + 
      '\n' + 
      serverContent.slice(insertPosition);
    
    // Add HTTP logging middleware after app creation
    const middlewareIntegration = `
// Add HTTP request logging
app.use(createHttpLogger(logger));
`;
    
    const middlewarePosition = serverContent.indexOf('app.use(express.json');
    if (middlewarePosition > -1) {
      serverContent = 
        serverContent.slice(0, middlewarePosition) + 
        middlewareIntegration + 
        '\n' + 
        serverContent.slice(middlewarePosition);
    }
    
    // Add error logging middleware (should be last)
    const errorMiddleware = `
// Error logging middleware (must be last)
app.use(createErrorLogger(logger));
`;
    
    const serverStartRegex = /app\.listen\(/;
    const serverMatch = serverContent.match(serverStartRegex);
    if (serverMatch) {
      const errorPosition = serverMatch.index;
      serverContent = 
        serverContent.slice(0, errorPosition) + 
        errorMiddleware + 
        '\n' + 
        serverContent.slice(errorPosition);
    }
    
    // Update server start logging
    serverContent = serverContent.replace(
      /console\.log\([^)]*server.*running[^)]*\)/gi,
      `logger.info('${serviceName} server started successfully', { port: PORT, environment: process.env.NODE_ENV })`
    );
    
    // Replace other console.log/error with logger
    serverContent = serverContent.replace(/console\.log\(/g, 'logger.info(');
    serverContent = serverContent.replace(/console\.error\(/g, 'logger.error(');
    serverContent = serverContent.replace(/console\.warn\(/g, 'logger.warn(');
    
  } else {
    console.log(`⚠️  Could not find app creation in ${serviceName}, manual integration needed`);
    return;
  }
  
  // Write updated server.js
  fs.writeFileSync(serverJsPath, serverContent);
  console.log(`✅ Logging integrated into ${serviceName}`);
}

function createServerTemplate(servicePath, serviceName) {
  const port = getServicePort(serviceName);
  
  const serverTemplate = `/**
 * ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Server
 * Kelmah Platform - ${serviceName.replace('-', ' ').toUpperCase()}
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import centralized logger
const { createLogger, createHttpLogger, createErrorLogger, setupGlobalErrorHandlers } = require('../../shared/logger');

// Load environment variables
dotenv.config();

// Create service logger
const logger = createLogger('${serviceName}');

// Setup global error handlers
setupGlobalErrorHandlers(logger);

logger.info('${serviceName} starting...', { 
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

const app = express();
const PORT = process.env.PORT || ${port};

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

// Add HTTP request logging
app.use(createHttpLogger(logger));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      logger.info('Connected to MongoDB', { database: process.env.DB_NAME });
    })
    .catch((error) => {
      logger.error('MongoDB connection failed', error);
      process.exit(1);
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: '${serviceName}',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.get('/', (req, res) => {
  res.json({
    service: '${serviceName}',
    message: 'Service is running',
    version: '1.0.0'
  });
});

// Error logging middleware (must be last)
app.use(createErrorLogger(logger));

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('${serviceName} server started successfully', { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development' 
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down ${serviceName}...');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close();
  }
  process.exit(0);
});
`;
  
  fs.writeFileSync(path.join(servicePath, 'server.js'), serverTemplate);
  console.log(`✅ Created server.js template for ${serviceName}`);
}

function getServicePort(serviceName) {
  const portMap = {
    'auth-service': 5001,
    'user-service': 5002,
    'job-service': 5003,
    'messaging-service': 5004,
    'payment-service': 5005,
    'review-service': 5006
  };
  
  return portMap[serviceName] || 5000;
}

async function runIntegration() {
  // Get list of services
  const services = fs.readdirSync(SERVICES_DIR).filter(dir => {
    const servicePath = path.join(SERVICES_DIR, dir);
    return fs.statSync(servicePath).isDirectory();
  });
  
  console.log(`📦 Found services: ${services.join(', ')}`);
  
  // Integrate logging for each service
  for (const service of services) {
    integrateLoggingInService(service);
  }
  
  console.log('\n🎉 Logging integration completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Centralized Winston logger created');
  console.log('✅ HTTP request logging added');
  console.log('✅ Error logging middleware added');
  console.log('✅ Global exception handlers setup');
  console.log('✅ Log rotation and file management configured');
  
  console.log('\n🔧 Features added:');
  console.log('- Request ID tracking');
  console.log('- User context logging');
  console.log('- Daily log rotation');
  console.log('- Separate error/http/combined logs');
  console.log('- Console + file output');
  console.log('- Graceful shutdown logging');
}

// Run integration
runIntegration().catch(error => {
  console.error('💥 Logging integration failed:', error);
  process.exit(1);
});