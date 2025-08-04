/**
 * Workers API Service
 * Handles worker-specific operations like availability, dashboard stats, etc.
 */

import axios from 'axios';
import { SERVICES } from '../../config/environment';

// Create workers service client - using AUTH_SERVICE since USER_SERVICE doesn't have worker endpoints yet
const workersServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE, // Using auth service as fallback until user service is updated
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
workersServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const workersApi = {
  /**
   * Get worker availability status - Fallback implementation
   */
  async getAvailabilityStatus() {
    // Since backend doesn't have this endpoint yet, return default status
    return { isAvailable: true, status: 'available' };
  },

  /**
   * Update worker availability - Fallback implementation
   */
  async updateAvailability(availabilityData) {
    // Since backend doesn't have this endpoint yet, just return the requested status
    console.log('Worker availability updated:', availabilityData);
    return { isAvailable: availabilityData.isAvailable };
  },

  /**
   * Get worker dashboard statistics - Fallback implementation
   */
  async getDashboardStats() {
    // Since backend doesn't have this endpoint yet, return basic stats
    return {
      totalApplications: 0,
      activeContracts: 0,
      completedJobs: 0,
      earnings: 0,
      rating: 0
    };
  },

  /**
   * Get worker profile data - Uses auth token verification
   */
  async getWorkerProfile() {
    try {
      const response = await workersServiceClient.get('/api/auth/verify');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch worker profile:', error.message);
      throw new Error(`Worker profile service unavailable: ${error.message}`);
    }
  },

  /**
   * Update worker profile - Not implemented yet
   */
  async updateWorkerProfile(profileData) {
    console.log('Profile update requested:', profileData);
    throw new Error('Profile update not yet implemented in backend');
  },

  /**
   * Get portfolio projects - Fallback implementation
   */
  async getPortfolioProjects() {
    // Since backend doesn't have this endpoint yet, return empty portfolio
    return [];
  },

  /**
   * Get skills and licenses - Fallback implementation
   */
  async getSkillsAndLicenses() {
    // Since backend doesn't have this endpoint yet, return empty skills/licenses
    return {
      skills: [],
      licenses: []
    };
  },

  /**
   * Request skill verification - Fallback implementation
   */
  async requestSkillVerification(skillId, verificationData) {
    console.log('Skill verification requested:', skillId, verificationData);
    throw new Error('Skill verification not yet implemented in backend');
  }
};

export default workersApi;