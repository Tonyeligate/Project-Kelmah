/**
 * Authentication Service
 *
 * Centralized authentication service that handles all auth-related API calls
 * using the new environment configuration system.
 */

import { AUTH_CONFIG, API_ENDPOINTS } from '../../../config/environment';
import { authServiceClient } from '../../common/services/axios';
import { secureStorage } from '../../../utils/secureStorage';
import { normalizeUser } from '../../../utils/userUtils';

// Use centralized authServiceClient with standard interceptors

// Response interceptors are handled by the centralized service client configuration
// in modules/common/services/axios.js

// Token refresh tracking
let tokenRefreshTimeout = null;

const { AUTH: AUTH_ENDPOINTS } = API_ENDPOINTS;

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

const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await authServiceClient.post(
        AUTH_ENDPOINTS.LOGIN,
        credentials,
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
      const response = await authServiceClient.post(
        AUTH_ENDPOINTS.REGISTER,
        userData,
      );
      const { token, user } = response.data.data || response.data;
      const normalizedUser = persistNormalizedUser(user);

      if (token) {
        secureStorage.setAuthToken(token);
      }

      return { token, user: normalizedUser || user, success: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Verify authentication
  verifyAuth: async () => {
    try {
      const response = await authServiceClient.get(AUTH_ENDPOINTS.VERIFY);
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

      await authServiceClient.post(AUTH_ENDPOINTS.LOGOUT, logoutData);
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
      const response = await authServiceClient.post(AUTH_ENDPOINTS.REFRESH, {
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
      const response = await authServiceClient.post(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
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
        AUTH_ENDPOINTS.RESET_PASSWORD,
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
        AUTH_ENDPOINTS.PROFILE,
        profileData,
      );
      const { user } = response.data.data || response.data;
      const normalizedUser = persistNormalizedUser(user);

      if (normalizedUser) {
        return { user: normalizedUser, success: true };
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
      const response = await authServiceClient.post(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
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
      const response = await authServiceClient.get(
        AUTH_ENDPOINTS.VERIFY_EMAIL_TOKEN(token),
      );
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
      const response = await authServiceClient.post(
        AUTH_ENDPOINTS.RESEND_VERIFICATION_EMAIL,
        {
          email,
        },
      );
      return {
        success: true,
        message:
          response.data.message || 'Verification email sent successfully',
      };
    } catch (error) {
      console.error('Resend verification email failed:', error);
      throw {
        success: false,
        message:
          error.response?.data?.message || 'Failed to send verification email',
      };
    }
  },

  // MFA Setup (placeholder for future implementation)
  setupMFA: async () => {
    try {
      const response = await authServiceClient.post(AUTH_ENDPOINTS.MFA_SETUP);
      // Expect { success, data: { secret, otpauthUrl, qrCode? } }
      const payload = response.data?.data || response.data;
      return { success: true, ...payload };
    } catch (error) {
      console.error('MFA setup error:', error);
      const message =
        error.response?.data?.message || 'Failed to initialize MFA';
      return { success: false, message };
    }
  },

  // Verify MFA (placeholder for future implementation)
  verifyMFA: async (token) => {
    try {
      const response = await authServiceClient.post(AUTH_ENDPOINTS.MFA_VERIFY, {
        token,
      });
      const payload = response.data?.data || response.data;
      return { success: true, ...payload };
    } catch (error) {
      console.error('MFA verification error:', error);
      const message = error.response?.data?.message || 'Failed to verify MFA';
      return { success: false, message };
    }
  },

  // Disable MFA (placeholder for future implementation)
  disableMFA: async (password, token) => {
    try {
      const response = await authServiceClient.post(
        AUTH_ENDPOINTS.MFA_DISABLE,
        {
          password,
          token,
        },
      );
      const payload = response.data?.data || response.data;
      return { success: true, ...payload };
    } catch (error) {
      console.error('MFA disable error:', error);
      const message = error.response?.data?.message || 'Failed to disable MFA';
      return { success: false, message };
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
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );

      const payload = JSON.parse(jsonPayload);
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // Refresh 5 minutes before expiry, but not less than 1 minute from now
      const refreshTime = Math.max(expiry - 5 * 60 * 1000, now + 1 * 60 * 1000);
      const timeUntilRefresh = refreshTime - now;

      if (timeUntilRefresh > 0) {
        console.log(
          `Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`,
        );

        tokenRefreshTimeout = setTimeout(async () => {
          console.log('Attempting automatic token refresh...');
          const result = await authService.refreshToken();

          if (!result.success) {
            console.warn(
              'Automatic token refresh failed, user may need to re-login',
            );
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
        console.log(
          'No token in secureStorage, checking localStorage fallback...',
        );
        token = secureStorage.getAuthToken();
        const userString = localStorage.getItem('user');

        if (token && userString) {
          try {
            userData = JSON.parse(userString);
            console.log('Found authentication data in localStorage fallback');

            // Sync to secureStorage for future use
            secureStorage.setAuthToken(token);
            userData = persistNormalizedUser(userData) || userData;
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
          const normalized = persistNormalizedUser(userData) || userData;
          return { authenticated: true, user: normalized };
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
            const normalized = persistNormalizedUser(userData) || userData;
            return { authenticated: true, user: normalized };
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

// Note: Response interceptors for token refresh are now handled in the main axios configuration
// (src/modules/common/services/axios.js) to avoid circular dependency issues with the proxy-based authServiceClient

export default authService;
