import { jobServiceClient } from '../../common/services/axios';

// Use centralized jobServiceClient with auth/retry interceptors

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
      // No mock data fallback; return empty results to reflect real state
      return {
        jobs: [],
        totalPages: 1,
        totalJobs: 0,
        currentPage: 1,
      };
    }
  },

  /**
   * Create a job (hirer)
   */
  async createJob(jobData) {
    const response = await jobServiceClient.post('/api/jobs', jobData);
    return response.data?.data || response.data;
  },

  /**
   * Saved jobs
   */
  async getSavedJobs(params = {}) {
    const response = await jobServiceClient.get('/api/jobs/saved', { params });
    const payload = response.data?.data || response.data;
    const jobs = Array.isArray(payload?.jobs) ? payload.jobs : (Array.isArray(payload) ? payload : []);
    return { jobs: jobs.map(transformJobListItem), totalPages: 1 };
  },
  async saveJob(jobId) {
    const response = await jobServiceClient.post(`/api/jobs/${jobId}/save`);
    return response.data;
  },
  async unsaveJob(jobId) {
    const response = await jobServiceClient.delete(`/api/jobs/${jobId}/save`);
    return response.data;
  },

  /**
   * Get contracts (mocked) from job-service
   */
  async getContracts() {
    try {
      const response = await jobServiceClient.get('/api/jobs/contracts');
      // Prefer nested data shape, fallback to flat
      return (
        response.data?.data?.contracts ||
        response.data?.contracts ||
        []
      );
    } catch (error) {
      console.warn('Job service unavailable for contracts:', error.message);
      return [];
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
      // Backend supports filtering and text search via /api/jobs with ?search=
      const response = await jobServiceClient.get('/api/jobs', {
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
