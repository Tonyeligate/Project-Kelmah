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

  // Enhanced Job Distribution Methods

  /**
   * Get jobs by location with performance-based filtering
   * @param {Object} params - Query parameters
   * @param {string} params.region - Ghana region
   * @param {string} params.district - District (optional)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Jobs by location
   */
  async getJobsByLocation(params = {}) {
    const response = await apiClient.get('/jobs/location', { params });
    return response.data;
  }

  /**
   * Get jobs by skill with performance-based filtering
   * @param {string} skill - Skill name
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Jobs for specific skill
   */
  async getJobsBySkill(skill, params = {}) {
    const response = await apiClient.get(`/jobs/skill/${skill}`, { params });
    return response.data;
  }

  /**
   * Get jobs by performance tier
   * @param {string} tier - Performance tier (tier1, tier2, tier3)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Jobs for specific tier
   */
  async getJobsByPerformanceTier(tier, params = {}) {
    const response = await apiClient.get(`/jobs/tier/${tier}`, { params });
    return response.data;
  }

  /**
   * Get personalized job recommendations based on user performance
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Personalized job recommendations
   */
  async getPersonalizedJobRecommendations(params = {}) {
    const response = await apiClient.get('/jobs/recommendations/personalized', {
      params,
    });
    return response.data;
  }

  /**
   * Close job bidding
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Response data
   */
  async closeJobBidding(jobId) {
    const response = await apiClient.patch(`/jobs/${jobId}/close-bidding`);
    return response.data;
  }

  /**
   * Extend job deadline
   * @param {string} jobId - Job ID
   * @param {number} days - Number of days to extend
   * @returns {Promise<Object>} Response data
   */
  async extendJobDeadline(jobId, days = 7) {
    const response = await apiClient.patch(`/jobs/${jobId}/extend-deadline`, {
      days,
    });
    return response.data;
  }

  /**
   * Renew expired job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Response data
   */
  async renewJob(jobId) {
    const response = await apiClient.patch(`/jobs/${jobId}/renew`);
    return response.data;
  }

  /**
   * Get expired jobs (admin only)
   * @returns {Promise<Object>} Expired jobs
   */
  async getExpiredJobs() {
    const response = await apiClient.get('/jobs/expired');
    return response.data;
  }
}

export default new JobsApi();
