import api from './axios';

/**
 * Authentication API service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.role - User role (worker or hirer)
   * @returns {Promise} - Promise with registration result
   */
  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response || error);
      throw error;
    }
  }

  /**
   * Log in a user
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise} - Promise with login result
   */
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw error;
    }
  }

  /**
   * Verify a user's email
   * @param {string} token - Verification token
   * @returns {Promise} - Promise with verification result
   */
  async verifyEmail(token) {
    try {
      const response = await api.get(`/api/auth/verify/${token}`);
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error.response || error);
      throw error;
    }
  }

  /**
   * Send a password reset request
   * @param {string} email - User email
   * @returns {Promise} - Promise with reset request result
   */
  async forgotPassword(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error.response || error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} - Promise with reset result
   */
  async resetPassword(token, password) {
    try {
      const response = await api.post(`/api/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error.response || error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} - Promise with new access token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await api.post('/api/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error.response || error);
      throw error;
    }
  }

  /**
   * Log out a user
   * @returns {Promise} - Promise with logout result
   */
  async logout() {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error.response || error);
      throw error;
    }
  }

  /**
   * Verify current authentication status
   * @returns {Promise} - Promise with verification result
   */
  async verifyAuth() {
    try {
      const response = await api.get('/api/auth/verify');
      return response.data;
    } catch (error) {
      console.error('Auth verification error:', error.response || error);
      throw error;
    }
  }
}

export default new AuthService(); 