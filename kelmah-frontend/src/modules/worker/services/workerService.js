import axiosInstance from '../../common/services/axios';

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
    return axiosInstance.get(API_URL, { params: filters });
  },

  /**
   * Get a specific worker by ID
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker object
   */
  getWorkerById: (workerId) => {
    return axiosInstance.get(`${API_URL}/${workerId}`);
  },

  /**
   * Get reviews for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria for reviews
   * @returns {Promise<Array>} - Array of review objects
   */
  getWorkerReviews: (workerId, filters = {}) => {
    return axiosInstance.get(`${API_URL}/${workerId}/reviews`, {
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
    return axiosInstance.post(`${API_URL}/${workerId}/reviews`, reviewData);
  },

  updateWorkerProfile: (workerId, profileData) => {
    return axiosInstance.put(`${API_URL}/${workerId}`, profileData);
  },

  uploadProfileImage: (workerId, formData) => {
    return axiosInstance.post(`${API_URL}/${workerId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getWorkerSkills: (workerId) => {
    return axiosInstance.get(`${API_URL}/${workerId}/skills`);
  },

  addWorkerSkill: (workerId, skillData) => {
    return axiosInstance.post(`${API_URL}/${workerId}/skills`, skillData);
  },

  updateWorkerSkill: (workerId, skillId, skillData) => {
    return axiosInstance.put(
      `${API_URL}/${workerId}/skills/${skillId}`,
      skillData,
    );
  },

  deleteWorkerSkill: (workerId, skillId) => {
    return axiosInstance.delete(`${API_URL}/${workerId}/skills/${skillId}`);
  },

  getWorkerPortfolio: (workerId) => {
    return axiosInstance.get(`${API_URL}/${workerId}/portfolio`);
  },

  addPortfolioItem: (workerId, itemData) => {
    return axiosInstance.post(`${API_URL}/${workerId}/portfolio`, itemData);
  },

  updatePortfolioItem: (workerId, itemId, itemData) => {
    return axiosInstance.put(
      `${API_URL}/${workerId}/portfolio/${itemId}`,
      itemData,
    );
  },

  deletePortfolioItem: (workerId, itemId) => {
    return axiosInstance.delete(`${API_URL}/${workerId}/portfolio/${itemId}`);
  },

  getWorkerCertificates: (workerId) => {
    return axiosInstance.get(`${API_URL}/${workerId}/certificates`);
  },

  addCertificate: (workerId, certData) => {
    return axiosInstance.post(`${API_URL}/${workerId}/certificates`, certData);
  },

  updateCertificate: (workerId, certId, certData) => {
    return axiosInstance.put(
      `${API_URL}/${workerId}/certificates/${certId}`,
      certData,
    );
  },

  deleteCertificate: (workerId, certId) => {
    return axiosInstance.delete(
      `${API_URL}/${workerId}/certificates/${certId}`,
    );
  },

  getWorkHistory: (workerId) => {
    return axiosInstance.get(`${API_URL}/${workerId}/history`);
  },
};

export default workerService;
