import axiosInstance from '../../common/services/axios';
import { API_ENDPOINTS } from '../../../config/services';

// Mock data for development mode when backend is not available
const DEV_MODE_USER = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  firstName: 'Development',
  lastName: 'User',
  name: 'Development User',
  role: 'worker',
  skills: ['Carpentry', 'Plumbing', 'Electrical'],
  rating: 4.8,
  profileImage: null,
};

const DEV_MODE_USERS = [
  { ...DEV_MODE_USER },
  {
    id: 'hirer-user-456',
    email: 'hirer@example.com',
    firstName: 'Hirer',
    lastName: 'Example',
    name: 'Hirer Example',
    role: 'hirer',
  },
  {
    id: 'worker-user-789',
    email: 'worker2@example.com',
    firstName: 'Another',
    lastName: 'Worker',
    name: 'Another Worker',
    role: 'worker',
  },
];

// Toggle mock mode explicitly via env (default false)
const USE_MOCKS = process.env.REACT_APP_USE_MOCKS === 'true';

const authService = {
  // Login user
  login: async (credentials) => {
    // Use mock only when explicitly enabled
    if (USE_MOCKS) {
      console.log('Mock mode: Returning fake login data');
      return {
        user: DEV_MODE_USER,
        token: 'dev-mode-fake-token-12345',
      };
    }

    try {
      // Convert credentials to plain object if needed
      const loginData =
        typeof credentials === 'string' ? { email: credentials } : credentials;

      // Create a config object with explicit headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Use stringified JSON for the request
      const response = await axiosInstance.post(
        `/api/auth/login`,
        loginData,
        config,
      );

      // Handle both API response structures
      // API Gateway returns: { success: true, data: { token, user } }
      // But some places expect: { token, user }
      const responseData = response.data;

      console.log('API Login Response:', responseData);

      if (responseData.data && responseData.success) {
        console.log(
          'API Gateway format detected, extracting data:',
          responseData.data,
        );
        return responseData.data;
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    if (USE_MOCKS) {
      console.log('Mock mode: Returning fake registration data');
      return {
        message: 'Registration successful',
        user: { ...DEV_MODE_USER, ...userData },
        token: 'dev-mode-fake-token-12345',
      };
    }

    try {
      console.log('Registering user with data:', userData);
      
      const config = {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      };

      // Use stringified JSON for the request
              const response = await axiosInstance.post(
          '/auth/register', // Keep simple path for now - services config will be used later
          userData,
          config,
        );

      // Handle both API response structures like we did for login
      const responseData = response.data;

      if (responseData.data && responseData.success) {
        console.log('API Gateway format detected, extracting data');
        return responseData.data;
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    if (USE_MOCKS) {
      console.log('Mock mode: logout');
      return { success: true };
    }

    try {
      const response = await axiosInstance.post(`/api/auth/logout`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    if (USE_MOCKS) {
      console.log('Development mode: Using mock user data');
      return DEV_MODE_USER;
    }
    try {
      const response = await axiosInstance.get(`/api/auth/me`);
      const responseData = response.data;
      // Unwrap { status, data: { user } }
      if (responseData.data && responseData.data.user) {
        return responseData.data.user;
      }
      // Fallback to raw data if shape differs
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Verify auth status
  verifyAuth: async () => {
    if (USE_MOCKS) {
      console.log('Development mode: Using mock auth verification');
      return { isValid: true };
    }

    try {
      const response = await axiosInstance.get(`/api/auth/verify`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    if (USE_MOCKS) {
      console.log('Development mode: Using mock password reset request');
      return { message: 'Password reset email sent successfully' };
    }

    const response = await axiosInstance.post(`/api/auth/forgot-password`, {
      email,
    });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    if (USE_MOCKS) {
      console.log('Development mode: Using mock password reset');
      return { message: 'Password reset successful' };
    }

    const response = await axiosInstance.post(`/api/auth/reset-password`, {
      token,
      newPassword,
    });
    return response.data;
  },

  getUsers: async (params = {}) => {
    if (USE_MOCKS) {
      console.log(
        'Development mode: Using mock users data with params:',
        params,
      );
      let users = DEV_MODE_USERS;
      if (params.role) {
        users = users.filter((user) => user.role === params.role);
      }
      return users.slice(0, params.limit || users.length);
    }

    try {
      const response = await axiosInstance.get('/api/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    if (USE_MOCKS) {
      console.log('Development mode: Using mock profile update');
      return {
        message: 'Profile updated successfully',
        user: { ...DEV_MODE_USER, ...profileData },
      };
    }

    const response = await axiosInstance.put(`/api/users/profile`, profileData);
    return response.data;
  },

  // MFA service methods
  mfaSetup: async () => {
    const response = await axiosInstance.post(`/api/auth/mfa/setup`);
    const responseData = response.data;
    return responseData.data || responseData;
  },
  verifyTwoFactor: async (token) => {
    const response = await axiosInstance.post(`/api/auth/mfa/verify`, {
      token,
    });
    return response.data;
  },
  // Disable two-factor authentication with password and token
  disableMfa: async ({ password, token }) => {
    const response = await axiosInstance.post(`/api/auth/mfa/disable`, {
      password,
      token,
    });
    return response.data;
  },
};

export default authService;
