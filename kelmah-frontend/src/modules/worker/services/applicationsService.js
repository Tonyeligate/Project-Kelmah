import { api } from '../../../services/apiClient';

/**
 * Applications Service
 * Routes through /api/jobs/* gateway endpoints (no standalone /applications mount exists)
 */

const applicationsApi = {
  normalizeApplicationList: (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    if (Array.isArray(payload?.applications)) {
      return payload.applications;
    }

    return [];
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
      // Graceful fallback — return empty array so My Applications page renders
      if (error.response?.status >= 500 || !error.response) {
        return [];
      }
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
      return (
        list.find(
          (application) =>
            application?._id === applicationId ||
            application?.id === applicationId,
        ) || null
      );
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
    return response.data.data || response.data;
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
      return response.data.data || response.data;
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
