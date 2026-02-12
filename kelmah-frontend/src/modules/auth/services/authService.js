/**
 * Authentication Service
 *
 * Centralized authentication service that handles all auth-related API calls
 * using the new environment configuration system.
 */

import { api } from '../../../services/apiClient';
import { secureStorage } from '../../../utils/secureStorage';
import { normalizeUser } from '../../../utils/userUtils';

// Use centralized authServiceClient with standard interceptors

// Response interceptors are handled by the centralized service client configuration
// in modules/common/services/axios.js

// Token refresh tracking
let tokenRefreshTimeout = null;

const persistNormalizedUser = (user) => {
  if (!user) {
    return null;
  }

  const normalizedUser = normalizeUser(user._raw || user);
  if (normalizedUser) {
    secureStorage.setUserData(normalizedUser);
  }

  return normalizedUser;
};

// Retry helper for handling Render cold starts
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 2000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Only retry on network errors or timeouts (Render cold start scenarios)
      const isRetryable = !error.response ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Network Error');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[Auth] Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

const authService = {
  // Login user with automatic retry for Render cold starts
  login: async (credentials) => {
    try {
      // Use retry wrapper to handle Render cold start delays
      const response = await retryWithBackoff(() =>
        api.post('/auth/login', credentials)
      );

      // Extract data from response (handle different response structures)
      const responseData = response.data.data || response.data;
      const { token, refreshToken, user } = responseData;
      const normalizedUser = persistNormalizedUser(user);

      if (!token || !user) {
        throw new Error(
          'Invalid response from server - missing token or user data',
        );
      }

      // Store authentication data securely
      secureStorage.setAuthToken(token);
      if (refreshToken) {
        secureStorage.setRefreshToken(refreshToken);
      }

      // Setup automatic token refresh
      authService.setupTokenRefresh(token);

      console.log(
        'Login successful for user:',
        normalizedUser?.email || user.email,
      );
      return {
        token,
        refreshToken,
        user: normalizedUser || user,
        success: true,
      };
    } catch (error) {
      console.error('Login failed:', error);

      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage =
          'Login is taking longer than usual. The service may be starting up. Please wait a moment and try again.';
      } else if (error.response?.status === 401) {
        errorMessage =
          'Invalid email or password. Please check your credentials and try again.';
      } else if (error.response?.status === 403) {
        errorMessage =
          'Your account has been temporarily disabled. Please contact support.';
      } else if (error.response?.status === 429) {
        errorMessage =
          'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (error.response?.status >= 500) {
        errorMessage =
          'Our servers are experiencing issues. Please try again in a few minutes.';
      } else if (!error.response) {
        errorMessage =
          'Unable to connect to our servers. Please check your internet connection and try again.';
      } else {
        // Use server message if available
        errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          errorMessage;
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.status = error.response?.status;
      enhancedError.isRetryable =
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500 ||
        !error.response;

      throw enhancedError;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post(
        '/auth/register',
        userData,
      );
      const { token, user } = response.data.data || response.data;
      const normalizedUser = normalizeUser(user?._raw || user);

      // Registration UX intentionally redirects to login.
      // Do not persist auth state/tokens here to avoid confusing route behavior.
      return { token, user: normalizedUser || user, success: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Verify authentication
  verifyAuth: async () => {
    try {
      const response = await api.get('/auth/verify');
      const { user } = response.data.data || response.data;
      const normalizedUser = persistNormalizedUser(user);

      if (normalizedUser) {
        return { user: normalizedUser, success: true };
      } else {
        // API returned success but no user data - don't clear storage, just return success
        // This allows the stored user data to be used
        return { user: undefined, success: true };
      }
    } catch (error) {
      console.warn('Auth verification failed:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Include refresh token in logout request if available
      const refreshToken = secureStorage.getRefreshToken();
      const logoutData = refreshToken ? { refreshToken } : {};

      await api.post('/auth/logout', logoutData);
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
    const refreshToken = secureStorage.getRefreshToken();

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
        shouldReset: true,
      };
    }

    try {
      const response = await api.post('/auth/refresh-token', {
        refreshToken,
      });

      const responseData = response.data.data || response.data;
      const {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user,
      } = responseData;

      if (!newAccessToken) {
        return {
          success: false,
          error: 'Refresh response did not include a new token',
          shouldReset: true,
        };
      }

      secureStorage.setAuthToken(newAccessToken);
      authService.setupTokenRefresh(newAccessToken);

      if (newRefreshToken) {
        secureStorage.setRefreshToken(newRefreshToken);
      }

      const normalizedUser = persistNormalizedUser(user);

      console.log('Token refreshed successfully');
      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        success: true,
      };
    } catch (error) {
      console.error('Token refresh failed:', error);

      const status = error.response?.status;
      const isNetworkError =
        error.code === 'ECONNABORTED' ||
        error.message?.toLowerCase().includes('timeout') ||
        !error.response;

      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to refresh session';

      const shouldReset =
        !isNetworkError && (status === 400 || status === 401 || status === 403);

      if (shouldReset) {
        secureStorage.clear();
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
          } catch (dispatchError) {
            console.warn(
              'Failed to dispatch tokenExpired event:',
              dispatchError,
            );
          }
        }
      }

      return {
        success: false,
        error: message,
        status,
        shouldReset,
        isNetworkError,
      };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post(
        '/auth/forgot-password',
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
      const response = await api.post(
        '/auth/reset-password',
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
      const response = await api.put('/auth/profile', profileData);
      const payload = response.data?.data || response.data || {};
      const normalizedUser = persistNormalizedUser(payload.user || payload);

      return {
        success: true,
        user: normalizedUser || payload.user || payload,
        message: payload.message,
      };

    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data?.data || response.data || { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      const payload = response.data?.data || response.data || {};
      const normalizedUser = persistNormalizedUser(payload.user || payload);
      return {
        success: true,
        user: normalizedUser || payload.user || payload,
        message: payload.message,
      };
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  resendVerificationEmail: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification-email', {
        email,
      });
      return response.data?.data || response.data || { success: true };
    } catch (error) {
      console.error('Resend verification email error:', error);
      throw error;
    }
  },

  setupMFA: async () => {
    try {
      const response = await api.post('/auth/mfa/setup');
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  },

  verifyMFA: async (code) => {
    try {
      const response = await api.post('/auth/mfa/verify', { code });
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('MFA verify error:', error);
      throw error;
    }
  },

  disableMFA: async (password, code) => {
    try {
      const response = await api.post('/auth/mfa/disable', {
        password,
        code,
      });
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('Disable MFA error:', error);
      throw error;
    }
  },

  setupTokenRefresh: (token) => {
    if (!token || typeof window === 'undefined' || !window.atob) {
      return;
    }

    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = window.atob(normalized);
      const { exp } = JSON.parse(decoded);

      if (!exp) {
        return;
      }

      const expiresAt = exp * 1000;
      const refreshDelay = Math.max(expiresAt - Date.now() - 60_000, 30_000);

      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }

      tokenRefreshTimeout = window.setTimeout(async () => {
        try {
          await authService.refreshToken();
        } catch (error) {
          console.warn('Automatic token refresh failed:', error.message);
        }
      }, refreshDelay);
    } catch (error) {
      console.warn('Failed to schedule token refresh:', error.message);
    }
  },

};

export default authService;
