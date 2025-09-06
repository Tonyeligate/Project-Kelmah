/**
 * Authentication API Service
 * Handles user authentication, registration, and related operations
 */

import apiClient from '../index';
import {
  JWT_LOCAL_STORAGE_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
} from '../../config/config';

class AuthApi {
  /**
   * Login user with credentials
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Auth data with token and user info
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);

    if (response.data.token) {
      localStorage.setItem(JWT_LOCAL_STORAGE_KEY, response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
    }

    return response.data;
  }

  /**
   * Register a new user
   * @param {Object} userData - User data for registration
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.userType - Type of user ('hirer' or 'worker')
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);

    if (response.data.token) {
      localStorage.setItem(JWT_LOCAL_STORAGE_KEY, response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
    }

    return response.data;
  }

  /**
   * Log out current user
   */
  logout() {
    localStorage.removeItem(JWT_LOCAL_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  /**
   * Verify current auth token
   * @returns {Promise<Object>} User data if token is valid
   */
  async verifyToken() {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  }

  /**
   * Request password reset
   * @param {Object} data - Reset request data
   * @param {string} data.email - User email
   * @returns {Promise<Object>} Reset request response
   */
  async requestPasswordReset(data) {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  }

  /**
   * Reset password with token
   * @param {Object} data - Password reset data
   * @param {string} data.token - Reset token
   * @param {string} data.password - New password
   * @returns {Promise<Object>} Reset response
   */
  async resetPassword(data) {
    const response = await apiClient.post(
      `/auth/reset-password/${data.token}`,
      { password: data.password },
    );
    return response.data;
  }

  /**
   * Change password for logged in user
   * @param {Object} data - Password change data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @returns {Promise<Object>} Change password response
   */
  async changePassword(data) {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  /**
   * Update security settings
   * @param {Object} settings - Security settings
   * @returns {Promise<Object>} Updated security settings
   */
  async updateSecuritySettings(settings) {
    const response = await apiClient.put('/auth/security', settings);
    return response.data;
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Verification response
   */
  async verifyEmail(token) {
    const response = await apiClient.get(`/auth/verify/${token}`);
    return response.data;
  }

  /**
   * Resend verification email
   * @param {Object} data - Email data
   * @param {string} data.email - User email
   * @returns {Promise<Object>} Resend response
   */
  async resendVerificationEmail(data) {
    const response = await apiClient.post('/auth/resend-verification', data);
    return response.data;
  }
}

export default new AuthApi();
