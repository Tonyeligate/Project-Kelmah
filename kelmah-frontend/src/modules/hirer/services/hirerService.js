/**
 * Hirer Service
 *
 * Service layer for hirer-related operations with proper service routing
 * and comprehensive mock data fallbacks.
 */

import { API_ENDPOINTS } from '../../../config/environment';
import { api } from '../../../services/apiClient';
import { devWarn } from '';

const hirerWarn = devWarn;

const { USER, JOB } = API_ENDPOINTS;
const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
const dashboardDataCache = {
  data: null,
  expiresAt: 0,
  promise: null,
};
const APPLICATIONS_SUMMARY_PATHS = [
  '/jobs/applications/received-summary',
  '/jobs/applications/summary/received',
];
let preferredApplicationsSummaryPath = APPLICATIONS_SUMMARY_PATHS[0];
let applicationsSummaryEndpointUnavailable = false;

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
    limit: rawPagination.limit ?? itemCount,
  };
};

const buildSummaryFromProposalsFallback = (payload, params = {}) => {
  const data = unwrapPayload(payload) || {};
  const proposalItems = Array.isArray(data?.items)
    ? data.items
    : extractCollectionItems(payload);

  const jobsById = new Map();
  proposalItems.forEach((proposal) => {
    const rawJob = proposal?.job;
    const jobId = rawJob?.id || rawJob?._id || proposal?.jobId;
    if (!jobId || jobsById.has(String(jobId))) {
      return;
    }

    jobsById.set(String(jobId), {
      id: jobId,
      title: rawJob?.title || proposal?.jobTitle || 'Job',
      status: rawJob?.status || 'open',
      applicationCounts: {
        pending: 0,
        accepted: 0,
        rejected: 0,
        under_review: 0,
        withdrawn: 0,
        total: 0,
      },
    });
  });

  proposalItems.forEach((proposal) => {
    const rawJob = proposal?.job;
    const jobId = rawJob?.id || rawJob?._id || proposal?.jobId;
    if (!jobId) {
      return;
    }

    const targetJob = jobsById.get(String(jobId));
    if (!targetJob) {
      return;
    }

    const normalizedStatus = String(proposal?.status || '').toLowerCase();
    targetJob.applicationCounts.total += 1;
    if (Object.prototype.hasOwnProperty.call(targetJob.applicationCounts, normalizedStatus)) {
      targetJob.applicationCounts[normalizedStatus] += 1;
    }
  });

  const aggregates = payload?.meta?.aggregates || {};
  const statusCounts = {
    pending: Number(aggregates?.statusCounts?.pending || 0),
    accepted: Number(aggregates?.statusCounts?.accepted || 0),
    rejected: Number(aggregates?.statusCounts?.rejected || 0),
    under_review: Number(aggregates?.statusCounts?.under_review || 0),
    withdrawn: Number(aggregates?.statusCounts?.withdrawn || 0),
  };

  const totalApplications = Number(
    aggregates?.total ?? proposalItems.length,
  );
  statusCounts.total = totalApplications;

  return {
    jobs: Array.from(jobsById.values()),
    applications: proposalItems,
    pagination: buildNormalizedPagination(payload, proposalItems.length),
    summary: {
      totalJobs: Number(aggregates?.jobCount ?? jobsById.size),
      totalApplications,
      countsByStatus: statusCounts,
    },
    filters: {
      jobId: params.jobId || null,
      status: params.status || null,
      sort: params.sort || 'newest',
    },
  };
};

const buildEmptyApplicationsSummary = (params = {}) => ({
  jobs: [],
  applications: [],
  pagination: {
    currentPage: params.page || 1,
    totalPages: 1,
    totalItems: 0,
    limit: params.limit || 0,
  },
  summary: {
    totalJobs: 0,
    totalApplications: 0,
    countsByStatus: {},
  },
  filters: {
    jobId: params.jobId || null,
    status: params.status || null,
    sort: params.sort || 'newest',
  },
});

const normalizeApplicationsSummaryPayload = (payload, params = {}) => {
  const data = unwrapPayload(payload) || {};
  const applications = Array.isArray(data?.applications) ? data.applications : [];

  return {
    jobs: Array.isArray(data?.jobs) ? data.jobs : [],
    applications,
    pagination: buildNormalizedPagination(data, applications.length),
    summary: data?.summary || {
      totalJobs: 0,
      totalApplications: 0,
      countsByStatus: {},
    },
    filters: data?.filters || {
      jobId: params.jobId || null,
      status: params.status || null,
      sort: params.sort || 'newest',
    },
  };
};

const buildMyJobsParams = ({ status, limit, includeApplications, page, search } = {}) => {
  const params = { role: 'hirer' };
  const canonicalStatus = getCanonicalJobStatus(status);

  if (canonicalStatus) {
    params.status = canonicalStatus;
  }

  if (typeof limit === 'number') {
    params.limit = limit;
  }

  if (typeof page === 'number') {
    params.page = page;
  }

  if (typeof search === 'string' && search.trim()) {
    params.search = search.trim();
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
        hirerWarn(
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
        hirerWarn('Service unavailable:', error.message);
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
        hirerWarn(
        `Job service unavailable for hirer jobs (${status}):`,
        error.message,
      );
      return [];
    }
  },

  async getJobsPage(options = {}) {
    try {
      const response = await api.get(JOB.MY_JOBS, {
        params: buildMyJobsParams(options),
      });

      const data = response?.data || {};
      const jobs = extractCollectionItems(data);
      const pagination =
        data?.meta?.pagination ||
        data?.data?.pagination ||
        data?.pagination ||
        {};

      return {
        jobs,
        pagination: {
          page: Number(pagination.page) || Number(options.page) || 1,
          totalPages: Number(pagination.totalPages) || 1,
          total: Number(pagination.total) || jobs.length,
        },
        countsByStatus: data?.meta?.countsByStatus || {},
      };
    } catch (error) {
        hirerWarn('Paged hirer jobs unavailable:', error.message);
      return {
        jobs: [],
        pagination: { page: Number(options.page) || 1, totalPages: 1, total: 0 },
        countsByStatus: {},
      };
    }
  },

  async getAllJobs(options = {}) {
    const pageSize = Math.min(Number(options.limit) || 50, 50);
    const aggregatedJobs = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const pageResult = await this.getJobsPage({
        ...options,
        page: currentPage,
        limit: pageSize,
      });

      aggregatedJobs.push(...(Array.isArray(pageResult.jobs) ? pageResult.jobs : []));
      totalPages = Number(pageResult.pagination?.totalPages) || 1;
      currentPage += 1;
    } while (currentPage <= totalPages);

    return aggregatedJobs;
  },

  // Dashboard Data
  async getDashboardData(options = {}) {
    const forceRefresh = Boolean(options?.forceRefresh);

    if (!forceRefresh && dashboardDataCache.data && dashboardDataCache.expiresAt > Date.now()) {
      return dashboardDataCache.data;
    }

    if (!forceRefresh && dashboardDataCache.promise) {
      return dashboardDataCache.promise;
    }

    try {
      dashboardDataCache.promise = Promise.allSettled([
        api.get(USER.DASHBOARD_METRICS),
        api.get(USER.DASHBOARD_WORKERS),
        api.get(USER.DASHBOARD_ANALYTICS),
        api.get(JOB.MY_JOBS, {
          params: buildMyJobsParams({ status: 'active', limit: 10 }),
        }),
      ]).then(([metricsResult, workersResult, analyticsResult, jobsResult]) => {
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

        const dashboardData = {
          metrics,
          analytics,
          activeJobs: Array.isArray(activeJobs) ? activeJobs : [],
          featuredWorkers: Array.isArray(workers) ? workers : [],
        };

        dashboardDataCache.data = dashboardData;
        dashboardDataCache.expiresAt = Date.now() + DASHBOARD_CACHE_TTL_MS;
        return dashboardData;
      });

      return await dashboardDataCache.promise;
    } catch (error) {
        hirerWarn(
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
    } finally {
      dashboardDataCache.promise = null;
    }
  },

  async getStats(timeframe = '30d') {
    try {
      const response = await api.get(USER.DASHBOARD_ANALYTICS, {
        params: { timeframe },
      });
      return unwrapPayload(response?.data) || {};
    } catch (error) {
        hirerWarn('Metrics unavailable, using fallback:', error.message);
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
        hirerWarn('Recent jobs unavailable:', error.message);
      return [];
    }
  },

  // MED-23 FIX: Actually call the API to get hirer's applications across all jobs
  async getApplications(filters = {}) {
    try {
      const limit = filters.limit ?? 10;
      const status = filters.status ?? 'active';
      const response = await api.get(JOB.MY_JOBS, {
        params: buildMyJobsParams({ status, limit, includeApplications: true }),
      });
      const jobs = extractCollectionItems(response?.data);
      // Flatten applications from all jobs
      const applications = [];
      for (const job of (Array.isArray(jobs) ? jobs : [])) {
        const jobApps = Array.isArray(job?.applications) ? job.applications : [];
        for (const app of jobApps) {
          applications.push({ ...app, jobTitle: job.title, jobId: job._id || job.id });
        }
      }
      return applications.slice(0, limit);
    } catch (error) {
        hirerWarn('Applications unavailable:', error.message);
      return [];
    }
  },

  async getApplicationsSummary(filters = {}) {
    try {
      const params = {};
      if (typeof filters.status === 'string' && filters.status.trim()) {
        params.status = filters.status.trim();
      }

      if (typeof filters.jobId === 'string' && filters.jobId.trim()) {
        params.jobId = filters.jobId.trim();
      }

      if (typeof filters.page === 'number' && filters.page > 0) {
        params.page = filters.page;
      }

      if (typeof filters.limit === 'number' && filters.limit > 0) {
        params.limit = filters.limit;
      }

      if (typeof filters.sort === 'string' && filters.sort.trim()) {
        params.sort = filters.sort.trim();
      }

      const orderedSummaryPaths = applicationsSummaryEndpointUnavailable
        ? []
        : [
          preferredApplicationsSummaryPath,
          ...APPLICATIONS_SUMMARY_PATHS.filter((path) => path !== preferredApplicationsSummaryPath),
        ];

      let lastSummaryError = null;
      for (const summaryPath of orderedSummaryPaths) {
        try {
          const response = await api.get(summaryPath, { params });
          preferredApplicationsSummaryPath = summaryPath;
          applicationsSummaryEndpointUnavailable = false;
          return normalizeApplicationsSummaryPayload(response?.data, params);
        } catch (summaryError) {
          lastSummaryError = summaryError;
          if (summaryError?.response?.status !== 404) {
            throw summaryError;
          }
        }
      }

      if (orderedSummaryPaths.length > 0) {
        applicationsSummaryEndpointUnavailable = true;
      }

      if (orderedSummaryPaths.length === 0) {
        const unavailableError = new Error('Applications summary endpoint unavailable');
        unavailableError.response = { status: 404 };
        throw unavailableError;
      }

      if (lastSummaryError && lastSummaryError?.response?.status && lastSummaryError.response.status !== 404) {
        throw lastSummaryError;
      }
    } catch (error) {
      if (error?.response?.status === 404 || applicationsSummaryEndpointUnavailable) {
        try {
          const fallbackParams = {
            ...params,
            status: params.status || 'all',
          };

          const fallbackResponse = await api.get('/jobs/proposals', {
            params: fallbackParams,
          });

          return buildSummaryFromProposalsFallback(fallbackResponse?.data, params);
        } catch (fallbackError) {
          hirerWarn('Applications summary fallback unavailable:', fallbackError.message);
          if (fallbackError?.response?.status === 404 || applicationsSummaryEndpointUnavailable) {
            return buildEmptyApplicationsSummary(params);
          }
        }
      }

      hirerWarn('Applications summary unavailable:', error.message);
      throw error;
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
        hirerWarn('Failed to fetch job applications:', error.message);
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
        hirerWarn('Failed to update application status:', error.message);
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
      hirerWarn('Worker search unavailable:', error.message);
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

      const payload = response.data?.data ?? response.data ?? {};

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
        hirerWarn('Saved workers unavailable:', error.message);
      return [];
    }
  },

  async getCompletedWorkersForReview() {
    try {
      const response = await api.get('/reviews/hirer/review-candidates');
      return extractWorkerItems(response?.data);
    } catch (error) {
        hirerWarn('Completed workers unavailable for reviews:', error.message);
      return [];
    }
  },

  async saveWorker(workerId) {
    try {
      const response = await api.post(workerBookmarkPath(workerId), {});
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
        hirerWarn('Service unavailable:', error.message);
      throw error;
    }
  },

  async unsaveWorker(workerId) {
    try {
      const response = await api.delete(workerBookmarkPath(workerId));
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
        hirerWarn('Service unavailable:', error.message);
      throw error;
    }
  },

  // Payment Management
  async releaseMilestonePayment(jobId, milestoneId, amount) {
    try {
      const response = await api.post(
        `/payments/jobs/${jobId}/milestones/${milestoneId}/release`,
        {
        amount,
        },
      );
      return unwrapPayload(response?.data) ?? response?.data ?? {};
    } catch (error) {
      hirerWarn('Service unavailable:', error.message);
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
      hirerWarn('Service unavailable:', error.message);
      throw error;
    }
  },
};
