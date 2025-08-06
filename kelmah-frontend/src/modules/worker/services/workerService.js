import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/workers';

/**
 * Service for making API calls related to workers
 */
const workerService = {
  /**
   * Get all workers with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of worker objects
   */
  getWorkers: (filters = {}) => {
    return userServiceClient.get(API_URL, { params: filters });
  },

  /**
   * Get a specific worker by ID
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker object
   */
  getWorkerById: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}`);
  },

  /**
   * Get reviews for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria for reviews
   * @returns {Promise<Array>} - Array of review objects
   */
  getWorkerReviews: (workerId, filters = {}) => {
    return userServiceClient.get(`${API_URL}/${workerId}/reviews`, {
      params: filters,
    });
  },

  /**
   * Submit a review for a worker
   * @param {string} workerId - Worker ID
   * @param {Object} reviewData - Review data to submit
   * @returns {Promise<Object>} - Created review object
   */
  submitReview: (workerId, reviewData) => {
    return userServiceClient.post(`${API_URL}/${workerId}/reviews`, reviewData);
  },

  /**
   * Update worker profile information
   * @param {string} workerId - Worker ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated worker profile
   */
  updateWorkerProfile: (workerId, profileData) => {
    return userServiceClient.put(`${API_URL}/${workerId}`, profileData);
  },

  /**
   * Upload profile image for worker
   * @param {string} workerId - Worker ID
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} - Upload response
   */
  uploadProfileImage: (workerId, formData) => {
    return userServiceClient.post(`${API_URL}/${workerId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get skills for a specific worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of skill objects
   */
  getWorkerSkills: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/skills`);
  },

  /**
   * Add skill to worker
   * @param {string} workerId - Worker ID
   * @param {Object} skillData - Skill data to add
   * @returns {Promise<Object>} - Added skill object
   */
  addWorkerSkill: (workerId, skillData) => {
    return userServiceClient.post(`${API_URL}/${workerId}/skills`, skillData);
  },

  /**
   * Update worker skill
   * @param {string} workerId - Worker ID
   * @param {string} skillId - Skill ID
   * @param {Object} skillData - Updated skill data
   * @returns {Promise<Object>} - Updated skill object
   */
  updateWorkerSkill: (workerId, skillId, skillData) => {
    return userServiceClient.put(
      `${API_URL}/${workerId}/skills/${skillId}`,
      skillData,
    );
  },

  /**
   * Delete worker skill
   * @param {string} workerId - Worker ID
   * @param {string} skillId - Skill ID
   * @returns {Promise<void>}
   */
  deleteWorkerSkill: (workerId, skillId) => {
    return userServiceClient.delete(`${API_URL}/${workerId}/skills/${skillId}`);
  },

  /**
   * Get portfolio items for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of portfolio items
   */
  getWorkerPortfolio: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/portfolio`);
  },

  /**
   * Add portfolio item to worker
   * @param {string} workerId - Worker ID
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Added portfolio item
   */
  addPortfolioItem: (workerId, portfolioData) => {
    return userServiceClient.post(
      `${API_URL}/${workerId}/portfolio`,
      portfolioData,
    );
  },

  /**
   * Update portfolio item
   * @param {string} workerId - Worker ID
   * @param {string} portfolioId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  updatePortfolioItem: (workerId, portfolioId, portfolioData) => {
    return userServiceClient.put(
      `${API_URL}/${workerId}/portfolio/${portfolioId}`,
      portfolioData,
    );
  },

  /**
   * Delete portfolio item
   * @param {string} workerId - Worker ID
   * @param {string} portfolioId - Portfolio item ID
   * @returns {Promise<void>}
   */
  deletePortfolioItem: (workerId, portfolioId) => {
    return userServiceClient.delete(
      `${API_URL}/${workerId}/portfolio/${portfolioId}`,
    );
  },

  /**
   * Get certificates for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of certificate objects
   */
  getWorkerCertificates: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/certificates`);
  },

  /**
   * Add certificate to worker
   * @param {string} workerId - Worker ID
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} - Added certificate
   */
  addCertificate: (workerId, certificateData) => {
    return userServiceClient.post(
      `${API_URL}/${workerId}/certificates`,
      certificateData,
    );
  },

  /**
   * Update certificate
   * @param {string} workerId - Worker ID
   * @param {string} certificateId - Certificate ID
   * @param {Object} certificateData - Updated certificate data
   * @returns {Promise<Object>} - Updated certificate
   */
  updateCertificate: (workerId, certificateId, certificateData) => {
    return userServiceClient.put(
      `${API_URL}/${workerId}/certificates/${certificateId}`,
      certificateData,
    );
  },

  /**
   * Delete certificate
   * @param {string} workerId - Worker ID
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<void>}
   */
  deleteCertificate: (workerId, certificateId) => {
    return userServiceClient.delete(
      `${API_URL}/${workerId}/certificates/${certificateId}`,
    );
  },

  /**
   * Get work history for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of work history items
   */
  getWorkHistory: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/work-history`);
  },

  /**
   * Add work history item
   * @param {string} workerId - Worker ID
   * @param {Object} workHistoryData - Work history data
   * @returns {Promise<Object>} - Added work history item
   */
  addWorkHistory: (workerId, workHistoryData) => {
    return userServiceClient.post(
      `${API_URL}/${workerId}/work-history`,
      workHistoryData,
    );
  },

  /**
   * Get worker availability information
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Availability information
   */
  getWorkerAvailability: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/availability`);
  },

  /**
   * Update worker availability
   * @param {string} workerId - Worker ID
   * @param {Object} availabilityData - Availability data
   * @returns {Promise<Object>} - Updated availability
   */
  updateWorkerAvailability: (workerId, availabilityData) => {
    return userServiceClient.put(
      `${API_URL}/${workerId}/availability`,
      availabilityData,
    );
  },

  /**
   * Get worker statistics (jobs completed, success rate, etc.)
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker statistics
   */
  getWorkerStats: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/stats`);
  },

  /**
   * Get worker earnings information
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Date filters for earnings
   * @returns {Promise<Object>} - Earnings information
   */
  getWorkerEarnings: (workerId, filters = {}) => {
    return userServiceClient.get(`${API_URL}/${workerId}/earnings`, {
      params: filters,
    });
  },

  /**
   * Get nearby workers based on location
   * @param {Object} locationData - Location coordinates and filters
   * @returns {Promise<Array>} - Array of nearby workers
   */
  getNearbyWorkers: (locationData) => {
    return userServiceClient.post(`${API_URL}/nearby`, locationData);
  },

  /**
   * Search workers with various filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchWorkers: (searchParams) => {
    return userServiceClient.get(`${API_URL}/search`, { params: searchParams });
  },

  /**
   * Bookmark a worker profile
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  bookmarkWorker: (workerId) => {
    return userServiceClient.post(`${API_URL}/${workerId}/bookmark`);
  },

  /**
   * Remove bookmark from worker profile
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  removeBookmark: (workerId) => {
    return userServiceClient.delete(`${API_URL}/${workerId}/bookmark`);
  },

  /**
   * Report a worker profile
   * @param {string} workerId - Worker ID
   * @param {Object} reportData - Report data
   * @returns {Promise<void>}
   */
  reportWorker: (workerId, reportData) => {
    return userServiceClient.post(`${API_URL}/${workerId}/report`, reportData);
  },

  /**
   * Get worker verification status
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Verification status
   */
  getVerificationStatus: (workerId) => {
    return userServiceClient.get(`${API_URL}/${workerId}/verification`);
  },

  /**
   * Request worker verification
   * @param {string} workerId - Worker ID
   * @param {Object} verificationData - Verification documents and data
   * @returns {Promise<Object>} - Verification request response
   */
  requestVerification: (workerId, verificationData) => {
    return userServiceClient.post(
      `${API_URL}/${workerId}/verification`,
      verificationData,
    );
  },

  /**
   * Get recommended workers based on user preferences
   * @param {Object} preferences - User preferences and filters
   * @returns {Promise<Array>} - Array of recommended workers
   */
  getRecommendedWorkers: (preferences = {}) => {
    return userServiceClient.get(`${API_URL}/recommended`, { params: preferences });
  },

  /**
   * Get saved jobs for current worker
   * @returns {Promise<Array>} - Array of saved jobs
   */
  getSavedJobs: async () => {
    try {
      const response = await userServiceClient.get('/api/workers/me/saved-jobs');
      return response.data;
    } catch (error) {
      console.warn('User Service unavailable for saved jobs, using fallback:', error.message);
      return [];
    }
  },

  /**
   * Save a job for later
   * @param {string} jobId - Job ID to save
   * @returns {Promise<void>}
   */
  saveJob: (jobId) => {
    return userServiceClient.post(`/api/jobs/${jobId}/save`);
  },

  /**
   * Remove a job from saved list
   * @param {string} jobId - Job ID to unsave
   * @returns {Promise<void>}
   */
  unsaveJob: (jobId) => {
    return userServiceClient.delete(`/api/jobs/${jobId}/save`);
  },

  /**
   * Get worker's job applications
   * @param {Object} filters - Application filters
   * @returns {Promise<Array>} - Array of job applications
   */
  getApplications: async (filters = {}) => {
    try {
      const response = await userServiceClient.get('/api/workers/me/applications', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.warn('User Service unavailable for applications, using fallback:', error.message);
      return [];
    }
  },

  /**
   * Apply to a job
   * @param {string} jobId - Job ID to apply to
   * @param {Object} applicationData - Application details
   * @returns {Promise<Object>} - Application response
   */
  applyToJob: (jobId, applicationData) => {
    return userServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
  },

  /**
   * Withdraw application from a job
   * @param {string} jobId - Job ID
   * @returns {Promise<void>}
   */
  withdrawApplication: (jobId) => {
    return userServiceClient.delete(`/api/jobs/${jobId}/apply`);
  },

  /**
   * Get application status for a specific job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Application status
   */
  getApplicationStatus: (jobId) => {
    return userServiceClient.get(`/api/jobs/${jobId}/application-status`);
  },
};

export default workerService;
