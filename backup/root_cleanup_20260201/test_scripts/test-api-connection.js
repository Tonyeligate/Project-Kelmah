/**
 * API Connection Test Script
 * 
 * Run this in your browser console on the frontend to test if the API routing is working.
 * Open your Vercel frontend URL and paste this in the browser console.
 */

console.log('🔧 Testing API Connection...');

// Test function to check API connectivity
async function testApiConnection() {
  const API_BASE_URL = 'https://kelmah-backend-six.vercel.app';
  
  console.log('🎯 Testing API Base URL:', API_BASE_URL);
  
  // Test 1: Basic connectivity
  try {
    console.log('📡 Test 1: Basic connectivity...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Health check status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check response:', data);
    } else {
      console.log('⚠️ Health check failed, but connection works');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
  
  // Test 2: Auth endpoint
  try {
    console.log('📡 Test 2: Auth service connectivity...');
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Auth status check:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auth response:', data);
    } else {
      console.log('⚠️ Auth check failed, but connection works');
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }
  
  // Test 3: Check CORS
  try {
    console.log('📡 Test 3: CORS test...');
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    
    console.log('✅ CORS preflight status:', response.status);
    console.log('✅ CORS headers:', Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.error('❌ CORS test failed:', error);
  }
  
  console.log('🔧 API Connection Test Complete!');
}

// Run the test
testApiConnection();

// Export for manual use
window.testApiConnection = testApiConnection;
