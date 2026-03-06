import { api } from '../../../services/apiClient';

const DISPLAY_KEYS = ['label', 'name', 'title', 'value', 'type', 'city', 'address', 'text'];

const toDisplayString = (value, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => toDisplayString(item))
      .filter(Boolean);
    return parts.join(', ') || fallback;
  }

  if (value && typeof value === 'object') {
    for (const key of DISPLAY_KEYS) {
      const resolved = toDisplayString(value[key]);
      if (resolved) {
        return resolved;
      }
    }
  }

  return fallback;
};

const normalizeStatus = (status) =>
  toDisplayString(status, 'unknown')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

const normalizeJob = (job = {}) => ({
  ...job,
  id: job.id || job._id || null,
  title: toDisplayString(job.title, 'Untitled Job'),
  category: toDisplayString(job.category, '—'),
  location: toDisplayString(job.location, 'Unknown location'),
});

const normalizeApplication = (application = {}, index = 0) => ({
  ...application,
  id: application.id || application._id || `application-${index}`,
  status: normalizeStatus(application.status),
  company: toDisplayString(application.company, 'Unknown'),
  jobTitle: toDisplayString(application.jobTitle, 'Untitled Job'),
  createdAt: application.createdAt || application.appliedDate || null,
  appliedDate: application.appliedDate || application.createdAt || null,
  job: application.job ? normalizeJob(application.job) : null,
});

/**
 * Applications Service
 * Routes through /api/jobs/* gateway endpoints (no standalone /applications mount exists)
 */

const applicationsApi = {
  normalizeApplicationList: (payload) => {
    const rawList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.applications)
          ? payload.applications
          : [];

    return rawList.map((application, index) =>
      normalizeApplication(application, index),
    );

  },

  /**
   * Fetch applications for the current authenticated worker
   * Gateway route: GET /api/jobs/applications/me
   */
  getMyApplications: async (params = {}) => {
    try {
      const response = await api.get('/jobs/applications/me', { params });
      const payload = response.data?.data || response.data;
      return applicationsApi.normalizeApplicationList(payload);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get application by ID (job-scoped)
   * Gateway route: GET /api/jobs/:jobId/applications
   */
  getApplicationById: async (jobId, applicationId) => {
    if (!jobId || !applicationId) {
      return null;
    }
    try {
      const response = await api.get(`/jobs/${jobId}/applications`);
      const list = response.data.data || response.data || [];
      if (!Array.isArray(list)) {
        return null;
      }
      const found = list.find(
          (application) =>
            application?._id === applicationId ||
            application?.id === applicationId,
        ) || null;
      return found ? normalizeApplication(found, 0) : null;
    } catch {
      return null;
    }
  },

  /**
   * Submit a new job application
   * Gateway route: POST /api/jobs/:id/apply
   */
  submitApplication: async (jobId, applicationData) => {
    const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
    return normalizeApplication(response.data.data || response.data, 0);
  },

  /**
   * Withdraw an application
   * Gateway route: DELETE /api/jobs/:jobId/applications/:applicationId
   */
  withdrawApplication: async (jobId, applicationId) => {
    if (!jobId || !applicationId) {
      return { success: false, message: 'jobId and applicationId are required' };
    }
    try {
      const response = await api.delete(
        `/jobs/${jobId}/applications/${applicationId}`,
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, message: 'Application not found or already withdrawn' };
      }
      throw error;
    }
  },

  /**
   * Update application (if allowed)
   */
  updateApplication: async (jobId, applicationId, updateData) => {
    if (!jobId || !applicationId) {
      return null;
    }
    try {
      const response = await api.put(
        `/jobs/${jobId}/applications/${applicationId}`,
        updateData,
      );
      return normalizeApplication(response.data.data || response.data, 0);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get application statistics — no dedicated backend endpoint yet
   * Returns sensible defaults so dashboard widgets render
   */
  getApplicationStats: async () => {
    try {
      const response = await api.get('/jobs/applications/me');
      const payload = response.data?.data || response.data;
      const list = applicationsApi.normalizeApplicationList(payload);
      return {
        total: list.length,
        pending: list.filter((a) => a.status === 'pending').length,
        accepted: list.filter((a) => a.status === 'accepted').length,
        rejected: list.filter((a) => a.status === 'rejected').length,
      };
    } catch {
      return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    }
  },
};

export default applicationsApi;
