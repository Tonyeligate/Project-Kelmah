/**
 * Admin Service
 * 
 * Service layer for admin-related operations including user management,
 * system monitoring, and administrative tasks.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for admin operations
const adminClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
adminClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const adminService = {
  // User Management
  async getUsers(page = 1, limit = 10, search = '') {
    try {
      const params = { page, limit };
      if (search) {
        const response = await adminClient.get('/users/search', { 
          params: { ...params, q: search } 
        });
        return response.data;
      }
      const response = await adminClient.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUserById(userId) {
    try {
      const response = await adminClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await adminClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await adminClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await adminClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // User Status Management
  async toggleUserStatus(userId, status) {
    try {
      const response = await adminClient.put(`/users/${userId}`, { 
        isActive: status 
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  async verifyUser(userId, verified = true) {
    try {
      const response = await adminClient.put(`/users/${userId}`, { 
        isEmailVerified: verified 
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  },

  // Bulk Operations
  async bulkUpdateUsers(userIds, updateData) {
    try {
      const promises = userIds.map(id => this.updateUser(id, updateData));
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw error;
    }
  },

  async bulkDeleteUsers(userIds) {
    try {
      const promises = userIds.map(id => this.deleteUser(id));
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      throw error;
    }
  },

  // System Analytics (placeholder for future implementation)
  async getSystemStats() {
    try {
      // This would connect to analytics endpoints when available
      const [usersResponse] = await Promise.all([
        adminClient.get('/users?limit=1'), // Get total count from pagination
      ]);
      
      return {
        totalUsers: usersResponse.data.pagination?.total || 0,
        activeUsers: 0, // Placeholder
        newUsersThisMonth: 0, // Placeholder
        systemHealth: 'good' // Placeholder
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        systemHealth: 'unknown'
      };
    }
  }
};

export default adminService;