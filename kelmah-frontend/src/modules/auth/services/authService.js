/**
 * Authentication Service
 *
 * Centralized authentication service that handles all auth-related API calls
 * using the new environment configuration system.
 */

import axios from 'axios';
import { SERVICES, AUTH_CONFIG } from '../../../config/environment';

// Create dedicated auth service client
const authServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests (except for login/register)
authServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
    if (
      token &&
      !config.url.includes('/login') &&
      !config.url.includes('/register')
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await authServiceClient.post(
        '/api/auth/login',
        credentials,
      );
      const { token, user } = response.data.data || response.data;

      if (token) {
        localStorage.setItem(AUTH_CONFIG.tokenKey, token);
      }
      if (user) {
        localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
      }

      return { token, user, success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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
        localStorage.setItem(AUTH_CONFIG.tokenKey, token);
      }
      if (user) {
        localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
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
        localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
      }

      return { user, success: true };
    } catch (error) {
      console.warn('Auth verification failed:', error.message);
      // Don't throw error, just return failure
      return { success: false, error: error.message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await authServiceClient.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clean up local storage
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem(AUTH_CONFIG.userKey);
    }
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const userString = localStorage.getItem(AUTH_CONFIG.userKey);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem(AUTH_CONFIG.tokenKey);
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await authServiceClient.post('/api/auth/refresh');
      const { token } = response.data.data || response.data;

      if (token) {
        localStorage.setItem(AUTH_CONFIG.tokenKey, token);
      }

      return { token, success: true };
    } catch (error) {
      console.warn('Token refresh failed:', error.message);
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
      const response = await authServiceClient.put(
        '/api/auth/profile',
        profileData,
      );
      const { user } = response.data.data || response.data;

      if (user) {
        localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
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
      const userData = localStorage.getItem(AUTH_CONFIG.userKey);
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || user.userType || user.userRole || null;
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
      const userData = localStorage.getItem(AUTH_CONFIG.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  },
};

export default authService;
