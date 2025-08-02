import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service client for Job Service
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE, // Now using the correct JOB_SERVICE
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
jobServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Data transformation helpers
const transformJobListItem = (job) => {
  if (!job) return null;

  return {
    id: job.id,
    title: job.title,
    description: job.description?.substring(0, 150) + '...',
    category: job.category,
    subcategory: job.subcategory,
    type: job.type,
    budget: job.budget,
    currency: job.currency,
    status: job.status,
    location: job.location,
    skills: job.skills || [],
  };
};

// Jobs API service - using real backend data only
const jobsApi = {
  /**
   * Get all jobs with filtering and pagination
   */
  async getJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs', { params });
      const jobs = response.data.data || response.data.jobs || [];
      return {
        jobs: jobs.map(transformJobListItem),
        totalPages: response.data.totalPages || 1,
        totalJobs: response.data.totalJobs || jobs.length,
        currentPage: response.data.currentPage || 1,
      };
    } catch (error) {
      console.warn('Job service unavailable for jobs list:', error.message);
      return {
        jobs: [],
        totalPages: 1,
        totalJobs: 0,
        currentPage: 1,
      };
    }
  },

  /**
   * Get a single job by ID
   */
  async getJobById(jobId) {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.warn(`Job service unavailable for job ${jobId}:`, error.message);
      return null;
    }
  },

  /**
   * Search jobs by criteria
   */
  async searchJobs(searchParams) {
    try {
      const response = await jobServiceClient.get('/api/jobs/search', {
        params: searchParams,
      });
      const jobs = response.data.data || response.data.jobs || [];
      return {
        jobs: jobs.map(transformJobListItem),
        totalPages: response.data.totalPages || 1,
        totalJobs: response.data.totalJobs || jobs.length,
        currentPage: response.data.currentPage || 1,
      };
    } catch (error) {
      console.warn('Job service unavailable for job search:', error.message);
      return {
        jobs: [],
        totalPages: 1,
        totalJobs: 0,
        currentPage: 1,
      };
    }
  },

  /**
   * Apply to a job
   */
  async applyToJob(jobId, applicationData) {
    try {
      const response = await jobServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      console.warn(`Job service unavailable for job application ${jobId}:`, error.message);
      throw error;
    }
  },

  /**
   * Get job categories
   */
  async getJobCategories() {
    try {
      const response = await jobServiceClient.get('/api/jobs/categories');
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for job categories:', error.message);
      return [];
    }
  }
};

export default jobsApi;
