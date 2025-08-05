/**
 * Authentication Service
 *
 * Centralized authentication service that handles all auth-related API calls
 * using the new environment configuration system.
 */

import axios from 'axios';
import { SERVICES, AUTH_CONFIG } from '../../../config/environment';
import { secureStorage } from '../../../utils/secureStorage';

// Create dedicated auth service client
const authServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests (except for login/register)
authServiceClient.interceptors.request.use(
  (config) => {
    const token = secureStorage.getAuthToken();
    if (
      token &&
      !config.url.includes('/login') &&
      !config.url.includes('/register') &&
      !config.url.includes('/refresh')
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor will be set up after authService is defined
// to avoid circular dependency issues

// Token refresh tracking
let tokenRefreshTimeout = null;

const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await authServiceClient.post('/api/auth/login', credentials);
      
      // Extract data from response (handle different response structures)
      const responseData = response.data.data || response.data;
      const { token, refreshToken, user } = responseData;

      if (!token || !user) {
        throw new Error('Invalid response from server - missing token or user data');
      }

      // Store authentication data securely
      secureStorage.setAuthToken(token);
      if (refreshToken) {
        secureStorage.setRefreshToken(refreshToken);
      }
      secureStorage.setUserData(user);

      // Setup automatic token refresh
      authService.setupTokenRefresh(token);

      console.log('Login successful for user:', user.email);
      return { token, refreshToken, user, success: true };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Extract error message from different response formats
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      throw new Error(errorMessage);
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await authServiceClient.post(
        '/api/auth/register',
        userData,
      );
      const { token, user } = response.data.data || response.data;

      if (token) {
        secureStorage.setAuthToken(token);
      }
      if (user) {
        secureStorage.setUserData(user);
      }

      return { token, user, success: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Verify authentication
  verifyAuth: async () => {
    try {
      const response = await authServiceClient.get('/api/auth/verify');
      const { user } = response.data.data || response.data;

      if (user) {
        secureStorage.setUserData(user);
      }

      return { user, success: true };
    } catch (error) {
      console.warn('Auth verification failed:', error.message);
      // Clear invalid authentication data
      secureStorage.clear();
      return { success: false, error: error.message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Include refresh token in logout request if available
      const refreshToken = secureStorage.getRefreshToken();
      const logoutData = refreshToken ? { refreshToken } : {};
      
      await authServiceClient.post('/api/auth/logout', logoutData);
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear token refresh timeout
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
        tokenRefreshTimeout = null;
      }
      
      // Always clean up secure storage
      secureStorage.clear();
      console.log('Logout completed - all auth data cleared');
    }
  },

  // Get current user from secure storage
  getCurrentUser: () => {
    return secureStorage.getUserData();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = secureStorage.getAuthToken();
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  // Get auth token
  getToken: () => {
    return secureStorage.getAuthToken();
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = secureStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authServiceClient.post('/api/auth/refresh', {
        refreshToken
      });
      
      const responseData = response.data.data || response.data;
      const { token: newAccessToken, refreshToken: newRefreshToken } = responseData;

      if (newAccessToken) {
        secureStorage.setAuthToken(newAccessToken);
        
        // Setup next automatic refresh
        authService.setupTokenRefresh(newAccessToken);
      }
      
      if (newRefreshToken) {
        secureStorage.setRefreshToken(newRefreshToken);
      }

      console.log('Token refreshed successfully');
      return { token: newAccessToken, success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, clear auth data and force re-login
      secureStorage.clear();
      
      // Dispatch custom event for components to handle re-login
      window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
      
      return { success: false, error: error.message };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await authServiceClient.post(
        '/api/auth/forgot-password',
        { email },
      );
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await authServiceClient.post(
        '/api/auth/reset-password',
        { token, password },
      );
    return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await authServiceClient.put('/api/auth/profile', profileData);
      const { user } = response.data.data || response.data;

      if (user) {
        secureStorage.setUserData(user);
      }

      return { user, success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await authServiceClient.put(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Get user role
  getUserRole: () => {
    try {
      const userData = secureStorage.getUserData();
      if (userData) {
        return userData.role || userData.userType || userData.userRole || null;
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return null;
  },

  // Check if user has specific role
  hasRole: (role) => {
    const userRole = authService.getUserRole();
    return userRole === role;
  },

  // Get stored user data
  getStoredUser: () => {
    try {
      return secureStorage.getUserData();
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  },

  // Email Verification Methods
  verifyEmail: async (token) => {
    try {
      const response = await authServiceClient.get(`/api/auth/verify-email/${token}`);
      return {
        success: true,
        message: response.data.message || 'Email verified successfully',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Email verification failed:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Email verification failed',
      };
    }
  },

  resendVerificationEmail: async (email) => {
    try {
      const response = await authServiceClient.post('/api/auth/resend-verification-email', {
        email,
      });
      return {
        success: true,
        message: response.data.message || 'Verification email sent successfully',
      };
    } catch (error) {
      console.error('Resend verification email failed:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to send verification email',
      };
    }
  },

  // MFA Setup (placeholder for future implementation)
  setupMFA: async () => {
    try {
      // Placeholder - will be implemented when MFA service is ready
      console.warn('MFA setup not yet implemented');
      return { success: false, message: 'MFA setup not yet implemented' };
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  },

  // Verify MFA (placeholder for future implementation)
  verifyMFA: async (token) => {
    try {
      // Placeholder - will be implemented when MFA service is ready
      console.warn('MFA verification not yet implemented');
      return { success: false, message: 'MFA verification not yet implemented' };
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  },

  // Disable MFA (placeholder for future implementation)
  disableMFA: async (password, token) => {
    try {
      // Placeholder - will be implemented when MFA service is ready
      console.warn('MFA disable not yet implemented');
      return { success: false, message: 'MFA disable not yet implemented' };
    } catch (error) {
      console.error('MFA disable error:', error);
      throw error;
    }
  },

  // Setup automatic token refresh
  setupTokenRefresh: (token) => {
    try {
      // Clear any existing timeout
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }

      // Decode JWT to get expiry time (basic decode, not verification)
      const base64Url = token.split('.')[1];
      if (!base64Url) return;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Refresh 5 minutes before expiry, but not less than 1 minute from now
      const refreshTime = Math.max(expiry - (5 * 60 * 1000), now + (1 * 60 * 1000));
      const timeUntilRefresh = refreshTime - now;

      if (timeUntilRefresh > 0) {
        console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
        
        tokenRefreshTimeout = setTimeout(async () => {
          console.log('Attempting automatic token refresh...');
          const result = await authService.refreshToken();
          
          if (!result.success) {
            console.warn('Automatic token refresh failed, user may need to re-login');
          }
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.warn('Failed to setup token refresh:', error);
    }
  },

  // Initialize authentication on app start
  initializeAuth: async () => {
    try {
      // Try secureStorage first
      let token = secureStorage.getAuthToken();
      let userData = secureStorage.getUserData();
      
      // Fallback to localStorage if secureStorage fails (dual storage system compatibility)
      if (!token) {
        console.log('No token in secureStorage, checking localStorage fallback...');
        token = localStorage.getItem('kelmah_auth_token');
        const userString = localStorage.getItem('user');
        
        if (token && userString) {
          try {
            userData = JSON.parse(userString);
            console.log('Found authentication data in localStorage fallback');
            
            // Sync to secureStorage for future use
            secureStorage.setAuthToken(token);
            secureStorage.setUserData(userData);
            console.log('Synced localStorage data to secureStorage');
          } catch (e) {
            console.warn('Failed to parse user data from localStorage:', e);
            userData = null;
          }
        }
      }
      
      if (token) {
        // Setup token refresh for existing token
        authService.setupTokenRefresh(token);
        
        // If we have user data from storage, use it directly (avoid API call)
        if (userData && userData.email) {
          console.log('Using stored user data for quick initialization');
          return { authenticated: true, user: userData };
        }
        
        // Otherwise verify the token with API
        try {
          const verifyResult = await authService.verifyAuth();
          if (!verifyResult.success) {
            console.warn('Stored token is invalid, clearing auth data');
            secureStorage.clear();
            localStorage.removeItem('kelmah_auth_token');
            localStorage.removeItem('user');
            return { authenticated: false };
          }
          
          return { authenticated: true, user: verifyResult.user };
        } catch (verifyError) {
          // If verification fails but we have user data, still allow authentication
          // (handles offline scenarios or API temporarily unavailable)
          if (userData && userData.email) {
            console.log('API verification failed, but using cached user data');
            return { authenticated: true, user: userData };
          }
          
          throw verifyError;
        }
      }
      
      console.log('No token found in storage');
      return { authenticated: false };
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear both storage systems on error
      secureStorage.clear();
      localStorage.removeItem('kelmah_auth_token');
      localStorage.removeItem('user');
      return { authenticated: false };
    }
  },
};

// Add response interceptor to handle token refresh on 401 errors
// (Set up after authService is defined to avoid circular dependency)
authServiceClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get a 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshResult = await authService.refreshToken();
        
        if (refreshResult.success) {
          // Update the authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          return authServiceClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed during request retry:', refreshError);
        // Clear auth data and dispatch token expired event
        secureStorage.clear();
        window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
      }
    }
    
    return Promise.reject(error);
  }
);

export default authService;
