import { API_ENDPOINTS } from '../../../config/environment';
import {
  userServiceClient,
  jobServiceClient,
  getUserServiceClient,
} from '../../common/services/axios';

const WORKERS_BASE = API_ENDPOINTS.USER.WORKERS;

const workerPath = (workerId, suffix = '') =>
  `${API_ENDPOINTS.USER.WORKER_DETAIL(workerId)}${suffix}`;

const unwrapPayload = (response) =>
  response?.data?.data ?? response?.data ?? {};

const buildMetadata = (payload = {}) => ({
  fallback: Boolean(payload?.fallback),
  fallbackReason: payload?.fallbackReason ?? null,
  source: payload?.source ?? null,
  receivedAt: new Date().toISOString(),
});

const attachMetadata = (data, payload = {}) => {
  const metadata = buildMetadata(payload);
  return {
    ...data,
    fallback: metadata.fallback,
    fallbackReason: metadata.fallbackReason,
    metadata,
  };
};

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
    return userServiceClient.get(WORKERS_BASE, { params: filters });
  },

  /**
   * Get a specific worker by ID
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker object
   */
  getWorkerById: (workerId) => {
    return userServiceClient.get(workerPath(workerId));
  },

  /**
   * Get reviews for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria for reviews
   * @returns {Promise<Array>} - Array of review objects
   */
  getWorkerReviews: (workerId, filters = {}) => {
    return userServiceClient.get(workerPath(workerId, '/reviews'), {
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
    return userServiceClient.post(
      workerPath(workerId, '/reviews'),
      reviewData,
    );
  },

  /**
   * Update worker profile information
   * @param {string} workerId - Worker ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated worker profile
   */
  updateWorkerProfile: (workerId, profileData) => {
    return userServiceClient.put(workerPath(workerId), profileData);
  },

  /**
   * Upload profile image for worker
   * @param {string} workerId - Worker ID
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} - Upload response
   */
  uploadProfileImage: (workerId, formData) => {
    return userServiceClient.post(
      workerPath(workerId, '/image'),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },

  /**
   * Get skills for a specific worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of skill objects
   */
  getWorkerSkills: (workerId) => {
    return userServiceClient.get(workerPath(workerId, '/skills'));
  },

  /**
   * Get credentials (skills, licenses, certifications) for the authenticated worker
   * @returns {Promise<{ skills: Array, licenses: Array, certifications: Array }>}
   */
  getMyCredentials: async () => {
    const response = await userServiceClient.get(
      API_ENDPOINTS.USER.ME_CREDENTIALS,
    );
    const payload = response?.data?.data ?? response?.data ?? {};

    return {
      skills: Array.isArray(payload.skills) ? payload.skills : [],
      licenses: Array.isArray(payload.licenses) ? payload.licenses : [],
      certifications: Array.isArray(payload.certifications)
        ? payload.certifications
        : [],
    };
  },

  /**
   * Add skill to worker
   * @param {string} workerId - Worker ID
   * @param {Object} skillData - Skill data to add
   * @returns {Promise<Object>} - Added skill object
   */
  addWorkerSkill: (workerId, skillData) => {
    return userServiceClient.post(
      workerPath(workerId, '/skills'),
      skillData,
    );
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
      workerPath(workerId, `/skills/${skillId}`),
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
    return userServiceClient.delete(
      workerPath(workerId, `/skills/${skillId}`),
    );
  },

  /**
   * Get portfolio items for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of portfolio items
   */
  getWorkerPortfolio: (workerId) => {
    return userServiceClient.get(workerPath(workerId, '/portfolio'));
  },

  /**
   * Add portfolio item to worker
   * @param {string} workerId - Worker ID
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Added portfolio item
   */
  addPortfolioItem: (workerId, portfolioData) => {
    return userServiceClient.post(
      workerPath(workerId, '/portfolio'),
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
      workerPath(workerId, `/portfolio/${portfolioId}`),
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
      workerPath(workerId, `/portfolio/${portfolioId}`),
    );
  },

  /**
   * Get certificates for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of certificate objects
   */
  getWorkerCertificates: (workerId) => {
    return userServiceClient.get(workerPath(workerId, '/certificates'));
  },

  /**
   * Add certificate to worker
   * @param {string} workerId - Worker ID
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} - Added certificate
   */
  addCertificate: (workerId, certificateData) => {
    return userServiceClient.post(
      workerPath(workerId, '/certificates'),
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
      workerPath(workerId, `/certificates/${certificateId}`),
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
      workerPath(workerId, `/certificates/${certificateId}`),
    );
  },

  /**
   * Get work history for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of work history items
   */
  getWorkHistory: (workerId) => {
    return userServiceClient.get(workerPath(workerId, '/work-history'));
  },

  /**
   * Add work history item
   * @param {string} workerId - Worker ID
   * @param {Object} workHistoryData - Work history data
   * @returns {Promise<Object>} - Added work history item
   */
  addWorkHistory: (workerId, workHistoryData) => {
    return userServiceClient.post(
      workerPath(workerId, '/work-history'),
      workHistoryData,
    );
  },

  /**
   * Get worker availability information
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Availability information
   */
  getWorkerAvailability: async (workerId) => {
    if (!workerId) {
      throw new Error('workerId is required to fetch availability');
    }

    let response;
    try {
      response = await userServiceClient.get(
        workerPath(workerId, '/availability'),
      );
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 405) {
        throw error;
      }

      const client = await getUserServiceClient();
      // ⚠️ FIX: Use correct path /users/workers/{id}/availability, not /availability/{id}
      response = await client.get(`/users/workers/${workerId}/availability`);
    }
    const payload = unwrapPayload(response);
    const status = payload?.status;

    const normalized = {
      status,
      isAvailable:
        typeof payload?.isAvailable === 'boolean'
          ? payload.isAvailable
          : status === 'available' || status === true,
      timezone: payload?.timezone || 'Africa/Accra',
      daySlots: Array.isArray(payload?.daySlots) ? payload.daySlots : [],
      schedule: Array.isArray(payload?.schedule) ? payload.schedule : [],
      nextAvailable: payload?.nextAvailable ?? null,
      message: payload?.message || null,
      pausedUntil: payload?.pausedUntil ?? null,
      lastUpdated: payload?.lastUpdated ?? null,
    };

    return attachMetadata(normalized, payload);
  },

  /**
   * Update worker availability
   * @param {string} workerId - Worker ID
   * @param {Object} availabilityData - Availability data
   * @returns {Promise<Object>} - Updated availability
   */
  updateWorkerAvailability: async (workerId, availabilityData) => {
    if (!workerId) {
      throw new Error('workerId is required to update availability');
    }

    let response;
    try {
      response = await userServiceClient.put(
        workerPath(workerId, '/availability'),
        availabilityData,
      );
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 405) {
        throw error;
      }

      const client = await getUserServiceClient();
      // ⚠️ FIX: Use correct path /users/workers/{id}/availability, not /availability/{id}
      response = await client.put(
        `/users/workers/${workerId}/availability`,
        availabilityData,
      );
    }

    const payload = unwrapPayload(response);
    const status = payload?.status;

    const normalized = {
      status,
      isAvailable:
        typeof payload?.isAvailable === 'boolean'
          ? payload.isAvailable
          : status === 'available' || status === true,
      timezone: payload?.timezone || 'Africa/Accra',
      daySlots: Array.isArray(payload?.daySlots) ? payload.daySlots : [],
      schedule: Array.isArray(payload?.schedule) ? payload.schedule : [],
      nextAvailable: payload?.nextAvailable ?? null,
      message: payload?.message || null,
      pausedUntil: payload?.pausedUntil ?? null,
      lastUpdated: payload?.lastUpdated ?? null,
    };

    return attachMetadata(normalized, payload);
  },

  /**
   * Get worker statistics (jobs completed, success rate, etc.)
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker statistics
   */
  getWorkerStats: async (workerId) => {
    if (!workerId) {
      throw new Error('workerId is required to fetch statistics');
    }

    const response = await userServiceClient.get(
      workerPath(workerId, '/completeness'),
    );
    const payload = unwrapPayload(response);
    const completion =
      payload?.completionPercentage ?? payload?.percentage ?? 0;

    const normalized = {
      completionPercentage: completion,
      percentage: completion,
      requiredCompletion: payload?.requiredCompletion ?? 0,
      optionalCompletion: payload?.optionalCompletion ?? 0,
      missingRequired: Array.isArray(payload?.missingRequired)
        ? payload.missingRequired
        : [],
      missingOptional: Array.isArray(payload?.missingOptional)
        ? payload.missingOptional
        : [],
      recommendations: Array.isArray(payload?.recommendations)
        ? payload.recommendations
        : [],
      source: payload?.source || {},
    };

    return attachMetadata(normalized, payload);
  },

  /**
   * Get recent jobs for the authenticated worker
   * @param {{ limit?: number }} options - Optional query params
   * @returns {Promise<Array>} - Array of recent jobs
   */
  getWorkerJobs: async ({ limit = 10 } = {}) => {
    const response = await userServiceClient.get(
      `${WORKERS_BASE}/jobs/recent`,
      {
      params: { limit },
      },
    );

    const payload = unwrapPayload(response);
    const jobs = Array.isArray(payload?.jobs)
      ? payload.jobs
      : Array.isArray(payload)
        ? payload
        : [];

    const normalized = {
      jobs,
      total: typeof payload?.total === 'number' ? payload.total : jobs.length,
    };

    return attachMetadata(normalized, payload);
  },

  /**
   * Get worker earnings information
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Date filters for earnings
   * @returns {Promise<Object>} - Earnings information
   */
  getWorkerEarnings: (workerId, filters = {}) => {
    return userServiceClient.get(workerPath(workerId, '/earnings'), {
      params: filters,
    });
  },

  /**
   * Get analytics summary (jobs, payments, reviews) for a worker
   * @param {string} workerId - Worker ID or user ID
   * @returns {Promise<Object>} - Analytics summary
   */
  getWorkerAnalytics: async (workerId) => {
    if (!workerId) {
      throw new Error('workerId is required to fetch analytics');
    }

    const response = await userServiceClient.get(
      `/api/analytics/worker/${workerId}`,
    );

    return response?.data?.data ?? response?.data ?? {};
  },

  /**
   * Get nearby workers based on location
   * @param {Object} locationData - Location coordinates and filters
   * @returns {Promise<Array>} - Array of nearby workers
   */
  getNearbyWorkers: (locationData) => {
    return userServiceClient.post(`${WORKERS_BASE}/nearby`, locationData);
  },

  /**
   * Search workers with various filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchWorkers: (searchParams) => {
    return userServiceClient.get(`${WORKERS_BASE}/search`, {
      params: searchParams,
    });
  },

  /**
   * Bookmark a worker profile
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  bookmarkWorker: (workerId) => {
    return userServiceClient.post(workerPath(workerId, '/bookmark'));
  },

  /**
   * Get list of bookmarked worker IDs for current user
   * @returns {Promise<{workerIds: string[]}>}
   */
  getBookmarks: () => {
    return userServiceClient.get(`/api/users/bookmarks`);
  },

  /**
   * Remove bookmark from worker profile
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  removeBookmark: (workerId) => {
    return userServiceClient.delete(workerPath(workerId, '/bookmark'));
  },

  /**
   * Report a worker profile
   * @param {string} workerId - Worker ID
   * @param {Object} reportData - Report data
   * @returns {Promise<void>}
   */
  reportWorker: (workerId, reportData) => {
    return userServiceClient.post(
      workerPath(workerId, '/report'),
      reportData,
    );
  },

  /**
   * Get worker verification status
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Verification status
   */
  getVerificationStatus: (workerId) => {
    return userServiceClient.get(workerPath(workerId, '/verification'));
  },

  /**
   * Request worker verification
   * @param {string} workerId - Worker ID
   * @param {Object} verificationData - Verification documents and data
   * @returns {Promise<Object>} - Verification request response
   */
  requestVerification: (workerId, verificationData) => {
    return userServiceClient.post(
      workerPath(workerId, '/verification'),
      verificationData,
    );
  },

  /**
   * Get recommended workers based on user preferences
   * @param {Object} preferences - User preferences and filters
   * @returns {Promise<Array>} - Array of recommended workers
   */
  getRecommendedWorkers: (preferences = {}) => {
    return userServiceClient.get(`${WORKERS_BASE}/recommended`, {
      params: preferences,
    });
  },

  /**
   * Get saved jobs for current worker
   * @returns {Promise<Array>} - Array of saved jobs
   */
  getSavedJobs: async () => {
    const response = await jobServiceClient.get('/jobs/saved');
    return response.data;
  },

  /**
   * Save a job for later
   * @param {string} jobId - Job ID to save
   * @returns {Promise<void>}
   */
  saveJob: (jobId) => {
    return jobServiceClient.post(`/api/jobs/${jobId}/save`);
  },

  /**
   * Remove a job from saved list
   * @param {string} jobId - Job ID to unsave
   * @returns {Promise<void>}
   */
  unsaveJob: (jobId) => {
    return jobServiceClient.delete(`/api/jobs/${jobId}/save`);
  },

  /**
   * Get worker's job applications
   * @param {Object} filters - Application filters
   * @returns {Promise<Array>} - Array of job applications
   */
  getApplications: async (filters = {}) => {
    const response = await jobServiceClient.get('/jobs/applications/me', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Apply to a job
   * @param {string} jobId - Job ID to apply to
   * @param {Object} applicationData - Application details
   * @returns {Promise<Object>} - Application response
   */
  applyToJob: (jobId, applicationData) => {
    return jobServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
  },

  /**
   * Withdraw application from a job
   * @param {string} jobId - Job ID
   * @returns {Promise<void>}
   */
  withdrawApplication: (jobId) => {
    return jobServiceClient.delete(`/api/jobs/${jobId}/apply`);
  },

  /**
   * Get application status for a specific job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Application status
   */
  getApplicationStatus: (jobId) => {
    return jobServiceClient.get(`/api/jobs/${jobId}/application-status`);
  },
};

export default workerService;
