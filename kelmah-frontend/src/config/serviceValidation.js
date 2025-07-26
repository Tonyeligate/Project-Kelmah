/**
 * Service Configuration Validation
 * Ensures all service clients are properly configured and accessible
 */

import { SERVICES, API_ENDPOINTS } from './environment';

/**
 * Validates that all required services are configured
 */
export const validateServiceConfiguration = () => {
  const requiredServices = ['AUTH_SERVICE', 'USER_SERVICE', 'JOB_SERVICE', 'MESSAGING_SERVICE', 'PAYMENT_SERVICE'];
  const missingServices = [];
  
  requiredServices.forEach(service => {
    if (!SERVICES[service]) {
      missingServices.push(service);
    }
  });
  
  if (missingServices.length > 0) {
    console.warn('Missing service configurations:', missingServices);
    return false;
  }
  
  console.log('✅ All services properly configured:', SERVICES);
  return true;
};

/**
 * Validates API endpoints are properly built
 */
export const validateApiEndpoints = () => {
  const requiredEndpoints = ['AUTH', 'USER', 'JOB', 'MESSAGING', 'PAYMENT'];
  const missingEndpoints = [];
  
  requiredEndpoints.forEach(endpoint => {
    if (!API_ENDPOINTS[endpoint] || !API_ENDPOINTS[endpoint].BASE) {
      missingEndpoints.push(endpoint);
    }
  });
  
  if (missingEndpoints.length > 0) {
    console.warn('Missing API endpoints:', missingEndpoints);
    return false;
  }
  
  console.log('✅ All API endpoints properly configured');
  return true;
};

/**
 * Comprehensive service health check
 */
export const runServiceHealthCheck = () => {
  console.group('🔧 Kelmah Service Configuration Check');
  
  const servicesValid = validateServiceConfiguration();
  const endpointsValid = validateApiEndpoints();
  
  const overallHealth = servicesValid && endpointsValid;
  
  console.log(`Overall Service Health: ${overallHealth ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
  console.groupEnd();
  
  return overallHealth;
};

// Run validation in development
if (import.meta.env.MODE === 'development') {
  runServiceHealthCheck();
}

export default {
  validateServiceConfiguration,
  validateApiEndpoints,
  runServiceHealthCheck
}; 