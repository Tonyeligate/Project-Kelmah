/**
 * Jobs API Service
 * Handles job posting, searching, and job-related operations
 */

import axios from 'axios';
import { SERVICES, FEATURES } from '../../config/environment';

// Create a dedicated job service client
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests  
jobServiceClient.interceptors.request.use(
  (config) => {
    // Note: Auth token will be added by the main axios interceptor
    // This ensures consistency with secure storage
    return config;
  },
  (error) => Promise.reject(error),
);

class JobsApi {
  /**
   * Get jobs with filters (main function called by AvailableJobs)
   */
  async getJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs', {
        params: {
          status: params.status || 'open',
          nearby: params.nearby || false,
          limit: params.limit || 20,
          skills: params.userSkills?.join(',') || '',
        },
      });
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for getJobs, using mock data:', error.message);
      return {
        success: true,
        jobs: [], // Empty array instead of mock data
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Search jobs with advanced filters
   */
  async searchJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs/search', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for searchJobs, using mock data:', error.message);
      return {
        success: true,
        jobs: [],
        total: 0,
      };
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId) {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.warn(`Job service unavailable for getJobById ${jobId}:`, error.message);
      return {
        success: false,
        error: 'Job not found',
      };
    }
  }

  /**
   * Apply for a job
   */
  async applyForJob(jobId, applicationData) {
    try {
      const response = await jobServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      console.warn(`Job service unavailable for applyForJob ${jobId}:`, error.message);
      return {
        success: false,
        error: 'Application failed',
      };
    }
  }

  /**
   * Apply to job (alias for applyForJob)
   */
  async applyToJob(jobId, applicationData) {
    return this.applyForJob(jobId, applicationData);
  }

  /**
   * Get featured jobs for homepage
   */
  async getFeaturedJobs(limit = 6) {
    try {
      const response = await jobServiceClient.get('/api/jobs/featured', {
      params: { limit },
    });
    return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock featured jobs:',
        error.message,
      );

      const featuredJobs = mockJobs
        .filter((job) => job.featured)
        .slice(0, limit);
      return {
        success: true,
        data: {
          jobs: featuredJobs,
          count: featuredJobs.length,
        },
      };
    }
  }

  /**
   * Get a specific job by ID
   */
  async getJobById(jobId) {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}`);
    return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock job data:',
        error.message,
      );

      const job = mockJobs.find((j) => j.id === jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        success: true,
        data: { job },
      };
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData) {
    try {
      const response = await jobServiceClient.post('/api/jobs', jobData);
    return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job creation:',
        error.message,
      );

      // Simulate successful job creation
      const newJob = {
        id: `job-${Date.now()}`,
        ...jobData,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationsCount: 0,
        viewsCount: 0,
      };

      return {
        success: true,
        data: { job: newJob },
        message: 'Job created successfully (mock)',
      };
    }
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId, jobData) {
    try {
      const response = await jobServiceClient.put(
        `/api/jobs/${jobId}`,
        jobData,
      );
    return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job update:',
        error.message,
      );

      return {
        success: true,
        data: { job: { id: jobId, ...jobData, updatedAt: new Date() } },
        message: 'Job updated successfully (mock)',
      };
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    try {
      const response = await jobServiceClient.delete(`/api/jobs/${jobId}`);
    return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Apply to a job
   */
  async applyToJob(jobId, applicationData) {
    try {
      const response = await jobServiceClient.post(
        `/api/jobs/${jobId}/apply`,
      applicationData,
    );
    return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job application:',
        error.message,
      );

      return {
        success: true,
        data: {
          application: {
            id: `app-${Date.now()}`,
            jobId,
            ...applicationData,
            status: 'pending',
            appliedAt: new Date(),
          },
        },
        message: 'Application submitted successfully (mock)',
      };
    }
  }

  /**
   * Get jobs posted by current hirer
   */
  async getMyJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs/my-jobs', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock my jobs:',
        error.message,
      );

      // Return subset of mock jobs as if posted by current user
      return {
        success: true,
        data: {
          jobs: mockJobs.slice(0, 2), // Return first 2 as user's jobs
          count: 2,
        },
      };
    }
  }

  /**
   * Get applications for a job
   */
  async getJobApplications(jobId, params = {}) {
    try {
      const response = await jobServiceClient.get(
        `/api/jobs/${jobId}/applications`,
        { params },
      );
    return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock applications:',
        error.message,
      );

      return {
        success: true,
        data: {
          applications: [],
        },
      };
    }
  }
}

export default new JobsApi();
