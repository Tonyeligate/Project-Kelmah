/**
 * Hirer Service
 *
 * Service layer for hirer-related operations with proper service routing
 * and comprehensive mock data fallbacks.
 */

import { API_ENDPOINTS } from '../../../config/environment';
import { api } from '../../../services/apiClient';

const { USER, JOB } = API_ENDPOINTS;

const JOB_STATUS_MAP = {
  active: 'open',
  all: null,
  open: 'open',
  completed: 'completed',
  'in-progress': 'in-progress',
  cancelled: 'cancelled',
  draft: 'draft',
  expired: 'expired',
  pending: 'pending',
  closed: 'closed',
};

const getCanonicalJobStatus = (status) => {
  if (typeof status !== 'string') {
    return status;
  }

  const normalizedStatus = status.trim();
  if (!normalizedStatus) {
    return undefined;
  }

  return JOB_STATUS_MAP[normalizedStatus] !== undefined
    ? JOB_STATUS_MAP[normalizedStatus]
    : normalizedStatus;
};

const unwrapPayload = (payload) => payload?.data ?? payload ?? null;

const extractCollectionItems = (payload) => {
  const data = unwrapPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.jobs)) {
    return data.jobs;
  }

  if (Array.isArray(data?.applications)) {
    return data.applications;
  }

  return [];
};

const extractWorkerItems = (payload) => {
  const data = unwrapPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.workers)) {
    return data.workers;
  }

  return [];
};

const buildNormalizedPagination = (payload, itemCount = 0) => {
  const rawPagination =
    payload?.meta?.pagination ||
    payload?.pagination ||
    payload?.data?.pagination ||
    unwrapPayload(payload)?.pagination ||
    {};

  return {
    currentPage: rawPagination.currentPage ?? rawPagination.page ?? 1,
    totalPages: rawPagination.totalPages ?? 1,
    totalItems: rawPagination.totalItems ?? rawPagination.total ?? itemCount,
  };
};

const buildMyJobsParams = ({ status, limit, includeApplications } = {}) => {
  const params = { role: 'hirer' };
  const canonicalStatus = getCanonicalJobStatus(status);

  if (canonicalStatus) {
    params.status = canonicalStatus;
  }

  if (typeof limit === 'number') {
    params.limit = limit;
  }

  if (includeApplications) {
    params.includeApplications = true;
  }

  return params;
};

const workerBookmarkPath = (workerId) => {
  if (typeof USER.WORKER_BOOKMARK === 'function') {
    return USER.WORKER_BOOKMARK(workerId);
  }
  // FIXED: Removed /api prefix - apiClient.baseURL already includes '/api'
  return `/users/workers/${workerId}/bookmark`;
};

// Clients come preconfigured with auth and retries

// No mock data - using real API data only

export const hirerService = {
  // Profile Management
  async getProfile() {
    // Canonical endpoint: /users/me/credentials (verified in user-service routes)
    try {
      const response = await api.get(USER.ME_CREDENTIALS);
      return unwrapPayload(response?.data) || {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'User service unavailable for hirer profile:',
        error.message,
      );
      // Fallback: try /users/profile as secondary endpoint
      try {
        const fallback = await api.get('/users/profile');
        return unwrapPayload(fallback?.data) || {};
      } catch (_) {
        throw error;
      }
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put(USER.UPDATE, profileData);
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Job Management
  async getJobs(status = 'active') {
    try {
      const response = await api.get(JOB.MY_JOBS, {
        params: buildMyJobsParams({ status }),
      });
      return extractCollectionItems(response?.data);
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        `Job service unavailable for hirer jobs (${status}):`,
        error.message,
      );
      return [];
    }
  },

  // Dashboard Data
  async getDashboardData() {
    try {
      const [metricsResult, workersResult, analyticsResult, jobsResult] =
        await Promise.allSettled([
          api.get(USER.DASHBOARD_METRICS),
          api.get(USER.DASHBOARD_WORKERS),
          api.get(USER.DASHBOARD_ANALYTICS),
          api.get(JOB.MY_JOBS, {
            params: buildMyJobsParams({ status: 'active', limit: 10 }),
          }),
        ]);

      const metrics =
        metricsResult.status === 'fulfilled'
          ? (unwrapPayload(metricsResult.value?.data) || {})
          : {};
      const workers =
        workersResult.status === 'fulfilled'
          ? extractWorkerItems(workersResult.value?.data)
          : [];
      const analytics =
        analyticsResult.status === 'fulfilled'
          ? (unwrapPayload(analyticsResult.value?.data) || {})
          : {};
      const activeJobs =
        jobsResult.status === 'fulfilled'
          ? extractCollectionItems(jobsResult.value?.data)
          : [];

      return {
        metrics,
        analytics,
        activeJobs: Array.isArray(activeJobs) ? activeJobs : [],
        featuredWorkers: Array.isArray(workers) ? workers : [],
      };
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'Dashboard data unavailable, using fallback:',
        error.message,
      );
      // FIX H4: Return fallback dashboard data matching the success path shape
      return {
        metrics: {
          activeJobs: 0,
          totalApplications: 0,
          newApplications: 0,
          hiredWorkers: 0,
        },
        analytics: {},
        activeJobs: [],
        featuredWorkers: [],
      };
    }
  },

  async getStats(timeframe = '30d') {
    try {
      const response = await api.get(USER.DASHBOARD_ANALYTICS, {
        params: { timeframe },
      });
      return unwrapPayload(response?.data) || {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Metrics unavailable, using fallback:', error.message);
      return {
        activeJobs: 0,
        totalJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        totalSpent: 0,
        monthlySpent: 0,
        hiredWorkers: 0,
        activeWorkers: 0,
      };
    }
  },

  async getRecentJobs(limit = 10) {
    try {
      const response = await api.get(JOB.MY_JOBS, {
        params: buildMyJobsParams({ status: 'active', limit }),
      });
      return extractCollectionItems(response?.data);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Recent jobs unavailable:', error.message);
      return [];
    }
  },

  // MED-23 FIX: Actually call the API to get hirer's applications across all jobs
  async getApplications(filters = {}) {
    try {
      const limit = filters.limit || 10;
      const status = filters.status || 'active';
      const response = await api.get(JOB.MY_JOBS, {
        params: buildMyJobsParams({ status, limit, includeApplications: true }),
      });
      const jobs = extractCollectionItems(response?.data);
      // Flatten applications from all jobs
      const applications = [];
      for (const job of (Array.isArray(jobs) ? jobs : [])) {
        const jobApps = job.applications || [];
        for (const app of jobApps) {
          applications.push({ ...app, jobTitle: job.title, jobId: job._id || job.id });
        }
      }
      return applications.slice(0, limit);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Applications unavailable:', error.message);
      return [];
    }
  },

  // Applications for a specific job (hirer)
  async getJobApplications(jobId, status) {
    try {
      if (!jobId) return [];
      const params = {};
      if (status) params.status = status;
      const response = await api.get(`/jobs/${jobId}/applications`, { params });
      return extractCollectionItems(response?.data);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to fetch job applications:', error.message);
      return [];
    }
  },

  async updateApplicationStatus(jobId, applicationId, status, feedback) {
    try {
      if (!jobId || !applicationId) {
        throw new Error('jobId and applicationId are required');
      }
      const body = { status };
      if (typeof feedback === 'string' && feedback.trim()) {
        body.feedback = feedback.trim();
      }
      const response = await api.put(
        `/jobs/${jobId}/applications/${applicationId}`,
        body,
      );
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to update application status:', error.message);
      throw error;
    }
  },

  searchWorkers: async (searchParams = {}) => {
    try {
      const response = await api.get(USER.WORKERS_SEARCH, {
        params: searchParams,
      });
      const workers = extractWorkerItems(response?.data);
      return {
        workers,
        pagination: buildNormalizedPagination(response?.data, workers.length),
      };
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Worker search unavailable:', error.message);
      return {
        workers: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      };
    }
  },

  async getSavedWorkers() {
    try {
      let response;
      try {
        response = await api.get(USER.BOOKMARKS);
      } catch (primaryError) {
        if (primaryError?.response?.status !== 404) {
          throw primaryError;
        }
        response = await api.get('/bookmarks');
      }

      const payload = response.data?.data || response.data || {};

      if (Array.isArray(payload.workerIds)) {
        return payload.workerIds.map((id) => String(id));
      }

      if (Array.isArray(payload.bookmarks)) {
        return payload.bookmarks
          .map((entry) => entry?.workerId || entry?.worker?._id || entry?.worker?.id)
          .filter(Boolean)
          .map((id) => String(id));
      }

      if (Array.isArray(payload)) {
        return payload
          .map((entry) => entry?.workerId || entry?._id || entry?.id)
          .filter(Boolean)
          .map((id) => String(id));
      }

      return [];
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Saved workers unavailable:', error.message);
      return [];
    }
  },

  async getCompletedWorkersForReview() {
    try {
      const response = await api.get('/reviews/hirer/review-candidates');
      return extractWorkerItems(response?.data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Completed workers unavailable for reviews:', error.message);
      }
      return [];
    }
  },

  async saveWorker(workerId) {
    try {
      const response = await api.post(workerBookmarkPath(workerId), {});
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  async unsaveWorker(workerId) {
    try {
      const response = await api.delete(workerBookmarkPath(workerId));
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Payment Management
  async releaseMilestonePayment(jobId, milestoneId, amount) {
    try {
      const response = await api.post('/payments/escrow/release', {
        jobId,
        milestoneId,
        amount,
      });
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Review Management
  async createWorkerReview(workerId, jobId, reviewData) {
    try {
      const sanitizedReviewData =
        reviewData && typeof reviewData === 'object' ? reviewData : {};
      const {
        workerId: _ignoredWorkerId,
        jobId: _ignoredJobId,
        ...safeReviewData
      } = sanitizedReviewData;

      const response = await api.post('/reviews', {
        ...safeReviewData,
        workerId,
        jobId,
      });
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Service unavailable:', error.message);
      throw error;
    }
  },
};
