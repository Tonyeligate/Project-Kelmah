/**
 * Feature Validation Script
 * 
 * This script validates feature completion claims in the project analysis
 * by comparing actual implemented functionality against requirements.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROGRESS_FILE = path.join(__dirname, '../ai-proposals/progress.json');
const OUTPUT_FILE = path.join(__dirname, '../ai-proposals/validated-progress.json');
const FEATURE_DEFINITIONS_FILE = path.join(__dirname, '../project-docs/feature-definitions.json');

/**
 * Feature requirement definitions
 * If feature-definitions.json doesn't exist, we'll use these defaults
 */
const DEFAULT_FEATURE_REQUIREMENTS = {
  Auth: [
    { name: 'User Registration', requiredFiles: ['register.js', 'register.jsx'] },
    { name: 'User Login', requiredFiles: ['login.js', 'login.jsx'] },
    { name: 'Password Reset', requiredFiles: ['reset-password.js', 'reset-password.jsx'] },
    { name: 'User Profile', requiredFiles: ['profile.js', 'profile.jsx'] },
    { name: 'Authentication Middleware', requiredFiles: ['auth.middleware.js'] },
  ],
  Messaging: [
    { name: 'Chat Interface', requiredFiles: ['chat.jsx', 'chat.js'] },
    { name: 'Message Storage', requiredFiles: ['message.model.js'] },
    { name: 'Real-time Messaging', requiredFiles: ['socket.js', 'socket.service.js'] },
    { name: 'Message Notifications', requiredFiles: ['notification.js'] },
  ],
  Payment: [
    { name: 'Payment Processing', requiredFiles: ['payment.service.js', 'stripe.js'] },
    { name: 'Invoice Generation', requiredFiles: ['invoice.js'] },
    { name: 'Payment History', requiredFiles: ['payment-history.js', 'payment-history.jsx'] },
    { name: 'Subscription Management', requiredFiles: ['subscription.js'] },
  ],
  Notification: [
    { name: 'Email Notifications', requiredFiles: ['email.service.js'] },
    { name: 'Push Notifications', requiredFiles: ['push-notification.js'] },
    { name: 'Notification Center', requiredFiles: ['notification-center.jsx'] },
    { name: 'Notification Settings', requiredFiles: ['notification-settings.js', 'notification-settings.jsx'] },
  ]
};

/**
 * Load the progress data from the progress file
 */
function loadProgressData() {
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading progress data:', error);
    return null;
  }
}

/**
 * Load feature requirement definitions
 */
function loadFeatureDefinitions() {
  try {
    if (fs.existsSync(FEATURE_DEFINITIONS_FILE)) {
      const data = fs.readFileSync(FEATURE_DEFINITIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return DEFAULT_FEATURE_REQUIREMENTS;
  } catch (error) {
    console.error('Error loading feature definitions:', error);
    return DEFAULT_FEATURE_REQUIREMENTS;
  }
}

/**
 * Check if a file exists in the codebase
 */
function fileExists(filePath, allFiles) {
  // Check for exact matches
  if (allFiles.includes(filePath)) {
    return true;
  }
  
  // Check for partial matches (files might be in subdirectories)
  const fileName = path.basename(filePath);
  return allFiles.some(file => file.endsWith('/' + fileName) || file === fileName);
}

/**
 * Validate feature completeness based on required files
 */
function validateFeature(feature, requiredFiles, allFiles) {
  const foundFiles = requiredFiles.filter(file => fileExists(file, allFiles));
  const completeness = foundFiles.length / requiredFiles.length * 100;
  
  return {
    name: feature.name,
    requiredFiles,
    foundFiles,
    completeness: Math.round(completeness),
    fullyImplemented: completeness === 100
  };
}

/**
 * Main validation function
 */
async function validateFeatures() {
  try {
    // Load data
    const progressData = loadProgressData();
    if (!progressData) {
      throw new Error('Failed to load progress data');
    }
    
    const featureDefinitions = loadFeatureDefinitions();
    
    // Extract all files from each feature
    const allFiles = [];
    Object.values(progressData.features).forEach(feature => {
      if (feature.files && Array.isArray(feature.files)) {
        allFiles.push(...feature.files);
      }
    });
    
    // Validate each feature service
    const validatedServices = {};
    
    for (const [serviceName, features] of Object.entries(featureDefinitions)) {
      const serviceResults = features.map(feature => validateFeature(
        feature, 
        feature.requiredFiles, 
        allFiles
      ));
      
      const serviceCompleteness = serviceResults.reduce(
        (acc, feature) => acc + feature.completeness, 
        0
      ) / features.length;
      
      validatedServices[serviceName] = {
        features: serviceResults,
        completeness: Math.round(serviceCompleteness),
        fullyImplemented: serviceCompleteness === 100
      };
    }
    
    // Create validated progress data
    const validatedProgress = {
      ...progressData,
      featureValidation: {
        services: validatedServices,
        overallCompleteness: calculateOverallCompleteness(validatedServices),
        timestamp: new Date().toISOString()
      }
    };
    
    // Update feature completeness with validated data
    for (const [serviceName, result] of Object.entries(validatedServices)) {
      if (validatedProgress.features[serviceName.toLowerCase()]) {
        validatedProgress.features[serviceName.toLowerCase()].completeness = result.completeness;
      }
    }
    
    // Save validated data
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validatedProgress, null, 2));
    
    // Generate validation report
    generateValidationReport(validatedServices);
    
    console.log('Feature validation complete. Results saved to:', OUTPUT_FILE);
    return validatedServices;
  } catch (error) {
    console.error('Error validating features:', error);
    return null;
  }
}

/**
 * Calculate overall completeness across all services
 */
function calculateOverallCompleteness(validatedServices) {
  const services = Object.values(validatedServices);
  if (services.length === 0) return 0;
  
  return Math.round(
    services.reduce((sum, service) => sum + service.completeness, 0) / services.length
  );
}

/**
 * Generate a validation report in Markdown format
 */
function generateValidationReport(validatedServices) {
  const reportPath = path.join(__dirname, '../ai-proposals/feature-validation-report.md');
  
  let report = `# Feature Validation Report\nGenerated on: ${new Date().toISOString()}\n\n`;
  report += `## Overall Completeness: ${calculateOverallCompleteness(validatedServices)}%\n\n`;
  
  for (const [serviceName, service] of Object.entries(validatedServices)) {
    report += `## ${serviceName} Service (${service.completeness}%)\n\n`;
    
    report += `| Feature | Status | Completeness | Missing Files |\n`;
    report += `|---------|--------|-------------|---------------|\n`;
    
    for (const feature of service.features) {
      const status = feature.fullyImplemented ? '✅ Complete' : '⚠️ Incomplete';
      const missingFiles = feature.requiredFiles.filter(file => !feature.foundFiles.includes(file)).join(', ');
      
      report += `| ${feature.name} | ${status} | ${feature.completeness}% | ${missingFiles || 'None'} |\n`;
    }
    
    report += `\n`;
  }
  
  fs.writeFileSync(reportPath, report);
  console.log('Validation report generated:', reportPath);
}

// Run validation if executed directly
if (require.main === module) {
  validateFeatures();
}

module.exports = {
  validateFeatures,
  loadProgressData,
  loadFeatureDefinitions
}; 