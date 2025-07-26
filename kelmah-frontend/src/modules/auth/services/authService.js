/**
 * Authentication Service
 * 
 * Centralized authentication service that handles all auth-related API calls
 * using the new environment configuration system.
 */

import axiosInstance from '../../common/services/axios';
import { API_ENDPOINTS, AUTH_CONFIG, FEATURES } from '../../../config/environment';

// Mock data for development when backend is unavailable
const MOCK_USER = {
  id: 'mock-user-123',
  email: 'demo@kelmah.com',
  firstName: 'Demo',
  lastName: 'User',
  name: 'Demo User',
  role: 'worker',
  skills: ['Carpentry', 'Plumbing', 'Electrical'],
  rating: 4.8,
  profileImage: null,
  isEmailVerified: true,
  isActive: true,
  createdAt: new Date().toISOString()
};

const MOCK_RESPONSE_DELAY = FEATURES.mockDelay;

// Helper function to simulate API delay in development
const mockApiCall = async (data) => {
  if (FEATURES.useMocks && MOCK_RESPONSE_DELAY > 0) {
    await new Promise(resolve => setTimeout(resolve, MOCK_RESPONSE_DELAY));
  }
  return data;
};

/**
 * Authentication Service Class
 */
class AuthService {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize the auth service
   */
  init() {
    if (this.isInitialized) return;
    
    // Set up axios interceptors for auth
    this.setupInterceptors();
    this.isInitialized = true;
    
    console.log('🔐 Auth Service initialized with endpoints:', {
      login: API_ENDPOINTS.AUTH.LOGIN,
      register: API_ENDPOINTS.AUTH.REGISTER,
      useMocks: FEATURES.useMocks
    });
  }

  /**
   * Set up axios interceptors for automatic token handling
   */
  setupInterceptors() {
    // Request interceptor to add auth token
    axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = this.getStoredRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const newToken = response.token || response.accessToken;
              
              this.setStoredToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              return axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.clearStorage();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Storage helper methods
   */
  getStoredToken() {
    return localStorage.getItem(AUTH_CONFIG.tokenKey);
  }

  getStoredRefreshToken() {
    return localStorage.getItem(AUTH_CONFIG.refreshTokenKey);
  }

  getStoredUser() {
    const user = localStorage.getItem(AUTH_CONFIG.userKey);
    return user ? JSON.parse(user) : null;
  }

  setStoredToken(token) {
    localStorage.setItem(AUTH_CONFIG.tokenKey, token);
  }

  setStoredRefreshToken(token) {
    localStorage.setItem(AUTH_CONFIG.refreshTokenKey, token);
  }

  setStoredUser(user) {
    localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
  }

  clearStorage() {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
    localStorage.removeItem(AUTH_CONFIG.userKey);
  }

  /**
   * User Authentication Methods
   */

  /**
   * Login user
   */
  async login(credentials) {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock login with:', credentials);
      await mockApiCall();
      return {
        success: true,
        data: {
          token: 'mock-jwt-token-12345',
          refreshToken: 'mock-refresh-token-67890',
          user: MOCK_USER
        }
      };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      // Handle different response structures
      const data = response.data.data || response.data;
      
      if (data.token && data.user) {
        this.setStoredToken(data.token);
        this.setStoredUser(data.user);
        
        if (data.refreshToken) {
          this.setStoredRefreshToken(data.refreshToken);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock registration with:', userData);
      await mockApiCall();
      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          user: { ...MOCK_USER, ...userData }
        }
      };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Logout user
   */
  async logout() {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock logout');
      await mockApiCall();
      this.clearStorage();
      return { success: true, message: 'Logged out successfully' };
    }

    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
      this.clearStorage();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      this.clearStorage();
      console.warn('Logout API error (cleared local storage anyway):', error);
      return { success: true, message: 'Logged out successfully' };
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser() {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock getCurrentUser');
      await mockApiCall();
      return MOCK_USER;
    }

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
      const userData = response.data.data?.user || response.data.user || response.data;
      
      if (userData) {
        this.setStoredUser(userData);
      }
      
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Verify authentication token
   */
  async verifyAuth() {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock verifyAuth');
      await mockApiCall();
      return { valid: true, user: MOCK_USER };
    }

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.AUTH.VERIFY);
      return response.data;
    } catch (error) {
      console.error('Auth verification error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken
      });
      
      const data = response.data.data || response.data;
      
      if (data.token) {
        this.setStoredToken(data.token);
      }
      
      if (data.refreshToken) {
        this.setStoredRefreshToken(data.refreshToken);
      }
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearStorage();
      throw this.handleApiError(error);
    }
  }

  /**
   * Password Management Methods
   */

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock password reset request for:', email);
      await mockApiCall();
      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock password reset');
      await mockApiCall();
      return {
        success: true,
        message: 'Password reset successfully'
      };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Multi-Factor Authentication Methods
   */

  /**
   * Setup MFA
   */
  async setupMFA() {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock MFA setup');
      await mockApiCall();
      return {
        success: true,
        qrCode: 'data:image/png;base64,mock-qr-code',
        secret: 'MOCK-SECRET-KEY',
        backupCodes: ['123456', '789012']
      };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.MFA_SETUP);
      return response.data.data || response.data;
    } catch (error) {
      console.error('MFA setup error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(token) {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock MFA verification');
      await mockApiCall();
      return { success: true, verified: true };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.MFA_VERIFY, { token });
    return response.data;
    } catch (error) {
      console.error('MFA verification error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Disable MFA
   */
  async disableMFA(password, token) {
    if (FEATURES.useMocks) {
      console.log('🧪 Mock MFA disable');
      await mockApiCall();
      return { success: true, message: 'MFA disabled successfully' };
    }

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.MFA_DISABLE, {
      password,
        token
    });
    return response.data;
    } catch (error) {
      console.error('MFA disable error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.getUserRole() === role;
  }

  /**
   * Handle API errors consistently
   */
  handleApiError(error) {
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'An unexpected error occurred';

    const status = error.response?.status || 500;
    
    return {
      message,
      status,
      errors: error.response?.data?.errors || null
    };
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
