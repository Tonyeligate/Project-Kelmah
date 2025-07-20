import axiosInstance from '../../common/services/axios';

/**
 * Jobs API service
 */
const jobsApi = {
  /**
   * Get jobs with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Paginated jobs data in UI shape
   */
  getJobs: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/api/jobs', { params });
      // Unwrap paginated response: { success, message, data: [...], meta: { pagination } }
      const raw = response.data;
      const totalPages = raw.meta?.pagination?.totalPages || 1;
      const jobs = (raw.data || []).map(transformJobListItem);
      return { jobs, totalPages };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  /**
   * Get job by ID
   * @param {string} id - Job ID
   * @returns {Promise<Object>} - Job data in UI shape
   */
  getJobById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/jobs/${id}`);
      // Unwrap single job response: { success, message, data: job }
      const raw = response.data;
      const job = transformJobDetail(raw.data);
      return job;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} - Promise with created job
   */
  createJob: async (jobData) => {
    try {
      const response = await axiosInstance.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  /**
   * Update an existing job
   * @param {string} id - Job ID
   * @param {Object} jobData - Updated job data
   * @returns {Promise<Object>} - Promise with updated job
   */
  updateJob: async (id, jobData) => {
    try {
      const response = await axiosInstance.put(`/api/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a job
   * @param {string} id - Job ID
   * @returns {Promise<void>}
   */
  deleteJob: async (id) => {
    try {
      await axiosInstance.delete(`/api/jobs/${id}`);
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  },

  /**
   * Apply for a job
   * @param {string} jobId - Job ID
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} - Promise with application data
   */
  applyForJob: async (jobId, applicationData) => {
    try {
      const response = await axiosInstance.post(
        `/api/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      console.error(`Error applying for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Save a job for the current user
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - API response
   */
  saveJob: async (jobId) => {
    try {
      const response = await axiosInstance.post(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.error(`Error saving job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Unsave a previously saved job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - API response
   */
  unsaveJob: async (jobId) => {
    try {
      const response = await axiosInstance.delete(`/api/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.error(`Error unsaving job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get saved jobs with pagination
   * @param {Object} params - Query params (page, limit)
   * @returns {Promise<Object>} - { jobs: [], totalPages }
   */
  getSavedJobs: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/api/jobs/saved', { params });
      const raw = response.data;
      const totalPages = raw.meta?.pagination?.totalPages || 1;
      const jobs = (raw.data || []).map(transformJobListItem);
      return { jobs, totalPages };
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      throw error;
    }
  },
};

// Helper to transform raw job data for list view
const transformJobListItem = (rawJob) => {
  return {
    id: rawJob.id || rawJob._id,
    title: rawJob.title,
    description: rawJob.description,
    category: rawJob.category,
    skills: rawJob.skills || [],
    budget: rawJob.budget,
    location:
      rawJob.location && rawJob.location.city
        ? `${rawJob.location.city}, ${rawJob.location.country}`
        : rawJob.location?.type || '',
    postedDate: rawJob.createdAt || rawJob.postedDate,
    // Provide hirer info if available
    hirer: rawJob.hirer || {},
    hirerName:
      rawJob.hirer?.firstName && rawJob.hirer?.lastName
        ? `${rawJob.hirer.firstName} ${rawJob.hirer.lastName}`
        : rawJob.hirer?.name || '',
    hirerRating: rawJob.hirer?.rating || rawJob.hirerRating || 0,
  };
};

// Helper to transform raw job data for detail view
const transformJobDetail = (rawJob) => {
  return {
    id: rawJob.id || rawJob._id,
    title: rawJob.title,
    description: rawJob.description,
    category: rawJob.category,
    skills: rawJob.skills || [],
    location:
      rawJob.location && rawJob.location.city
        ? `${rawJob.location.city}, ${rawJob.location.country}`
        : rawJob.location?.type || '',
    minRate: rawJob.budget,
    maxRate: rawJob.budget,
    rateType: rawJob.paymentType || rawJob.rateType || 'fixed',
    postedDate: rawJob.createdAt || rawJob.postedDate,
    applicants:
      rawJob.proposalCount ||
      rawJob.proposals?.length ||
      rawJob.applicants ||
      0,
    status: rawJob.status,
    images: rawJob.attachments?.map((att) => att.url) || rawJob.images || [],
    deadline: rawJob.endDate
      ? new Date(rawJob.endDate).toISOString().split('T')[0]
      : rawJob.deadline,
    // Map hirer details for sidebar
    hirer: {
      id: rawJob.hirer?.id || rawJob.hirer?._id,
      avatar: rawJob.hirer?.profileImage || rawJob.hirer?.avatar || '',
      name:
        rawJob.hirer?.firstName && rawJob.hirer?.lastName
          ? `${rawJob.hirer.firstName} ${rawJob.hirer.lastName}`
          : rawJob.hirer?.name || '',
      rating: rawJob.hirer?.rating || rawJob.hirerRating || 0,
      reviews: rawJob.hirer?.reviews || 0,
      jobsPosted: rawJob.hirer?.jobCount || rawJob.hirer?.jobsPosted || 0,
    },
  };
};

export default jobsApi;
