/**
 * Authentication Service
 *
 * Centralized authentication service that handles all auth-related API calls
 * using the new environment configuration system.
 */

import { api } from '../../../services/apiClient';
import { secureStorage } from '../../../utils/secureStorage';
import { normalizeUser } from '../../../utils/userUtils';

const __DEV__ = import.meta.env.DEV;
const devLog = (...args) => { if (__DEV__) console.log(...args); };

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
      devLog(`[Auth] Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
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

      devLog(
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
      if (import.meta.env.DEV) console.error('Login failed:', error);

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
      if (import.meta.env.DEV) console.error('Registration error:', error);
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
      if (import.meta.env.DEV) console.warn('Auth verification failed:', error.message);
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
      if (import.meta.env.DEV) console.warn('Logout API call failed:', error.message);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear token refresh timeout
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
        tokenRefreshTimeout = null;
      }

      // Always clean up secure storage
      secureStorage.clear();
      devLog('Logout completed - all auth data cleared');
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

  // Refresh token — uses shared lock with apiClient interceptor to prevent races
  refreshToken: async () => {
    const { default: apiClient } = await import('../../../services/apiClient');

    // Reuse an in-flight refresh from the axios interceptor if one exists
    if (apiClient._refreshPromise) {
      try {
        const token = await apiClient._refreshPromise;
        return { token, success: true };
      } catch (e) {
        return { success: false, error: e.message, shouldReset: true };
      }
    }

    const refreshToken = secureStorage.getRefreshToken();

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
        shouldReset: true,
      };
    }

    // Set the shared lock so the interceptor reuses our in-flight call
    apiClient._refreshPromise = (async () => {
      const response = await api.post('/auth/refresh-token', { refreshToken });
      const responseData = response.data.data || response.data;
      const { token: newAccessToken } = responseData;
      if (!newAccessToken) throw new Error('Refresh response did not include a new token');
      return newAccessToken;
    })().finally(() => { apiClient._refreshPromise = null; });

    try {
      const newAccessToken = await apiClient._refreshPromise;

      secureStorage.setAuthToken(newAccessToken);
      authService.setupTokenRefresh(newAccessToken);

      // Re-read refreshToken from response to handle rotation
      // (the shared promise only returns accessToken, re-fetch full data from the api response)
      const storedRefresh = secureStorage.getRefreshToken();

      devLog('Token refreshed successfully');
      return {
        token: newAccessToken,
        refreshToken: storedRefresh,
        success: true,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Token refresh failed:', error);

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
            if (import.meta.env.DEV) console.warn(
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
      if (import.meta.env.DEV) console.error('Forgot password error:', error);
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
      if (import.meta.env.DEV) console.error('Reset password error:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      // Profile updates go through user-service, not auth-service
      const response = await api.put('/users/profile', profileData);
      const payload = response.data?.data || response.data || {};
      const normalizedUser = persistNormalizedUser(payload.user || payload);

      return {
        success: true,
        user: normalizedUser || payload.user || payload,
        message: payload.message,
      };

    } catch (error) {
      if (import.meta.env.DEV) console.error('Profile update error:', error);
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
      if (import.meta.env.DEV) console.error('Change password error:', error);
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      const payload = response.data?.data || response.data || {};
      const normalizedUser = persistNormalizedUser(payload.user || payload);

      // Backend may return the access token as `accessToken` or `token`
      const accessToken = payload.accessToken || payload.token;
      const refreshToken = payload.refreshToken;
      if (accessToken) {
        secureStorage.setAuthToken(accessToken);
        authService.setupTokenRefresh(accessToken);
      }
      if (refreshToken) {
        secureStorage.setRefreshToken(refreshToken);
      }

      return {
        success: true,
        user: normalizedUser || payload.user || payload,
        token: accessToken || null,
        message: payload.message,
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Verify email error:', error);
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
      if (import.meta.env.DEV) console.error('Resend verification email error:', error);
      throw error;
    }
  },

  setupMFA: async () => {
    try {
      const response = await api.post('/auth/mfa/setup');
      return response.data?.data || response.data || {};
    } catch (error) {
      if (import.meta.env.DEV) console.error('MFA setup error:', error);
      throw error;
    }
  },

  verifyMFA: async (code) => {
    try {
      const response = await api.post('/auth/mfa/verify', { code });
      return response.data?.data || response.data || {};
    } catch (error) {
      if (import.meta.env.DEV) console.error('MFA verify error:', error);
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
      if (import.meta.env.DEV) console.error('Disable MFA error:', error);
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
          if (import.meta.env.DEV) console.warn('Automatic token refresh failed:', error.message);
        }
      }, refreshDelay);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to schedule token refresh:', error.message);
    }
  },

};

export default authService;
