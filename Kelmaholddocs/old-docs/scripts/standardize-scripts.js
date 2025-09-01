#!/usr/bin/env node

/**
 * Package.json Scripts Standardization
 * Standardizes scripts across all microservices
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '../kelmah-backend/services');

console.log('📜 Standardizing package.json scripts across all services...');

// Standard scripts for all services
const standardScripts = {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "health": "curl http://localhost:$npm_package_config_port/health || echo 'Service not running'",
  "logs": "tail -f logs/*.log || echo 'No logs found'",
  "clean": "rm -rf node_modules logs coverage .nyc_output",
  "validate": "npm-check-updates && npm audit"
};

// Service-specific script additions
const serviceSpecificScripts = {
  'auth-service': {
    "generate-keys": "node scripts/generate-keys.js",
    "migrate-users": "node scripts/migrate-users.js",
    "test:auth": "jest --testPathPattern=auth"
  },
  'user-service': {
    "seed-users": "node scripts/seed-users.js", 
    "migrate-profiles": "node scripts/migrate-profiles.js",
    "test:profiles": "jest --testPathPattern=profile"
  },
  'job-service': {
    "seed-jobs": "node scripts/seed-jobs.js",
    "reindex-search": "node scripts/reindex-search.js",
    "test:jobs": "jest --testPathPattern=job"
  },
  'messaging-service': {
    "cleanup-messages": "node scripts/cleanup-old-messages.js",
    "test:websocket": "jest --testPathPattern=websocket",
    "test:messages": "jest --testPathPattern=message"
  },
  'payment-service': {
    "sync-stripe": "node scripts/sync-stripe.js",
    "test:payments": "jest --testPathPattern=payment",
    "test:stripe": "jest --testPathPattern=stripe"
  },
  'review-service': {
    "moderate-reviews": "node scripts/moderate-reviews.js",
    "test:reviews": "jest --testPathPattern=review"
  }
};

// Standard package.json configuration
const standardConfig = {
  config: {
    port: "5000"
  },
  engines: {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  keywords: ["kelmah", "microservice", "nodejs", "api"],
  author: "Kelmah Team",
  license: "MIT"
};

function standardizePackageJson(serviceName) {
  const servicePath = path.join(SERVICES_DIR, serviceName);
  const packageJsonPath = path.join(servicePath, 'package.json');
  
  console.log(`\n📝 Processing ${serviceName}...`);
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`❌ No package.json found in ${serviceName}`);
    return;
  }
  
  // Read current package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Backup original
  const backupPath = path.join(servicePath, 'package.json.backup');
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
    console.log(`💾 Backed up original package.json`);
  }
  
  // Update scripts
  const currentScripts = packageJson.scripts || {};
  const newScripts = {
    ...standardScripts,
    ...(serviceSpecificScripts[serviceName] || {}),
    ...currentScripts // Keep any existing custom scripts
  };
  
  // Update configuration
  const servicePort = getServicePort(serviceName);
  const newConfig = {
    ...standardConfig,
    config: {
      ...standardConfig.config,
      port: servicePort.toString()
    }
  };
  
  // Merge with existing package.json
  const updatedPackageJson = {
    ...packageJson,
    scripts: newScripts,
    ...newConfig,
    description: packageJson.description || `${serviceName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} for Kelmah platform`,
    version: packageJson.version || '1.0.0'
  };
  
  // Show changes
  showScriptChanges(serviceName, currentScripts, newScripts);
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
  console.log(`✅ Updated package.json for ${serviceName}`);
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

function showScriptChanges(serviceName, oldScripts, newScripts) {
  const changes = [];
  
  // Check for new scripts
  for (const [script, command] of Object.entries(newScripts)) {
    if (!oldScripts[script]) {
      changes.push(`  ➕ ${script}: ${command}`);
    } else if (oldScripts[script] !== command) {
      changes.push(`  📈 ${script}: ${oldScripts[script]} → ${command}`);
    }
  }
  
  if (changes.length > 0) {
    console.log(`\n📊 ${serviceName} script changes:`);
    changes.forEach(change => console.log(change));
  }
}

function createGlobalPackageScripts() {
  console.log('\n🌐 Creating global package scripts...');
  
  const rootPackageJsonPath = path.join(__dirname, '../package.json');
  let rootPackageJson = {};
  
  if (fs.existsSync(rootPackageJsonPath)) {
    rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
  }
  
  // Global scripts for managing all services
  const globalScripts = {
    ...rootPackageJson.scripts,
    
    // Service management
    "services:install": "for dir in kelmah-backend/services/*/; do (cd \"$dir\" && npm install); done",
    "services:update": "for dir in kelmah-backend/services/*/; do (cd \"$dir\" && npm update); done",
    "services:audit": "for dir in kelmah-backend/services/*/; do (cd \"$dir\" && npm audit); done",
    "services:clean": "for dir in kelmah-backend/services/*/; do (cd \"$dir\" && npm run clean); done",
    
    // Development
    "dev:auth": "cd kelmah-backend/services/auth-service && npm run dev",
    "dev:user": "cd kelmah-backend/services/user-service && npm run dev", 
    "dev:job": "cd kelmah-backend/services/job-service && npm run dev",
    "dev:messaging": "cd kelmah-backend/services/messaging-service && npm run dev",
    "dev:payment": "cd kelmah-backend/services/payment-service && npm run dev",
    "dev:review": "cd kelmah-backend/services/review-service && npm run dev",
    "dev:gateway": "cd kelmah-backend/api-gateway && npm run dev",
    "dev:frontend": "cd kelmah-frontend && npm run dev",
    
    // Testing
    "test:all": "npm run test:backend && npm run test:frontend",
    "test:backend": "for dir in kelmah-backend/services/*/; do (cd \"$dir\" && npm test); done",
    "test:frontend": "cd kelmah-frontend && npm test",
    "test:e2e": "cd tests && npm run e2e",
    
    // Health checks
    "health:all": "npm run health:services && npm run health:gateway && npm run health:frontend",
    "health:services": "for port in 5001 5002 5003 5004 5005 5006; do curl -f http://localhost:$port/health || echo \"Service on port $port not healthy\"; done",
    "health:gateway": "curl -f http://localhost:5000/health || echo 'Gateway not healthy'",
    "health:frontend": "curl -f http://localhost:3001 || echo 'Frontend not healthy'",
    
    // Database operations
    "db:migrate": "cd migrations-mongodb && npm run migrate",
    "db:seed": "for dir in kelmah-backend/services/*/; do (cd \"$dir\" && npm run seed 2>/dev/null || true); done",
    
    // Deployment
    "build:all": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd kelmah-frontend && npm run build",
    "build:backend": "echo 'Backend requires no build'",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    
    // Utilities
    "logs:all": "tail -f kelmah-backend/services/*/logs/*.log",
    "clean:all": "npm run services:clean && cd kelmah-frontend && npm run clean",
    "setup": "npm install && npm run services:install && cd kelmah-frontend && npm install"
  };
  
  const updatedRootPackage = {
    ...rootPackageJson,
    scripts: globalScripts,
    workspaces: [
      "kelmah-backend/services/*",
      "kelmah-frontend",
      "migrations-mongodb"
    ]
  };
  
  fs.writeFileSync(rootPackageJsonPath, JSON.stringify(updatedRootPackage, null, 2));
  console.log('✅ Updated root package.json with global scripts');
}

async function runScriptStandardization() {
  console.log('📜 Package.json Script Standardization');
  console.log('=' . repeat(50));
  
  // Get list of services
  const services = fs.readdirSync(SERVICES_DIR).filter(dir => {
    const servicePath = path.join(SERVICES_DIR, dir);
    return fs.statSync(servicePath).isDirectory();
  });
  
  console.log(`📦 Found services: ${services.join(', ')}`);
  
  // Standardize each service
  for (const service of services) {
    standardizePackageJson(service);
  }
  
  // Create global scripts
  createGlobalPackageScripts();
  
  console.log('\n🎉 Script standardization completed!');
  console.log('\n📋 Standard Scripts Added:');
  Object.entries(standardScripts).forEach(([script, command]) => {
    console.log(`✅ ${script}: ${command}`);
  });
  
  console.log('\n🌐 Global Scripts Created:');
  console.log('✅ services:* - Manage all services');
  console.log('✅ dev:* - Start individual services in dev mode');
  console.log('✅ test:* - Run tests across services');
  console.log('✅ health:* - Check service health');
  console.log('✅ docker:* - Docker operations');
  
  console.log('\n📖 Usage Examples:');
  console.log('- npm run dev:auth  # Start auth service in dev mode');
  console.log('- npm run health:all  # Check all service health');
  console.log('- npm run services:install  # Install deps for all services');
  console.log('- npm run test:all  # Run all tests');
}

// Run standardization
runScriptStandardization().catch(error => {
  console.error('💥 Script standardization failed:', error);
  process.exit(1);
});