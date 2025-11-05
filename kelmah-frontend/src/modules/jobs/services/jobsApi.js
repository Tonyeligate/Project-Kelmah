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
    // Map API date fields to frontend expected fields
    postedDate: job.createdAt ? new Date(job.createdAt) : new Date(),
    deadline: job.endDate
      ? new Date(job.endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startDate: job.startDate ? new Date(job.startDate) : new Date(),
    // Additional fields for display
    hirer: job.hirer || { name: job.hirer_name || 'Unknown Company' },
    proposalCount: job.proposalCount || 0,
    viewCount: job.viewCount || 0,
    rating: job.rating || 4.5,
    urgent: job.urgent || false,
    verified: job.verified || false,
  };
};

// Jobs API service - using real backend data only
const jobsApi = {
  /**
   * Get all jobs with filtering and pagination
   */
  async getJobs(params = {}) {
    try {
<<<<<<< Updated upstream
      console.log('🔍 Calling job service API with params:', params);
      const response = await jobServiceClient.get('/jobs', { params });
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
        } else if (response.data.items && Array.isArray(response.data.items)) {
          // Handle the actual API response format: {success: true, items: [...], page: 1, total: 12}
          jobs = response.data.items;
          totalPages =
            Math.ceil(response.data.total / response.data.limit) || 1;
          totalJobs = response.data.total || jobs.length;
          currentPage = response.data.page || 1;
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

=======
      const response = await jobServiceClient.get('/api/jobs', { params });
      
      // Normalize backend pagination envelope: prefer items+page+total+limit format
      const payload = response.data || {};
      const jobs = payload.items || payload.data || payload.jobs || [];
      const totalJobs = payload.total || payload.totalJobs || jobs.length;
      const limit = payload.limit || params.limit || 10;
      const totalPages = payload.totalPages || Math.ceil(totalJobs / limit);
      const currentPage = payload.page || payload.currentPage || 1;
      
>>>>>>> Stashed changes
      return {
        data: jobs.map(transformJobListItem),
        jobs: jobs.map(transformJobListItem),
        totalPages,
        totalJobs,
        currentPage,
      };
    } catch (error) {
<<<<<<< Updated upstream
      console.error('❌ Job service API error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      // No mock data fallback; return empty results to reflect real state
=======
      // Return empty results on error without logging to production console
>>>>>>> Stashed changes
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
    const response = await jobServiceClient.post('/jobs', jobData);
    return response.data?.data || response.data;
  },

  /**
   * Saved jobs
   */
  async getSavedJobs(params = {}) {
    const response = await jobServiceClient.get('/jobs/saved', { params });
    const payload = response.data?.data || response.data;
    const jobs = Array.isArray(payload?.jobs)
      ? payload.jobs
      : Array.isArray(payload)
        ? payload
        : [];
    return { jobs: jobs.map(transformJobListItem), totalPages: 1 };
  },
  async saveJob(jobId) {
    const response = await jobServiceClient.post(`/jobs/${jobId}/save`);
    return response.data;
  },
  async unsaveJob(jobId) {
    const response = await jobServiceClient.delete(`/jobs/${jobId}/save`);
    return response.data;
  },

  /**
   * Get contracts (mocked) from job-service
   */
  async getContracts() {
    try {
<<<<<<< Updated upstream
      const response = await jobServiceClient.get('/jobs/contracts');
      // Prefer nested data shape, fallback to flat
      return response.data?.data?.contracts || response.data?.contracts || [];
=======
      const response = await jobServiceClient.get('/api/jobs/contracts');
      return (
        response.data?.data?.contracts ||
        response.data?.contracts ||
        []
      );
>>>>>>> Stashed changes
    } catch (error) {
      return [];
    }
  },

  /**
   * Get a single job by ID
   */
  async getJobById(jobId) {
    // Validate jobId before making API call
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error('❌ Invalid job ID provided to getJobById:', jobId);
      throw new Error('Invalid job ID');
    }

    try {
<<<<<<< Updated upstream
      const response = await jobServiceClient.get(`/jobs/${jobId}`);
      console.log('🔍 Single job API response:', response.data);

      // Handle the response format: {success: true, items: [...], page: 1, total: 12}
      if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        // Find the specific job by ID
        const job = response.data.items.find(
          (item) => item.id === jobId || item._id === jobId,
        );
        if (job) {
          console.log('✅ Found job by ID:', job.title);
          // Return non-destructively normalized job
          const normalized = {
            ...job,
            // Provide compatibility fields used by UI
            created_at: job.created_at || job.createdAt || job.postedDate,
            hirer_name: job.hirer_name || job.hirer?.name,
            postedDate:
              job.postedDate ||
              (job.createdAt ? new Date(job.createdAt) : undefined),
            deadline:
              job.deadline || (job.endDate ? new Date(job.endDate) : undefined),
            skills: Array.isArray(job.skills)
              ? job.skills
              : typeof job.skills_required === 'string'
                ? job.skills_required
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
          };
          return normalized;
        }
      }

      // Fallback to old format (return merged normalized fields without removing originals)
      const raw = response.data.data || response.data;
      const normalized =
        raw && typeof raw === 'object'
          ? {
              ...raw,
              created_at: raw.created_at || raw.createdAt || raw.postedDate,
              hirer_name: raw.hirer_name || raw.hirer?.name,
              postedDate:
                raw.postedDate ||
                (raw.createdAt ? new Date(raw.createdAt) : undefined),
              deadline:
                raw.deadline ||
                (raw.endDate ? new Date(raw.endDate) : undefined),
              skills: Array.isArray(raw.skills)
                ? raw.skills
                : typeof raw.skills_required === 'string'
                  ? raw.skills_required
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [],
            }
          : raw;
      return normalized;
=======
      const response = await jobServiceClient.get(`/api/jobs/${jobId}`);
      
      // Handle array response format
      if (response.data?.items && Array.isArray(response.data.items)) {
        const job = response.data.items.find(item => item.id === jobId || item._id === jobId);
        if (job) return this._normalizeJobFields(job);
      }
      
      // Handle single job response
      const raw = response.data?.data || response.data;
      return raw ? this._normalizeJobFields(raw) : null;
>>>>>>> Stashed changes
    } catch (error) {
      return null;
    }
  },

  /**
   * Normalize job fields for UI consumption
   */
  _normalizeJobFields(job) {
    return {
      ...job,
      created_at: job.created_at || job.createdAt || job.postedDate,
      hirer_name: job.hirer_name || job.hirer?.name,
      postedDate: job.postedDate || (job.createdAt ? new Date(job.createdAt) : undefined),
      deadline: job.deadline || (job.endDate ? new Date(job.endDate) : undefined),
      skills: Array.isArray(job.skills)
        ? job.skills
        : (typeof job.skills_required === 'string'
          ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
          : []),
    };
  },

  /**
   * Search jobs by criteria
   */
  async searchJobs(searchParams) {
    try {
<<<<<<< Updated upstream
      // Backend supports filtering and text search via /jobs with ?search=
      const response = await jobServiceClient.get('/jobs', {
=======
      const response = await jobServiceClient.get('/api/jobs', {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    try {
      const response = await jobServiceClient.post(
        `/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      console.warn(
        `Job service unavailable for job application ${jobId}:`,
        error.message,
      );
      throw error;
    }
=======
    const response = await jobServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
    return response.data;
>>>>>>> Stashed changes
  },

  /**
   * Get job categories
   */
  async getJobCategories() {
    try {
      const response = await jobServiceClient.get('/jobs/categories');
      return response.data.data || response.data;
    } catch (error) {
<<<<<<< Updated upstream
      console.warn(
        'Job service unavailable for job categories:',
        error.message,
      );
=======
>>>>>>> Stashed changes
      return [];
    }
  },

  /**
   * Personalized job recommendations for workers
   */
  async getPersonalizedJobRecommendations(params = {}) {
    try {
      const response = await jobServiceClient.get(
        '/api/jobs/recommendations/personalized',
        {
          params,
        },
      );
      const payload = response.data?.data || response.data;
      if (Array.isArray(payload?.recommendations)) {
        return payload.recommendations.map(transformJobListItem);
      }
      if (Array.isArray(payload)) {
        return payload.map(transformJobListItem);
      }
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return items.map(transformJobListItem);
    } catch (error) {
      console.warn(
        'Job service unavailable for personalized recommendations:',
        error.message,
      );
      return [];
    }
  },
};

// Align legacy callers expecting applyForJob with current implementation
jobsApi.applyForJob = jobsApi.applyToJob;

export default jobsApi;
