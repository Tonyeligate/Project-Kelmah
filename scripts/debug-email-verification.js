#!/usr/bin/env node

/**
 * Debug Email Verification System
 * Tests the complete flow step by step to identify issues
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://kelmah-auth-service.onrender.com';
const FRONTEND_URL = 'https://kelmah-frontend-cyan.vercel.app';

console.log('🔍 EMAIL VERIFICATION DEBUG SCRIPT');
console.log('====================================');
console.log('🔗 Auth Service URL:', AUTH_SERVICE_URL);
console.log('🌐 Frontend URL:', FRONTEND_URL);

async function debugEmailVerification() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testUser = {
    firstName: 'Debug',
    lastName: 'User',
    email: testEmail,
    password: 'DebugPassword123!',
    role: 'worker'
  };

  try {
    console.log('\n1. 🧪 Testing user registration...');
    console.log('   📧 Test email:', testEmail);
    
    // Step 1: Register user
    const registerResponse = await axios.post(`${AUTH_SERVICE_URL}/register`, testUser);
    console.log('   ✅ Registration Response:', registerResponse.status, registerResponse.data.message);
    
    console.log('\n2. 🔗 Testing route availability...');
    
    // Test route availability with dummy token
    const dummyToken = crypto.randomBytes(32).toString('hex');
    
    try {
      await axios.get(`${AUTH_SERVICE_URL}/verify-email/${dummyToken}`);
    } catch (routeError) {
      if (routeError.response?.status === 400) {
        console.log('   ✅ Route /verify-email/:token is available (400 = Invalid token expected)');
      } else if (routeError.response?.status === 404) {
        console.log('   ❌ Route /verify-email/:token NOT FOUND (404)');
        console.log('   🔍 Available routes may be different');
      } else {
        console.log('   ⚠️ Unexpected response:', routeError.response?.status, routeError.response?.data);
      }
    }
    
    console.log('\n3. 📧 Testing resend verification email...');
    
    try {
      const resendResponse = await axios.post(`${AUTH_SERVICE_URL}/resend-verification-email`, {
        email: testEmail
      });
      console.log('   ✅ Resend Response:', resendResponse.status, resendResponse.data.message);
    } catch (resendError) {
      if (resendError.response?.status === 404) {
        console.log('   ❌ Route /resend-verification-email NOT FOUND (404)');
        console.log('   🔍 Checking alternative route /resend-verification...');
        
        try {
          const altResendResponse = await axios.post(`${AUTH_SERVICE_URL}/resend-verification`, {
            email: testEmail
          });
          console.log('   ✅ Alternative route works:', altResendResponse.status, altResendResponse.data.message);
        } catch (altError) {
          console.log('   ❌ Alternative route also fails:', altError.response?.status);
        }
      } else {
        console.log('   ⚠️ Resend Error:', resendError.response?.status, resendError.response?.data?.message);
      }
    }
    
    console.log('\n4. 🔍 Testing service health...');
    
    try {
      const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
      console.log('   ✅ Service Health:', healthResponse.status, healthResponse.data);
    } catch (healthError) {
      console.log('   ⚠️ Health check failed:', healthError.response?.status);
    }
    
    console.log('\n5. 📋 Testing frontend route structure...');
    
    const frontendTestUrl = `${FRONTEND_URL}/verify-email/${dummyToken}`;
    console.log('   🔗 Frontend verification URL:', frontendTestUrl);
    console.log('   ℹ️ This URL should be accessible (may show "invalid token" but should load the page)');
    
    console.log('\n🔍 DEBUG ANALYSIS COMPLETE');
    console.log('============================');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔥 Connection refused - Auth service may be down');
    } else if (error.response) {
      console.error('📡 HTTP Error:', error.response.status);
      console.error('📄 Response:', error.response.data);
    }
  }
}

// Route discovery function
async function discoverRoutes() {
  console.log('\n🔍 ROUTE DISCOVERY');
  console.log('==================');
  
  const commonRoutes = [
    '/health',
    '/register',
    '/login',
    '/verify/:token',
    '/verify-email/:token',
    '/resend-verification',
    '/resend-verification-email',
    '/forgot-password',
    '/reset-password'
  ];
  
  for (const route of commonRoutes) {
    try {
      const testRoute = route.replace(':token', 'test-token');
      await axios.get(`${AUTH_SERVICE_URL}${testRoute}`);
      console.log(`✅ ${route} - Available`);
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 422) {
        console.log(`✅ ${route} - Available (validation error expected)`);
      } else if (error.response?.status === 404) {
        console.log(`❌ ${route} - Not found`);
      } else if (error.response?.status === 405) {
        console.log(`⚠️ ${route} - Wrong method (exists but needs POST)`);
      } else {
        console.log(`❓ ${route} - Unknown (${error.response?.status})`);
      }
    }
  }
}

// Comprehensive debug suggestions
function printDebugSuggestions() {
  console.log('\n💡 DEBUG SUGGESTIONS');
  console.log('====================');
  console.log('If issues persist:');
  console.log('');
  console.log('1. 🔍 CHECK DEPLOYMENT LOGS:');
  console.log('   • Look for route registration errors');
  console.log('   • Check for MongoDB connection issues');
  console.log('   • Verify environment variables are set');
  console.log('');
  console.log('2. 📧 TEST EMAIL TEMPLATE:');
  console.log('   • Register a real user');
  console.log('   • Check spam folder for verification email');
  console.log('   • Verify the link format in the email');
  console.log('');
  console.log('3. 🌐 TEST FRONTEND ROUTE:');
  console.log('   • Navigate to /verify-email/test-token manually');
  console.log('   • Check browser dev tools for API calls');
  console.log('   • Verify the API endpoint being called');
  console.log('');
  console.log('4. 🔧 CHECK SERVICE CONFIGURATION:');
  console.log('   • FRONTEND_URL environment variable');
  console.log('   • SMTP configuration for email sending');
  console.log('   • Database connection status');
}

// Run the debug script
if (require.main === module) {
  debugEmailVerification()
    .then(() => discoverRoutes())
    .then(() => printDebugSuggestions())
    .catch(console.error);
}

module.exports = { debugEmailVerification };