/**
 * Jobs API Service
 * Handles job posting, searching, and job-related operations
 */

import apiClient from '../index';

class JobsApi {
  /**
   * Get all jobs with optional filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number for pagination
   * @param {number} params.limit - Results per page
   * @param {string} params.search - Search keywords
   * @param {string} params.location - Job location
   * @param {string} params.category - Job category
   * @param {string} params.status - Job status
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Paginated jobs data
   */
  async getJobs(params = {}) {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  }

  /**
   * Get featured jobs for homepage
   * @param {number} limit - Number of jobs to retrieve
   * @returns {Promise<Object>} Featured jobs data
   */
  async getFeaturedJobs(limit = 6) {
    const response = await apiClient.get('/jobs/featured', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get a specific job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job data
   */
  async getJobById(jobId) {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Create a new job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Created job data
   */
  async createJob(jobData) {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  }

  /**
   * Update an existing job
   * @param {string} jobId - Job ID to update
   * @param {Object} jobData - Updated job data
   * @returns {Promise<Object>} Updated job data
   */
  async updateJob(jobId, jobData) {
    const response = await apiClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  }

  /**
   * Delete a job
   * @param {string} jobId - Job ID to delete
   * @returns {Promise<Object>} Deletion response
   */
  async deleteJob(jobId) {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Get jobs posted by current hirer
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Current hirer's job listings
   */
  async getMyJobs(params = {}) {
    const response = await apiClient.get('/jobs/my-jobs', { params });
    return response.data;
  }

  /**
   * Apply to a job
   * @param {string} jobId - Job ID to apply for
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Application response
   */
  async applyToJob(jobId, applicationData) {
    const response = await apiClient.post(
      `/jobs/${jobId}/apply`,
      applicationData,
    );
    return response.data;
  }

  /**
   * Get applications for a job
   * @param {string} jobId - Job ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Job applications
   */
  async getJobApplications(jobId, params = {}) {
    const response = await apiClient.get(`/jobs/${jobId}/applications`, {
      params,
    });
    return response.data;
  }

  /**
   * Get applications submitted by current worker
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Worker's job applications
   */
  async getMyApplications(params = {}) {
    const response = await apiClient.get('/jobs/my-applications', { params });
    return response.data;
  }

  /**
   * Update application status
   * @param {string} jobId - Job ID
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated application
   */
  async updateApplicationStatus(jobId, applicationId, status) {
    const response = await apiClient.put(
      `/jobs/${jobId}/applications/${applicationId}`,
      { status },
    );
    return response.data;
  }

  /**
   * Save a job for later
   * @param {string} jobId - Job ID to save
   * @returns {Promise<Object>} Response data
   */
  async saveJob(jobId) {
    const response = await apiClient.post(`/jobs/${jobId}/save`);
    return response.data;
  }

  /**
   * Remove a saved job
   * @param {string} jobId - Job ID to unsave
   * @returns {Promise<Object>} Response data
   */
  async unsaveJob(jobId) {
    const response = await apiClient.delete(`/jobs/${jobId}/save`);
    return response.data;
  }

  /**
   * Get saved jobs for current user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Saved jobs
   */
  async getSavedJobs(params = {}) {
    const response = await apiClient.get('/jobs/saved', { params });
    return response.data;
  }

  /**
   * Get job categories
   * @returns {Promise<Object>} Job categories
   */
  async getJobCategories() {
    const response = await apiClient.get('/jobs/categories');
    return response.data;
  }
}

export default new JobsApi();
