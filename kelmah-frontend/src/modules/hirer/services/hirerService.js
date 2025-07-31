/**
 * Hirer Service
 *
 * Service layer for hirer-related operations with proper service routing
 * and comprehensive mock data fallbacks.
 */

import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service clients
const userServiceClient = axios.create({
  baseURL: SERVICES.USER_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
[],
      },
    ],
    completed: [],
  },

  savedWorkers: [],
};

export const hirerService = {
  // Profile Management
  async getProfile() {
    try {
      const response = await userServiceClient.get('/api/users/me/profile');
      return response.data;
    } catch (error) {
      console.warn(
        'User service unavailable for hirer profile, using mock data:',
        error.message,
      );
      return mockHirerData.profile;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await userServiceClient.put(
        '/api/users/me/profile',
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
      const response = await jobServiceClient.get('/api/jobs/my-jobs', {
        params: { status, role: 'hirer' },
      });
      return response.data;
    } catch (error) {
      console.warn(
        `Job service unavailable for hirer jobs (${status}), using mock data:`,
        error.message,
      );
      return mockHirerData.jobs[];

      return {
        workers: mockWorkers,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockWorkers.length,
        },
      };
    } catch (error) {
      console.warn(
        'Worker search unavailable, using mock data:',
        error.message,
      );
      return {
        workers: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      };
    }
  },

  async getSavedWorkers() {
    try {
      // Mock saved workers for now
      return mockHirerData.savedWorkers;
    } catch (error) {
      console.warn(
        'Saved workers unavailable, using mock data:',
        error.message,
      );
      return mockHirerData.savedWorkers;
    }
  },

  async saveWorker(workerId) {
    try {
      // Mock save worker for now
      return { workerId, message: 'Worker saved successfully (mock)' };
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  async unsaveWorker(workerId) {
    try {
      // Mock unsave worker for now
      return { workerId, message: 'Worker unsaved successfully (mock)' };
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
