import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/workers';

/**
 * Service for managing worker certificates and licenses
 */
const certificateService = {
  /**
   * Get certificates for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Response with certificates
   */
  getWorkerCertificates: async (workerId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/certificates`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new certificate
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} - Created certificate
   */
  createCertificate: async (certificateData) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/${certificateData.workerId}/certificates`,
        certificateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing certificate
   * @param {string} certificateId - Certificate ID
   * @param {Object} certificateData - Updated certificate data
   * @returns {Promise<Object>} - Updated certificate
   */
  updateCertificate: async (certificateId, certificateData) => {
    try {
      const response = await userServiceClient.put(
        `${API_URL}/certificates/${certificateId}`,
        certificateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a certificate
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteCertificate: async (certificateId) => {
    try {
      const response = await userServiceClient.delete(`${API_URL}/certificates/${certificateId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload certificate file
   * @param {File} file - Certificate file to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload response with URL
   */
  uploadCertificateFile: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('type', 'certificate');

      const response = await userServiceClient.post('/api/upload/certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) {
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request certificate verification
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Verification request response
   */
  requestVerification: async (certificateId) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/certificates/${certificateId}/verify`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get certificate verification status
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Verification status
   */
  getVerificationStatus: async (certificateId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/certificates/${certificateId}/verification`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get certificate statistics for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Certificate statistics
   */
  getCertificateStats: async (workerId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/certificates/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Share certificate (generate shareable link)
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Shareable link data
   */
  shareCertificate: async (certificateId) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/certificates/${certificateId}/share`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Validate certificate authenticity
   * @param {string} certificateId - Certificate ID
   * @param {string} credentialId - Credential ID to validate
   * @returns {Promise<Object>} - Validation result
   */
  validateCertificate: async (certificateId, credentialId) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/certificates/${certificateId}/validate`,
        { credentialId }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get expiring certificates
   * @param {string} workerId - Worker ID
   * @param {number} daysAhead - Number of days to look ahead (default: 30)
   * @returns {Promise<Object>} - Expiring certificates
   */
  getExpiringCertificates: async (workerId, daysAhead = 30) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/certificates/expiring`,
        { params: { daysAhead } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search certificates by criteria
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Filtered certificates
   */
  searchCertificates: async (workerId, filters = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/${workerId}/certificates/search`,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default certificateService;