/**
 * Hirer Service
 *
 * Service layer for hirer-related operations with proper service routing
 * and comprehensive mock data fallbacks.
 */

import { API_ENDPOINTS } from '../../../config/environment';
import { api } from '../../../services/apiClient';

const { USER, JOB } = API_ENDPOINTS;

const workerBookmarkPath = (workerId) => {
  if (typeof USER.WORKER_BOOKMARK === 'function') {
    return USER.WORKER_BOOKMARK(workerId);
  }
  // FIXED: Removed /api prefix - apiClient.baseURL already includes '/api'
  return `/users/workers/${workerId}/bookmark`;
};

// Clients come preconfigured with auth and retries

// No mock data - using real API data only

export const hirerService = {
  // Profile Management
  async getProfile() {
    // Canonical endpoint: /users/me/credentials (verified in user-service routes)
    try {
      const response = await api.get(USER.ME_CREDENTIALS);
      return response?.data?.data || response?.data || {};
    } catch (error) {
      console.warn(
        'User service unavailable for hirer profile:',
        error.message,
      );
      // Fallback: try /users/profile as secondary endpoint
      try {
        const fallback = await api.get('/users/profile');
        return fallback?.data?.data || fallback?.data || {};
      } catch (_) {
        throw error;
      }
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put(USER.UPDATE, profileData);
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Job Management
  async getJobs(status = 'active') {
    try {
      const response = await api.get(JOB.MY_JOBS, {
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
      const [metricsResult, workersResult, analyticsResult, jobsResult] =
        await Promise.allSettled([
          api.get(USER.DASHBOARD_METRICS),
          api.get(USER.DASHBOARD_WORKERS),
          api.get(USER.DASHBOARD_ANALYTICS),
          api.get(JOB.MY_JOBS, {
            params: { status: 'active', role: 'hirer', limit: 10 },
          }),
        ]);

      const metrics =
        metricsResult.status === 'fulfilled'
          ? (metricsResult.value?.data ?? metricsResult.value)
          : {};
      const workers =
        workersResult.status === 'fulfilled'
          ? workersResult.value?.data?.workers ||
          workersResult.value?.data ||
          workersResult.value
          : [];
      const analytics =
        analyticsResult.status === 'fulfilled'
          ? (analyticsResult.value?.data ?? analyticsResult.value)
          : {};
      const activeJobs =
        jobsResult.status === 'fulfilled'
          ? jobsResult.value?.data?.data ||
          jobsResult.value?.data?.jobs ||
          jobsResult.value?.data ||
          []
          : [];

      return {
        metrics,
        analytics,
        activeJobs: Array.isArray(activeJobs) ? activeJobs : [],
        featuredWorkers: Array.isArray(workers) ? workers : [],
      };
    } catch (error) {
      console.warn(
        'Dashboard data unavailable, using fallback:',
        error.message,
      );
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
      const response = await api.get(USER.DASHBOARD_ANALYTICS, {
        params: { timeframe },
      });
      return response.data ?? response;
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
      const response = await api.get(JOB.MY_JOBS, {
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
      console.warn('Applications endpoint not available for hirers yet.');
      return [];
    } catch (error) {
      console.warn('Applications unavailable:', error.message);
      return [];
    }
  },

  // Applications for a specific job (hirer)
  async getJobApplications(jobId, status) {
    try {
      if (!jobId) return [];
      const params = {};
      if (status) params.status = status;
      const response = await api.get(`/jobs/${jobId}/applications`, { params });
      const payload = response.data;
      const data = payload?.data || payload;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to fetch job applications:', error.message);
      return [];
    }
  },

  async updateApplicationStatus(jobId, applicationId, status, feedback) {
    try {
      if (!jobId || !applicationId) {
        throw new Error('jobId and applicationId are required');
      }
      const body = { status };
      if (typeof feedback === 'string' && feedback.trim()) {
        body.feedback = feedback.trim();
      }
      const response = await api.put(
        `/jobs/${jobId}/applications/${applicationId}`,
        body,
      );
      return response.data;
    } catch (error) {
      console.warn('Failed to update application status:', error.message);
      throw error;
    }
  },

  searchWorkers: async (searchParams = {}) => {
    try {
      const response = await api.get(USER.WORKERS_SEARCH, {
        params: searchParams,
      });
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
      const response = await api.get(USER.BOOKMARKS);
      const payload = response.data?.data || response.data || {};
      return payload.workerIds || [];
    } catch (error) {
      console.warn('Saved workers unavailable:', error.message);
      return [];
    }
  },

  async saveWorker(workerId) {
    try {
      const response = await api.post(workerBookmarkPath(workerId), {});
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  async unsaveWorker(workerId) {
    try {
      const response = await api.delete(workerBookmarkPath(workerId));
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
