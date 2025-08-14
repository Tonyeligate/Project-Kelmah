import { jobServiceClient } from '../../common/services/axios';

// Use centralized jobServiceClient with auth/retries

// No mock data - using real API only

const applicationsApi = {
  /**
   * Fetch applications for the current authenticated worker
   */
  getMyApplications: async (params = {}) => {
    try {
      const response = await jobServiceClient.get(
        '/api/applications/my-applications',
        { params },
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch applications:', error.message);
      throw error;
    }
  },

  /**
   * Get application by ID
   */
  getApplicationById: async (applicationId) => {
    try {
      const response = await jobServiceClient.get(
        `/api/applications/${applicationId}`,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for application details:', error.message);
      throw error;
    }
  },

  /**
   * Submit a new job application
   */
  submitApplication: async (jobId, applicationData) => {
    try {
      const response = await jobServiceClient.post(
        `/api/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for application submission:', error.message);
      throw error;
    }
  },

  /**
   * Withdraw an application
   */
  withdrawApplication: async (applicationId) => {
    try {
      const response = await jobServiceClient.delete(
        `/api/applications/${applicationId}`,
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  /**
   * Update application (if allowed)
   */
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await jobServiceClient.put(
        `/api/applications/${applicationId}`,
        updateData,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  /**
   * Get application statistics
   */
  getApplicationStats: async () => {
    try {
      const response = await jobServiceClient.get('/api/applications/stats');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch application statistics:', error.message);
      throw new Error(`Application stats service unavailable: ${error.message}`);
    }
  },
};

export default applicationsApi;
