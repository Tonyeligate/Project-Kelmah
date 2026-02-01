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
function validateFeatureCompleteness(featureRequirements, progressData) {
  const validationResults = {};
  
  // Extract all files from progress data
  const allFiles = [];
  for (const featureName in progressData.features) {
    const feature = progressData.features[featureName];
    if (feature.files && Array.isArray(feature.files)) {
      allFiles.push(...feature.files);
    }
  }
  
  // Validate each service
  for (const [serviceName, requirements] of Object.entries(featureRequirements)) {
    validationResults[serviceName] = {
      features: [],
      overallCompleteness: 0
    };
    
    let totalFeatures = requirements.length;
    let completedFeatures = 0;
    
    for (const requirement of requirements) {
      const foundFiles = requirement.requiredFiles.filter(file => 
        fileExists(file, allFiles)
      );
      
      const completeness = Math.round((foundFiles.length / requirement.requiredFiles.length) * 100);
      const fullyImplemented = completeness === 100;
      
      if (fullyImplemented) {
        completedFeatures++;
      }
      
      validationResults[serviceName].features.push({
        name: requirement.name,
        requiredFiles: requirement.requiredFiles,
        foundFiles,
        completeness,
        fullyImplemented
      });
    }
    
    validationResults[serviceName].overallCompleteness = 
      Math.round((completedFeatures / totalFeatures) * 100);
  }
  
  return validationResults;
}

/**
 * Generate validation report
 */
function generateValidationReport(validationResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalServices: Object.keys(validationResults).length,
      fullyCompleteServices: 0,
      averageCompleteness: 0
    },
    services: validationResults,
    recommendations: []
  };
  
  let totalCompleteness = 0;
  
  for (const [serviceName, service] of Object.entries(validationResults)) {
    totalCompleteness += service.overallCompleteness;
    
    if (service.overallCompleteness === 100) {
      report.summary.fullyCompleteServices++;
    }
    
    // Generate recommendations for incomplete services
    if (service.overallCompleteness < 100) {
      const incompleteFeatures = service.features.filter(f => !f.fullyImplemented);
      report.recommendations.push({
        service: serviceName,
        priority: service.overallCompleteness < 50 ? 'High' : 'Medium',
        action: `Implement missing components for ${incompleteFeatures.length} features`,
        features: incompleteFeatures.map(f => f.name)
      });
    }
  }
  
  report.summary.averageCompleteness = 
    Math.round(totalCompleteness / report.summary.totalServices);
  
  return report;
}

/**
 * Main validation function
 */
async function validateFeatures() {
  console.log('🔍 Starting Feature Validation...\n');
  
  // Load data
  const progressData = loadProgressData();
  const featureRequirements = loadFeatureDefinitions();
  
  if (!progressData) {
    console.error('❌ Could not load progress data');
    return;
  }
  
  // Perform validation
  const validationResults = validateFeatureCompleteness(featureRequirements, progressData);
  const report = generateValidationReport(validationResults);
  
  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('📊 Validation Results:');
  console.log(`   Total Services: ${report.summary.totalServices}`);
  console.log(`   Fully Complete: ${report.summary.fullyCompleteServices}`);
  console.log(`   Average Completeness: ${report.summary.averageCompleteness}%\n`);
  
  console.log('🎯 Recommendations:');
  for (const rec of report.recommendations) {
    console.log(`   ${rec.priority}: ${rec.service} - ${rec.action}`);
  }
  
  console.log(`\n✅ Validation complete. Results saved to: ${OUTPUT_FILE}`);
  return report;
}

// Export functions
module.exports = {
  validateFeatures,
  validateFeatureCompleteness,
  generateValidationReport,
  loadProgressData,
  loadFeatureDefinitions
};

// Run if called directly
if (require.main === module) {
  validateFeatures().catch(console.error);
}