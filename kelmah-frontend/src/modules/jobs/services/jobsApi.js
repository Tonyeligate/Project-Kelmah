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
      console.log('🔍 Calling job service API with params:', params);
      console.log('🔍 Job service client baseURL:', jobServiceClient.defaults.baseURL);
      console.log('🔍 Job service client headers:', jobServiceClient.defaults.headers);
      const response = await jobServiceClient.get('/api/jobs', { params });
      console.log('📊 Raw API response:', response.data);
      
      // Handle different response formats from the backend
      let jobs = [];
      let totalPages = 1;
      let totalJobs = 0;
      let currentPage = 1;
      
      if (response.data) {
        // Check if response has pagination structure
        if (response.data.data && Array.isArray(response.data.data)) {
          jobs = response.data.data;
          totalPages = response.data.pagination?.totalPages || 1;
          totalJobs = response.data.pagination?.totalItems || jobs.length;
          currentPage = response.data.pagination?.currentPage || 1;
        } else if (Array.isArray(response.data)) {
          jobs = response.data;
        } else if (response.data.jobs && Array.isArray(response.data.jobs)) {
          jobs = response.data.jobs;
          totalPages = response.data.totalPages || 1;
          totalJobs = response.data.totalJobs || jobs.length;
          currentPage = response.data.currentPage || 1;
        }
      }
      
      console.log('✅ Extracted jobs:', jobs.length);
      
      return {
        data: jobs.map(transformJobListItem),
        jobs: jobs.map(transformJobListItem),
        totalPages,
        totalJobs,
        currentPage,
      };
    } catch (error) {
      console.error('❌ Job service API error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      // No mock data fallback; return empty results to reflect real state
      return {
        data: [],
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
