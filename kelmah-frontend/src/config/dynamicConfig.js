/**
 * Dynamic Configuration System
 * Automatically reads current ngrok URL and other dynamic configurations
 */

import { getApiBaseUrl } from './environment';

// Function to get current ngrok URL from centralized config
const getCurrentNgrokUrl = async () => {
  try {
    // Use centralized API base URL instead of fetching from runtime-config.json
    const baseUrl = await getApiBaseUrl();
    if (baseUrl && baseUrl !== '/api') {
      return baseUrl;
    }

    // Fallback to legacy ngrok detection for development
    const isProduction = import.meta.env.MODE === 'production';
    const hasExplicitApiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http');

    if (isProduction && hasExplicitApiUrl) {
      console.log('🎯 Production mode: Using explicit API URL instead of ngrok');
      return null; // Don't use ngrok in production when explicit URL is set
    }

    if (typeof window !== 'undefined') {
      // Browser environment - try to get from localStorage first
      const storedUrl = localStorage.getItem('kelmah_ngrok_url');
      if (storedUrl && !isProduction) {
        return storedUrl;
      }

      // Try to fetch from runtime config file (only in development)
      if (!isProduction) {
        try {
          const response = await fetch('/runtime-config.json');
          if (response.ok) {
            const config = await response.json();

            // Check if this runtime config is for development
            if (config.isDevelopment !== false) {
              const url = config.ngrokUrl;

              // Store in localStorage for future use
              if (url) {
                localStorage.setItem('kelmah_ngrok_url', url);
                return url;
              }
            }
          }
        } catch (fetchError) {
          console.warn('Failed to fetch runtime config:', fetchError);
        }
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
  // In production mode, prioritize environment variables over ngrok
  const isDevelopment = import.meta.env.MODE === 'development';
  const prodApiUrl = import.meta.env.VITE_API_URL;
  
  if (!isDevelopment && prodApiUrl) {
    return prodApiUrl;
  }
  
  // In development or when no prod URL is set, use ngrok
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
    // In production mode, prioritize environment variables over ngrok
    const isDevelopment = import.meta.env.MODE === 'development';
    
    // If we have a production WebSocket URL set, use it (unless in development)
    const prodWsUrl = import.meta.env.VITE_WS_URL;
    if (!isDevelopment && prodWsUrl) {
      return prodWsUrl;
    }
    
    if (typeof window !== 'undefined') {
      // In development or when no prod URL is set, check runtime config
      const runtimeConfig = window.__RUNTIME_CONFIG__;
      if (runtimeConfig && runtimeConfig.isDevelopment !== false) {
        // Prioritize dedicated websocketUrl over converted ngrokUrl
        if (runtimeConfig.websocketUrl) {
          return runtimeConfig.websocketUrl;
        }
        if (runtimeConfig.ngrokUrl) {
          return runtimeConfig.ngrokUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
        }
      }
      
      // Fallback to localStorage (development only)
      if (isDevelopment) {
        const storedUrl = localStorage.getItem('kelmah_ngrok_url');
        if (storedUrl) {
          return storedUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
        }
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
