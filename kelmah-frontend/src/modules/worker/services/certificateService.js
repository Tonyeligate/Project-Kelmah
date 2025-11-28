import { api } from '../../../services/apiClient';

// Helper to consistently unwrap backend responses
const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

/**
 * Service for managing worker certificates and licenses (normalized returns)
 * All methods return primitives (arrays/objects) instead of raw axios responses.
 */
const certificateService = {
  /**
   * Get certificates for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Response with certificates
   */
  getWorkerCertificates: async (workerId) => {
    const res = await api.get(`/api/profile/${workerId}/certificates`);
    const unwrapped = unwrap(res);
    // Support both { certificates: [] } and []
    return Array.isArray(unwrapped?.certificates)
      ? unwrapped.certificates
      : Array.isArray(unwrapped)
        ? unwrapped
        : [];
  },

  /**
   * Create a new certificate
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} - Created certificate
   */
  createCertificate: async (certificateData) => {
    const res = await api.post(
      `/api/profile/${certificateData.workerId}/certificates`,
      certificateData,
    );
    const unwrapped = unwrap(res);
    return unwrapped?.certificate ?? unwrapped;
  },

  /**
   * Update an existing certificate
   * @param {string} certificateId - Certificate ID
   * @param {Object} certificateData - Updated certificate data
   * @returns {Promise<Object>} - Updated certificate
   */
  updateCertificate: async (certificateId, certificateData) => {
    const res = await api.put(
      `/api/profile/certificates/${certificateId}`,
      certificateData,
    );
    const unwrapped = unwrap(res);
    return unwrapped?.certificate ?? unwrapped;
  },

  /**
   * Delete a certificate
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteCertificate: async (certificateId) => {
    const res = await api.delete(`/api/profile/certificates/${certificateId}`);
    const unwrapped = unwrap(res);
    return unwrapped?.success ?? true;
  },

  /**
   * Upload certificate file
   * @param {File} file - Certificate file to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload response with URL
   */
  uploadCertificateFile: async (file, onProgress) => {
    const presignRes = await api.post('/profile/uploads/presign', {
      folder: 'certificates',
      filename: file.name,
      contentType: file.type,
    });
    const { putUrl, getUrl } = unwrap(presignRes) ?? {};
    if (!putUrl || !getUrl) throw new Error('Upload presign failed');
    await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (onProgress) onProgress(100);
    return { url: getUrl, fileName: file.name, fileSize: file.size };
  },

  /**
   * Request certificate verification
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Verification request response
   */
  requestVerification: async (certificateId) => {
    const res = await api.post(
      `/api/profile/certificates/${certificateId}/verify`,
    );
    const unwrapped = unwrap(res);
    return unwrapped?.certificate ?? unwrapped;
  },

  /**
   * Get certificate verification status
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Verification status
   */
  getVerificationStatus: async (certificateId) => {
    const res = await api.get(
      `/api/profile/certificates/${certificateId}/verification`,
    );
    return unwrap(res);
  },

  /**
   * Get certificate statistics for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Certificate statistics
   */
  getCertificateStats: async (workerId) => {
    const res = await api.get(`/api/profile/${workerId}/certificates/stats`);
    return unwrap(res);
  },

  /**
   * Share certificate (generate shareable link)
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<Object>} - Shareable link data
   */
  shareCertificate: async (certificateId) => {
    const res = await api.post(
      `/api/profile/certificates/${certificateId}/share`,
    );
    return unwrap(res);
  },

  /**
   * Validate certificate authenticity
   * @param {string} certificateId - Certificate ID
   * @param {string} credentialId - Credential ID to validate
   * @returns {Promise<Object>} - Validation result
   */
  validateCertificate: async (certificateId, credentialId) => {
    const res = await api.post(
      `/api/profile/certificates/${certificateId}/validate`,
      { credentialId },
    );
    return unwrap(res);
  },

  /**
   * Get expiring certificates
   * @param {string} workerId - Worker ID
   * @param {number} daysAhead - Number of days to look ahead (default: 30)
   * @returns {Promise<Object>} - Expiring certificates
   */
  getExpiringCertificates: async (workerId, daysAhead = 30) => {
    const res = await api.get(
      `/api/profile/${workerId}/certificates/expiring`,
      { params: { daysAhead } },
    );
    const unwrapped = unwrap(res);
    return Array.isArray(unwrapped?.certificates)
      ? unwrapped.certificates
      : Array.isArray(unwrapped)
        ? unwrapped
        : [];
  },

  /**
   * Search certificates by criteria
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Filtered certificates
   */
  searchCertificates: async (workerId, filters = {}) => {
    const res = await api.get(`/api/profile/${workerId}/certificates/search`, {
      params: filters,
    });
    const unwrapped = unwrap(res);
    return Array.isArray(unwrapped?.certificates)
      ? unwrapped.certificates
      : Array.isArray(unwrapped)
        ? unwrapped
        : [];
  },
};

export default certificateService;
