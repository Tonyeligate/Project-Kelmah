import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated job service client for applications
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
jobServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

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
