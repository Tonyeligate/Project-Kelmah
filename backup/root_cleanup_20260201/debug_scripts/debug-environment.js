/**
 * Environment Debug Script
 * 
 * Paste this in browser console to see what environment variables are loaded
 */

console.log('🔍 Environment Debug Information');
console.log('================================');

// Check if running in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Browser Environment:', window.location.origin);
  console.log('📍 Current URL:', window.location.href);
  console.log('🔒 Protocol:', window.location.protocol);
}

// Check import.meta.env (this might not work in production builds)
try {
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    console.log('📦 Vite Environment Variables:');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
    console.log('MODE:', import.meta.env.MODE);
    console.log('BASE_URL:', import.meta.env.BASE_URL);
    console.log('DEV:', import.meta.env.DEV);
    console.log('PROD:', import.meta.env.PROD);
    console.log('All env vars:', import.meta.env);
  } else {
    console.log('❌ import.meta.env not available (production build)');
  }
} catch (error) {
  console.log('❌ Error accessing import.meta.env:', error.message);
}

// Check if the environment module is available
try {
  // This won't work unless we expose it globally, but let's try
  if (window.__KELMAH_ENV__) {
    console.log('🎯 Kelmah Environment Config:', window.__KELMAH_ENV__);
  } else {
    console.log('❌ Kelmah environment config not exposed globally');
  }
} catch (error) {
  console.log('❌ Error accessing Kelmah env:', error.message);
}

// Check axios base URL if available
try {
  // Look for axios instances in the global scope
  const scripts = document.querySelectorAll('script');
  console.log('📜 Script tags count:', scripts.length);
  
  // Try to find any axios configuration
  if (window.axios) {
    console.log('🔧 Global axios baseURL:', window.axios.defaults.baseURL);
  } else {
    console.log('❌ Global axios not found');
  }
} catch (error) {
  console.log('❌ Error checking axios:', error.message);
}

console.log('================================');
console.log('💡 Expected Values:');
console.log('VITE_API_URL should be: https://kelmah-backend-six.vercel.app');
console.log('Axios requests should go to backend, not:', window.location.origin + '/api');
