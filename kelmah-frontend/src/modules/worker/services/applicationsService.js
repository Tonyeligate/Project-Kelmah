import { api } from '../../../services/apiClient';

/**
 * Applications Service
 * Routes through /api/jobs/* gateway endpoints (no standalone /applications mount exists)
 */

const applicationsApi = {
  /**
   * Fetch applications for the current authenticated worker
   * Gateway route: GET /api/jobs/applications/me
   */
  getMyApplications: async (params = {}) => {
    try {
      const response = await api.get('/jobs/applications/me', { params });
      return response.data.data || response.data;
    } catch (error) {
      // Graceful fallback — return empty array so My Applications page renders
      if (error.response?.status >= 500 || !error.response) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get application by ID — find within job applications
   * No dedicated gateway route; fall back gracefully
   */
  getApplicationById: async (applicationId) => {
    try {
      const response = await api.get(`/jobs/applications/${applicationId}`);
      return response.data.data || response.data;
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
   * Gateway route: DELETE /api/jobs/:jobId/applications/:applicationId (via /:id pattern)
   */
  withdrawApplication: async (applicationId) => {
    try {
      const response = await api.delete(
        `/jobs/applications/${applicationId}`,
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
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await api.put(
        `/jobs/applications/${applicationId}`,
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
      const apps = response.data.data || response.data || [];
      const list = Array.isArray(apps) ? apps : [];
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
