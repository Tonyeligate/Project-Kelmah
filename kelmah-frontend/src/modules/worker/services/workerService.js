import { api } from '../../../services/apiClient';
import { unwrapApiData } from '../../../services/responseNormalizer';
import { captureRecoverableApiError } from '../../../services/errorTelemetry';

const __DEV__ = import.meta.env.DEV;
const devWarn = (...args) => { if (__DEV__) console.warn(...args); };

const WORKERS_BASE = '/users/workers';
const WORKER_SEARCH_ENDPOINT = `${WORKERS_BASE}/search`;
const WORKER_SEARCH_ENDPOINTS = [
  WORKER_SEARCH_ENDPOINT,
  '/workers/search',
  '/search/workers',
];

const workerPath = (workerId, suffix = '') =>
  `/users/workers/${workerId}${suffix}`;

const extractLocationString = (location) => {
  if (!location) {
    return '';
  }

  if (typeof location === 'string') {
    return location;
  }

  if (typeof location === 'object') {
    return (
      location.address || location.city || location.name || location.label || ''
    );
  }

  return '';
};

const normalizeWorkerSkills = (worker = {}) => {
  if (Array.isArray(worker.skills)) {
    return worker.skills
      .map((skill) =>
        typeof skill === 'string'
          ? skill
          : skill?.name || skill?.skillName || skill?.label || '',
      )
      .filter(Boolean);
  }

  if (Array.isArray(worker.specializations)) {
    return worker.specializations.filter(Boolean);
  }

  return [];
};

const normalizeWorkerSearchRecord = (worker = {}) => {
  const id =
    worker.id ||
    worker.userId ||
    (worker._id && worker._id.toString ? worker._id.toString() : worker._id);

  return {
    ...worker,
    id,
    userId: worker.userId || id,
    name:
      worker.name ||
      [worker.firstName, worker.lastName].filter(Boolean).join(' ') ||
      'Skilled Worker',
    title:
      worker.title ||
      worker.profession ||
      (Array.isArray(worker.specializations) ? worker.specializations[0] : '') ||
      'Professional Worker',
    profession:
      worker.profession ||
      worker.title ||
      (Array.isArray(worker.specializations) ? worker.specializations[0] : '') ||
      'Professional Worker',
    location: worker.location || worker.city || 'Ghana',
    city: worker.city || extractLocationString(worker.location) || 'Ghana',
    rating: Number(worker.rating ?? worker.averageRating ?? 0),
    reviewCount: Number(worker.reviewCount ?? worker.totalReviews ?? 0),
    hourlyRate: Number(worker.hourlyRate ?? worker.rate ?? worker.minRate ?? 0),
    bio:
      worker.bio ||
      'Experienced professional delivering quality craftsmanship and reliable service.',
    skills: normalizeWorkerSkills(worker),
    availabilityStatus:
      worker.availabilityStatus || worker.availability || 'available',
    profilePicture:
      worker.profilePicture || worker.avatar || worker.profileImage || null,
    isVerified: Boolean(
      worker.isVerified || worker.verified || worker.verification?.isVerified,
    ),
    latitude:
      worker.latitude ??
      worker.location?.latitude ??
      worker.location?.coordinates?.latitude ??
      worker.location?.coordinates?.[1] ??
      null,
    longitude:
      worker.longitude ??
      worker.location?.longitude ??
      worker.location?.coordinates?.longitude ??
      worker.location?.coordinates?.[0] ??
      null,
  };
};

const extractWorkerCollection = (payload = {}) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.workers || payload?.results || payload?.items || [];
};

const extractWorkerPagination = (payload = {}, requestParams = {}) => {
  const pagination = payload?.pagination || payload?.meta?.pagination || {};
  const total =
    pagination.totalWorkers ||
    pagination.totalItems ||
    pagination.total ||
    extractWorkerCollection(payload).length;
  const limit = pagination.limit || requestParams.limit || 12;

  return {
    page: pagination.currentPage || pagination.page || requestParams.page || 1,
    limit,
    totalItems: total,
    totalPages:
      pagination.totalPages ||
      pagination.pages ||
      Math.max(1, Math.ceil(total / limit)),
    total,
  };
};

const pushUniqueSuggestion = (suggestions, seen, suggestion) => {
  if (!suggestion?.text) {
    return;
  }

  const key = `${suggestion.type || 'search'}:${String(suggestion.text).trim().toLowerCase()}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  suggestions.push(suggestion);
};

const buildWorkerSearchSuggestions = (workers = [], query = '') => {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const suggestions = [];
  const seen = new Set();

  workers.forEach((worker) => {
    const normalizedWorker = normalizeWorkerSearchRecord(worker);
    const locationText = extractLocationString(normalizedWorker.location) || normalizedWorker.city || '';
    const professionText = normalizedWorker.profession || normalizedWorker.title || '';
    const workerName = normalizedWorker.name || 'Skilled Worker';

    if (professionText) {
      pushUniqueSuggestion(suggestions, seen, {
        type: 'search',
        text: professionText,
        subText: [workerName, locationText].filter(Boolean).join(' • '),
      });
    }

    normalizeWorkerSkills(normalizedWorker)
      .filter((skill) => !normalizedQuery || skill.toLowerCase().includes(normalizedQuery))
      .slice(0, 2)
      .forEach((skill) => {
        pushUniqueSuggestion(suggestions, seen, {
          type: 'skill',
          text: skill,
          subText: [professionText || workerName, locationText].filter(Boolean).join(' • '),
        });
      });

    if (locationText && (!normalizedQuery || locationText.toLowerCase().includes(normalizedQuery))) {
      pushUniqueSuggestion(suggestions, seen, {
        type: 'location',
        text: locationText,
        subText: professionText || workerName,
        data: locationText,
      });
    }
  });

  return suggestions.slice(0, 5);
};

const buildWorkerSearchQueryParams = (params = {}) => {
  const query = {
    page: params.page || 1,
    limit: params.limit || 12,
  };

  const keyword =
    params.keyword ||
    params.query ||
    params.search ||
    params.workNeeded ||
    params.keywords;
  if (keyword) {
    query.query = keyword;
  }

  const locationValue = extractLocationString(params.location);
  if (locationValue) {
    query.location = locationValue.split(',')[0].trim();
  } else if (params.city) {
    query.location = params.city;
  }

  const latitude =
    params.latitude ??
    params.location?.coordinates?.latitude ??
    params.location?.coordinates?.[1];
  const longitude =
    params.longitude ??
    params.location?.coordinates?.longitude ??
    params.location?.coordinates?.[0];
  if (latitude !== undefined && longitude !== undefined) {
    query.latitude = latitude;
    query.longitude = longitude;
    if (params.distance || params.radius) {
      query.radius = params.distance || params.radius;
    }
  }

  const trade = params.trade || params.category || params.primaryTrade;
  if (trade) {
    query.primaryTrade = trade;
  }

  const jobType = params.jobType || params.workType || params.type;
  if (jobType) {
    query.workType = jobType;
  }

  const skills = params.skills || params.skill;
  if (Array.isArray(skills) && skills.length > 0) {
    query.skills = skills.join(',');
  } else if (typeof skills === 'string' && skills) {
    query.skills = skills;
  }

  const minRating = params.minRating || params.rating || params.minimumRating;
  if (minRating) {
    query.minRating = minRating;
  }

  const maxRate = params.budgetMax || params.maxRate;
  if (maxRate) {
    query.maxRate = maxRate;
  }

  if (params.availability || params.available) {
    query.availability = params.availability || params.available;
  }

  if (params.verifiedOnly || params.verified) {
    query.verified = 'true';
  }

  if (params.sort || params.sortBy) {
    query.sortBy = params.sort || params.sortBy;
  }

  return query;
};

const unwrapPayload = (response) =>
  unwrapApiData(response, { defaultValue: {} });

const shouldTryFallback = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501 || status === 503;
};

const requestWithFallback = async (endpoints, requestFactory) => {
  let lastError;

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    try {
      return await requestFactory(endpoint);
    } catch (error) {
      lastError = error;
      const canRetryWithFallback = index < endpoints.length - 1 && shouldTryFallback(error);
      if (!canRetryWithFallback) {
        break;
      }
    }
  }

  throw lastError;
};

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
  buildWorkerSearchQueryParams,
  normalizeWorkerSearchRecord,

  queryWorkerDirectory: async (searchParams = {}, requestOptions = {}) => {
    const queryParams = buildWorkerSearchQueryParams(searchParams);
    const response = await requestWithFallback(
      WORKER_SEARCH_ENDPOINTS,
      (endpoint) =>
        api.get(endpoint, {
          params: queryParams,
          signal: requestOptions.signal,
        }),
    );
    const payload = unwrapPayload(response);

    return {
      workers: extractWorkerCollection(payload).map(normalizeWorkerSearchRecord),
      pagination: extractWorkerPagination(payload, queryParams),
      payload,
    };
  },

  getWorkerSearchSuggestions: async (query, requestOptions = {}) => {
    const normalizedQuery = String(query || '').trim();
    if (normalizedQuery.length < 2) {
      return [];
    }

    const { workers } = await workerService.queryWorkerDirectory(
      {
        query: normalizedQuery,
        limit: 5,
        page: 1,
        sortBy: 'relevance',
      },
      requestOptions,
    );

    return buildWorkerSearchSuggestions(workers, normalizedQuery);
  },

  /**
   * Get all workers with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of worker objects
   */
  getWorkers: (filters = {}) => {
    return api.get(WORKERS_BASE, { params: filters });
  },

  /**
   * Get a specific worker by ID
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker object
   */
  getWorkerById: (workerId) => {
    return api.get(workerPath(workerId));
  },

  /**
   * Get reviews for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria for reviews
   * @returns {Promise<Array>} - Array of review objects
   */
  getWorkerReviews: (workerId, filters = {}) => {
    return api.get(workerPath(workerId, '/reviews'), {
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
    return api.post(workerPath(workerId, '/reviews'), reviewData);
  },

  /**
   * Update worker profile information
   * @param {string} workerId - Worker ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated worker profile
   */
  updateWorkerProfile: (workerId, profileData) => {
    return api.put(workerPath(workerId), profileData);
  },

  /**
   * Upload profile image for worker
   * @param {string} workerId - Worker ID
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} - Upload response
   */
  uploadProfileImage: (workerId, formData) => {
    return api.post(workerPath(workerId, '/image'), formData, {
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
    return api.get(workerPath(workerId, '/skills'));
  },

  /**
   * Get credentials (skills, licenses, certifications) for the authenticated worker
   * @returns {Promise<{ skills: Array, licenses: Array, certifications: Array }>}
   */
  getMyCredentials: async () => {
    // Canonical endpoint: /users/me/credentials (verified in user-service routes)
    let payload = {};
    try {
      const response = await api.get('/users/me/credentials');
      payload = response?.data?.data ?? response?.data ?? {};
    } catch (error) {
      devWarn('Credentials endpoint unavailable:', error.message);
      captureRecoverableApiError(error, {
        operation: 'workers.getMyCredentials.primary',
        fallbackUsed: true,
        suppressUi: true,
      });
      // Fallback: try /users/profile
      try {
        const fallback = await api.get('/users/profile');
        payload = fallback?.data?.data ?? fallback?.data ?? {};
      } catch (fallbackError) {
        captureRecoverableApiError(fallbackError, {
          operation: 'workers.getMyCredentials.fallback',
          fallbackUsed: true,
          suppressUi: true,
        });
        // Return empty credentials
      }
    }

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
    return api.post(workerPath(workerId, '/skills'), skillData);
  },

  /**
   * Update worker skill
   * @param {string} workerId - Worker ID
   * @param {string} skillId - Skill ID
   * @param {Object} skillData - Updated skill data
   * @returns {Promise<Object>} - Updated skill object
   */
  updateWorkerSkill: (workerId, skillId, skillData) => {
    return api.put(workerPath(workerId, `/skills/${skillId}`), skillData);
  },

  /**
   * Delete worker skill
   * @param {string} workerId - Worker ID
   * @param {string} skillId - Skill ID
   * @returns {Promise<void>}
   */
  deleteWorkerSkill: (workerId, skillId) => {
    return api.delete(workerPath(workerId, `/skills/${skillId}`));
  },

  /**
   * Get portfolio items for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of portfolio items
   */
  getWorkerPortfolio: (workerId) => {
    return api.get(workerPath(workerId, '/portfolio'));
  },

  /**
   * Add portfolio item to worker
   * @param {string} workerId - Worker ID
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Added portfolio item
   */
  addPortfolioItem: (workerId, portfolioData) => {
    return api.post(workerPath(workerId, '/portfolio'), portfolioData);
  },

  /**
   * Update portfolio item
   * @param {string} workerId - Worker ID
   * @param {string} portfolioId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  updatePortfolioItem: (workerId, portfolioId, portfolioData) => {
    return api.put(
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
    return api.delete(workerPath(workerId, `/portfolio/${portfolioId}`));
  },

  /**
   * Get certificates for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of certificate objects
   */
  getWorkerCertificates: (workerId) => {
    return api.get(workerPath(workerId, '/certificates'));
  },

  /**
   * Add certificate to worker
   * @param {string} workerId - Worker ID
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} - Added certificate
   */
  addCertificate: (workerId, certificateData) => {
    return api.post(workerPath(workerId, '/certificates'), certificateData);
  },

  /**
   * Update certificate
   * @param {string} workerId - Worker ID
   * @param {string} certificateId - Certificate ID
   * @param {Object} certificateData - Updated certificate data
   * @returns {Promise<Object>} - Updated certificate
   */
  updateCertificate: (workerId, certificateId, certificateData) => {
    return api.put(
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
    return api.delete(workerPath(workerId, `/certificates/${certificateId}`));
  },

  /**
   * Get work history for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Array>} - Array of work history items
   */
  getWorkHistory: (workerId) => {
    return api.get(workerPath(workerId, '/work-history'));
  },

  /**
   * Add work history item
   * @param {string} workerId - Worker ID
   * @param {Object} workHistoryData - Work history data
   * @returns {Promise<Object>} - Added work history item
   */
  addWorkHistory: (workerId, workHistoryData) => {
    return api.post(workerPath(workerId, '/work-history'), workHistoryData);
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
      response = await api.get(workerPath(workerId, '/availability'));
    } catch (error) {
      const status = error?.response?.status;
      if (status && status !== 404 && status !== 405) {
        throw error;
      }

      captureRecoverableApiError(error, {
        operation: 'workers.getWorkerAvailability',
        fallbackUsed: true,
        suppressUi: true,
      });

      return attachMetadata({
        status: 'not_set',
        isAvailable: false,
        timezone: 'Africa/Accra',
        daySlots: [],
        schedule: [],
        nextAvailable: null,
        message: 'Availability not configured',
        pausedUntil: null,
        lastUpdated: null,
      }, {
        fallback: true,
        fallbackReason: 'availability-endpoint-unavailable',
      });
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

    const payload = {
      availabilityStatus:
        availabilityData?.availabilityStatus || availabilityData?.status || 'available',
      availableHours:
        availabilityData?.availableHours && typeof availabilityData.availableHours === 'object'
          ? availabilityData.availableHours
          : {},
      pausedUntil: availabilityData?.pausedUntil ?? null,
    };

    await api.put(workerPath(workerId), payload);

    const status = payload.availabilityStatus;

    const normalized = {
      status,
      isAvailable: status === 'available' || status === true,
      timezone: 'Africa/Accra',
      daySlots: Array.isArray(availabilityData?.daySlots) ? availabilityData.daySlots : [],
      schedule: Array.isArray(availabilityData?.schedule) ? availabilityData.schedule : [],
      nextAvailable: availabilityData?.nextAvailable ?? null,
      message: availabilityData?.message || null,
      pausedUntil: payload.pausedUntil,
      lastUpdated: new Date().toISOString(),
      availableHours: payload.availableHours,
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

    const response = await api.get(workerPath(workerId, '/completeness'));
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
    const response = await api.get(`${WORKERS_BASE}/jobs/recent`, {
      params: { limit },
    });

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
    return api.get(workerPath(workerId, '/earnings'), {
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

    const response = await api.get(`/users/analytics/worker/${workerId}`);

    return response?.data?.data ?? response?.data ?? {};
  },

  /**
   * Get nearby workers based on location
   * @param {Object} locationData - Location coordinates and filters
   * @returns {Promise<Array>} - Array of nearby workers
   */
  getNearbyWorkers: (locationData) => {
    return api.post(`${WORKERS_BASE}/nearby`, locationData);
  },

  /**
   * Search workers with various filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchWorkers: (searchParams) => {
    return workerService
      .queryWorkerDirectory(searchParams)
      .then((result) => result.workers);
  },

  /**
   * Bookmark a worker profile
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  bookmarkWorker: (workerId) => {
    return api.post(workerPath(workerId, '/bookmark'));
  },

  /**
   * Get list of bookmarked worker IDs for current user
   * @returns {Promise<{workerIds: string[]}>}
   */
  getBookmarks: () => {
    return api.get(`/users/bookmarks`);
  },

  /**
   * Remove bookmark from worker profile
   * @param {string} workerId - Worker ID
   * @returns {Promise<void>}
   */
  removeBookmark: (workerId) => {
    return api.delete(workerPath(workerId, '/bookmark'));
  },

  /**
   * Report a worker profile
   * @param {string} workerId - Worker ID
   * @param {Object} reportData - Report data
   * @returns {Promise<void>}
   */
  reportWorker: (workerId, reportData) => {
    return api.post(workerPath(workerId, '/report'), reportData);
  },

  /**
   * Get worker verification status
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Verification status
   */
  getVerificationStatus: (workerId) => {
    return api.get(workerPath(workerId, '/verification'));
  },

  /**
   * Request worker verification
   * @param {string} workerId - Worker ID
   * @param {Object} verificationData - Verification documents and data
   * @returns {Promise<Object>} - Verification request response
   */
  requestVerification: (workerId, verificationData) => {
    return api.post(workerPath(workerId, '/verification'), verificationData);
  },

  /**
   * Get recommended workers based on user preferences
   * @param {Object} preferences - User preferences and filters
   * @returns {Promise<Array>} - Array of recommended workers
   */
  getRecommendedWorkers: (preferences = {}) => {
    return api.get(`${WORKERS_BASE}/recommended`, {
      params: preferences,
    });
  },

  /**
   * Get saved jobs for current worker
   * @returns {Promise<Array>} - Array of saved jobs
   */
  getSavedJobs: async () => {
    const response = await api.get('/jobs/saved');
    return response.data;
  },

  /**
   * Save a job for later
   * @param {string} jobId - Job ID to save
   * @returns {Promise<void>}
   */
  saveJob: (jobId) => {
    return api.post(`/jobs/${jobId}/save`);
  },

  /**
   * Remove a job from saved list
   * @param {string} jobId - Job ID to unsave
   * @returns {Promise<void>}
   */
  unsaveJob: (jobId) => {
    return api.delete(`/jobs/${jobId}/save`);
  },

  /**
   * Get worker's job applications
   * @param {Object} filters - Application filters
   * @returns {Promise<Array>} - Array of job applications
   */
  getApplications: async (filters = {}) => {
    const response = await api.get('/jobs/applications/me', {
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
    return api.post(`/jobs/${jobId}/apply`, applicationData);
  },

  /**
   * Withdraw application from a job
   * @param {string} jobId - Job ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<void>}
   */
  withdrawApplication: (jobId, applicationId) => {
    if (!jobId || !applicationId) {
      throw new Error('jobId and applicationId are required to withdraw application');
    }
    return api.delete(`/jobs/${jobId}/applications/${applicationId}`);
  },

  /**
   * Get application status for a specific job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Application status
   */
  getApplicationStatus: async (jobId) => {
    if (!jobId) {
      throw new Error('jobId is required to get application status');
    }

    // Pass jobId filter and limit to avoid fetching ALL applications (M-FE8).
    // The server filters when it supports the param; the client-side find()
    // below acts as a safety net for backward compatibility.
    const response = await api.get('/jobs/applications/me', {
      params: { jobId, limit: 1 },
    });
    const applications = response?.data?.data ?? response?.data ?? [];
    const list = Array.isArray(applications) ? applications : [];
    const match = list.find(
      (application) =>
        application?.job?._id === jobId ||
        application?.job?.id === jobId ||
        application?.jobId === jobId,
    );

    return {
      hasApplied: Boolean(match),
      status: match?.status || null,
      application: match || null,
    };
  },
};

export default workerService;
