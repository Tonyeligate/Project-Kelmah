#!/usr/bin/env node

/**
 * Dependency Standardization Script
 * Updates all microservices to use standardized dependency versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load dependency matrix
const dependencyMatrix = require('../dependency-matrix.json');

const SERVICES_DIR = path.join(__dirname, '../kelmah-backend/services');
const standardDeps = dependencyMatrix.standardDependencies;

console.log('🔄 Starting dependency standardization...');

// Get all service directories
const services = fs.readdirSync(SERVICES_DIR).filter(dir => {
  const servicePath = path.join(SERVICES_DIR, dir);
  return fs.statSync(servicePath).isDirectory();
});

console.log('📦 Found services:', services);

async function standardizeService(serviceName) {
  const servicePath = path.join(SERVICES_DIR, serviceName);
  const packageJsonPath = path.join(servicePath, 'package.json');
  
  console.log(`\n🔧 Processing ${serviceName}...`);
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`❌ No package.json found in ${serviceName}`);
    return createPackageJson(servicePath, serviceName);
  }
  
  // Read current package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const originalDeps = { ...packageJson.dependencies };
  const originalDevDeps = { ...packageJson.devDependencies };
  
  // Update dependencies
  packageJson.dependencies = updateDependencies(packageJson.dependencies || {}, standardDeps.production);
  packageJson.devDependencies = updateDependencies(packageJson.devDependencies || {}, standardDeps.development);
  
  // Add missing essential dependencies
  const serviceDeps = getServiceSpecificDependencies(serviceName);
  Object.assign(packageJson.dependencies, serviceDeps);
  
  // Standardize package.json structure
  packageJson.version = packageJson.version || '1.0.0';
  packageJson.engines = { "node": ">=18.0.0" };
  packageJson.scripts = {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo 'Tests not implemented yet'",
    ...packageJson.scripts
  };
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Show changes
  showChanges(serviceName, originalDeps, packageJson.dependencies, 'dependencies');
  showChanges(serviceName, originalDevDeps, packageJson.devDependencies, 'devDependencies');
  
  // Install dependencies
  try {
    console.log(`📥 Installing dependencies for ${serviceName}...`);
    execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
    console.log(`✅ ${serviceName} dependencies updated successfully`);
  } catch (error) {
    console.error(`❌ Failed to install dependencies for ${serviceName}:`, error.message);
  }
}

function updateDependencies(currentDeps, standardDeps) {
  const updated = { ...currentDeps };
  
  // Update existing dependencies to standard versions
  for (const [dep, version] of Object.entries(standardDeps)) {
    if (currentDeps[dep]) {
      updated[dep] = version;
    }
  }
  
  // Add missing critical dependencies
  const criticalDeps = ['express', 'cors', 'helmet', 'morgan', 'dotenv'];
  for (const dep of criticalDeps) {
    if (standardDeps[dep] && !updated[dep]) {
      updated[dep] = standardDeps[dep];
    }
  }
  
  return updated;
}

function getServiceSpecificDependencies(serviceName) {
  const serviceDeps = {};
  
  switch (serviceName) {
    case 'auth-service':
      serviceDeps.mongoose = standardDeps.production.mongoose;
      serviceDeps.bcryptjs = standardDeps.production.bcryptjs;
      serviceDeps.jsonwebtoken = standardDeps.production.jsonwebtoken;
      serviceDeps.nodemailer = '6.9.8';
      serviceDeps.passport = '0.7.0';
      break;
      
    case 'user-service':
      serviceDeps.mongoose = standardDeps.production.mongoose;
      serviceDeps.joi = standardDeps.production.joi;
      serviceDeps.multer = '^1.4.5-lts.1';
      break;
      
    case 'job-service':
      serviceDeps.mongoose = standardDeps.production.mongoose;
      serviceDeps.joi = standardDeps.production.joi;
      break;
      
    case 'messaging-service':
      serviceDeps.mongoose = standardDeps.production.mongoose;
      serviceDeps['socket.io'] = '^4.7.4';
      break;
      
    case 'payment-service':
      serviceDeps.mongoose = standardDeps.production.mongoose;
      serviceDeps.stripe = '^14.15.0';
      serviceDeps['paypal-rest-sdk'] = '^1.8.1';
      serviceDeps.validator = standardDeps.production.validator;
      break;
      
    case 'review-service':
      serviceDeps.mongoose = standardDeps.production.mongoose;
      serviceDeps.joi = standardDeps.production.joi;
      break;
  }
  
  return serviceDeps;
}

function createPackageJson(servicePath, serviceName) {
  console.log(`📝 Creating package.json for ${serviceName}...`);
  
  const packageJson = {
    "name": `kelmah-${serviceName}`,
    "version": "1.0.0",
    "description": `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} service for Kelmah platform`,
    "main": "server.js",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js",
      "test": "echo 'Tests not implemented yet'"
    },
    "dependencies": {
      ...standardDeps.production,
      ...getServiceSpecificDependencies(serviceName)
    },
    "devDependencies": standardDeps.development,
    "engines": {
      "node": ">=18.0.0"
    },
    "keywords": [serviceName, "service", "kelmah", "microservice"],
    "author": "Kelmah Team",
    "license": "MIT"
  };
  
  fs.writeFileSync(path.join(servicePath, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log(`✅ Created package.json for ${serviceName}`);
  
  // Install dependencies
  try {
    execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
    console.log(`✅ Installed dependencies for ${serviceName}`);
  } catch (error) {
    console.error(`❌ Failed to install dependencies for ${serviceName}:`, error.message);
  }
}

function showChanges(serviceName, oldDeps, newDeps, type) {
  const changes = [];
  
  // Check for version changes
  for (const [dep, newVersion] of Object.entries(newDeps)) {
    const oldVersion = oldDeps[dep];
    if (oldVersion && oldVersion !== newVersion) {
      changes.push(`  📈 ${dep}: ${oldVersion} → ${newVersion}`);
    } else if (!oldVersion) {
      changes.push(`  ➕ ${dep}: ${newVersion} (new)`);
    }
  }
  
  if (changes.length > 0) {
    console.log(`\n📊 ${serviceName} ${type} changes:`);
    changes.forEach(change => console.log(change));
  }
}

async function runStandardization() {
  console.log('🚀 Dependency Standardization Process');
  console.log('=' . repeat(50));
  
  for (const service of services) {
    await standardizeService(service);
  }
  
  console.log('\n🎉 Dependency standardization completed!');
  console.log('\n📋 Summary:');
  console.log(`✅ Processed ${services.length} services`);
  console.log('✅ Updated to latest stable versions');
  console.log('✅ Added missing critical dependencies');
  console.log('✅ Standardized package.json structure');
  
  console.log('\n🔍 Next steps:');
  console.log('1. Test each service individually');
  console.log('2. Run integration tests');
  console.log('3. Update deployment configurations');
  console.log('4. Document new dependency versions');
}

// Run the standardization
runStandardization().catch(error => {
  console.error('💥 Standardization failed:', error);
  process.exit(1);
});