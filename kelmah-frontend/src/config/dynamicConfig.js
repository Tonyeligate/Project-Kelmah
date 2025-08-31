/**
 * Dynamic Configuration System
 * Automatically reads current ngrok URL and other dynamic configurations
 */

// Function to get current ngrok URL from config file
const getCurrentNgrokUrl = async () => {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment - try to get from localStorage first
      const storedUrl = localStorage.getItem('kelmah_ngrok_url');
      if (storedUrl) {
        return storedUrl;
      }
      
      // Try to fetch from runtime config file
      try {
        const response = await fetch('/runtime-config.json');
        if (response.ok) {
          const config = await response.json();
          const url = config.ngrokUrl;
          
          // Store in localStorage for future use
          if (url) {
            localStorage.setItem('kelmah_ngrok_url', url);
            return url;
          }
        }
      } catch (fetchError) {
        console.warn('Failed to fetch runtime config:', fetchError);
      }
      
      // Fallback to environment variable
      return import.meta.env.VITE_NGROK_URL || import.meta.env.VITE_MESSAGING_SERVICE_URL;
    }
    
    // Node.js environment (if this ever runs on server)
    return process.env.VITE_NGROK_URL || process.env.VITE_MESSAGING_SERVICE_URL;
  } catch (error) {
    console.warn('Failed to get dynamic ngrok URL:', error);
    return null;
  }
};

// Function to update ngrok URL (called by ngrok manager)
export const updateNgrokUrl = (newUrl) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kelmah_ngrok_url', newUrl);
      console.log('✅ Ngrok URL updated in localStorage:', newUrl);
    }
  } catch (error) {
    console.error('Failed to update ngrok URL:', error);
  }
};

// Function to get WebSocket URL dynamically
export const getWebSocketUrl = async () => {
  const ngrokUrl = await getCurrentNgrokUrl();
  
  if (ngrokUrl) {
    // Convert http:// to ws:// and https:// to wss://
    return ngrokUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  }
  
  // Fallback to default - will be updated by ngrok manager
  return null;
};

// Function to get API URL dynamically
export const getApiUrl = async () => {
  const ngrokUrl = await getCurrentNgrokUrl();
  
  if (ngrokUrl) {
    return ngrokUrl;
  }
  
  // Fallback to default - will be updated by ngrok manager
  return null;
};

// Synchronous version for environment configuration
export const getWebSocketUrlSync = () => {
  try {
    if (typeof window !== 'undefined') {
      const storedUrl = localStorage.getItem('kelmah_ngrok_url');
      if (storedUrl) {
        return storedUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
      }
      
      // Try to get from runtime config synchronously (this will work if the file is already loaded)
      // Note: This is a fallback for when the file is already in the browser cache
      const runtimeConfig = window.__RUNTIME_CONFIG__;
      if (runtimeConfig && runtimeConfig.ngrokUrl) {
        return runtimeConfig.ngrokUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
      }
    }
    
    // Return null as fallback - will be handled by calling code
    return null;
  } catch (error) {
    // Return null as fallback - will be handled by calling code
    return null;
  }
};

// Export the dynamic configuration
export const DYNAMIC_CONFIG = {
  getCurrentNgrokUrl,
  updateNgrokUrl,
  getWebSocketUrl,
  getApiUrl,
  getWebSocketUrlSync,
};
