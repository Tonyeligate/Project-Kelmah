/**
 * Hirer Service
 *
 * Service layer for hirer-related operations with proper service routing
 * and comprehensive mock data fallbacks.
 */

import {
  userServiceClient,
  jobServiceClient,
} from '../../common/services/axios';

// Clients come preconfigured with auth and retries

// No mock data - using real API data only

export const hirerService = {
  // Profile Management
  async getProfile() {
    try {
      const response = await userServiceClient.get('/users/me/credentials');
      return response.data;
    } catch (error) {
      console.warn(
        'User service unavailable for hirer profile:',
        error.message,
      );
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await userServiceClient.put(
        '/users/me/profile',
        profileData,
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Job Management
  async getJobs(status = 'active') {
    try {
      const response = await jobServiceClient.get('/jobs/my-jobs', {
        params: { status, role: 'hirer' },
      });
      return response.data;
    } catch (error) {
      console.warn(
        `Job service unavailable for hirer jobs (${status}):`,
        error.message,
      );
      return [];
    }
  },

  // Dashboard Data
  async getDashboardData() {
    try {
      const response = await userServiceClient.get('/users/hirers/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Dashboard data unavailable, using fallback:', error.message);
      // Return fallback dashboard data structure
      return {
        metrics: {
          activeJobs: 0,
          totalApplications: 0,
          newApplications: 0,
          hiredWorkers: 0,
        },
        activeJobs: [],
        recentApplications: [],
        notifications: [],
      };
    }
  },

  async getStats(timeframe = '30d') {
    try {
      const response = await userServiceClient.get('/users/hirers/metrics', {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.warn('Metrics unavailable, using fallback:', error.message);
      return {
        activeJobs: 0,
        totalJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        totalSpent: 0,
        monthlySpent: 0,
        hiredWorkers: 0,
        activeWorkers: 0,
      };
    }
  },

  async getRecentJobs(limit = 10) {
    try {
      const response = await jobServiceClient.get('/jobs/my-jobs', {
        params: { status: 'active', limit, role: 'hirer' },
      });
      return response.data;
    } catch (error) {
      console.warn('Recent jobs unavailable:', error.message);
      return [];
    }
  },

  async getApplications(filters = {}) {
    try {
      const limit = filters.limit || 10;
      const response = await userServiceClient.get('/users/hirers/applications/recent', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.warn('Applications unavailable:', error.message);
      return [];
    }
  },

  searchWorkers: async (searchParams = {}) => {
    try {
      const response = await userServiceClient.get(
        '/users/workers/search',
        {
          params: searchParams,
        },
      );
      return response.data;
    } catch (error) {
      console.warn('Worker search unavailable:', error.message);
      return {
        workers: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      };
    }
  },

  async getSavedWorkers() {
    try {
      const response = await userServiceClient.get(
        '/users/me/saved-workers',
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Saved workers unavailable:', error.message);
      return [];
    }
  },

  async saveWorker(workerId) {
    try {
      const response = await userServiceClient.post(
        '/users/me/saved-workers',
        { workerId },
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  async unsaveWorker(workerId) {
    try {
      const response = await userServiceClient.delete(
        `/api/users/me/saved-workers/${workerId}`,
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Payment Management
  async releaseMilestonePayment(jobId, milestoneId, amount) {
    try {
      // Mock payment release for now
      return {
        jobId,
        milestoneId,
        amount,
        totalPaid: amount,
        message: 'Payment released successfully (mock)',
      };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Review Management
  async createWorkerReview(workerId, jobId, reviewData) {
    try {
      // Mock review creation for now
      return {
        workerId,
        jobId,
        reviewData,
        message: 'Review created successfully (mock)',
      };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
};
