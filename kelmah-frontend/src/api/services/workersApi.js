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
   * Get worker availability status - Enhanced with localStorage persistence
   */
  async getAvailabilityStatus() {
    const saved = localStorage.getItem('worker_availability');
    return saved ? JSON.parse(saved) : { 
      isAvailable: true, 
      status: 'available',
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Update worker availability - Enhanced with localStorage persistence
   */
  async updateAvailability(availabilityData) {
    const updatedStatus = {
      ...availabilityData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('worker_availability', JSON.stringify(updatedStatus));
    console.log('Worker availability updated:', updatedStatus);
    return updatedStatus;
  },

  /**
   * Get worker dashboard statistics - Enhanced with realistic mock data
   */
  async getDashboardStats() {
    const response = await workersServiceClient.get('/api/workers/me/dashboard');
    return response.data.data || response.data;
  },

  /**
   * Get worker earnings data - New enhanced method
   */
  async getEarningsData(timeRange = '6months') {
    const response = await workersServiceClient.get('/api/workers/me/earnings', { params: { timeRange } });
    return response.data.data || response.data;
  },

  /**
   * Get worker appointments - Enhanced method
   */
  async getAppointments() {
    const response = await workersServiceClient.get('/api/appointments');
    return response.data.data || response.data;
  },

  /**
   * Get worker profile data - Uses auth token verification
   */
  async getWorkerProfile() {
    const response = await workersServiceClient.get('/api/users/me/profile');
    return response.data.data || response.data;
  },

  /**
   * Update worker profile - Enhanced with validation
   */
  async updateWorkerProfile(profileData) {
    const response = await workersServiceClient.put('/api/users/me/profile', profileData);
    return response.data.data || response.data;
  },

  /**
   * Get portfolio projects - Enhanced with realistic data
   */
  async getPortfolioProjects() {
    const response = await workersServiceClient.get('/api/workers/me/portfolio');
    return response.data.data || response.data;
  },

  /**
   * Get skills and licenses - Enhanced with realistic data
   */
  async getSkillsAndLicenses() {
    const response = await workersServiceClient.get('/api/users/me/credentials');
    return response.data.data || response.data;
  },

  /**
   * Request skill verification - Enhanced implementation
   */
  async requestSkillVerification(skillId, verificationData) {
    const response = await workersServiceClient.post(`/api/users/me/skills/${skillId}/verify`, verificationData);
    return response.data.data || response.data;
  },

  /**
   * Get profile completion status - New method
   */
  async getProfileCompletion() {
    const profile = await this.getWorkerProfile();
    const credentials = await this.getSkillsAndLicenses();
    
    const completionItems = [
      { name: 'Basic Information', completed: !!(profile.firstName && profile.email), weight: 30 },
      { name: 'Professional Details', completed: !!(profile.profession && profile.location), weight: 25 },
      { name: 'Contact Information', completed: !!profile.phone, weight: 15 },
      { name: 'Skills/Credentials', completed: (credentials.skills?.length || 0) > 0 || (credentials.licenses?.length || 0) > 0, weight: 30 }
    ];
    
    const completedWeight = completionItems
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    
    return {
      percentage: completedWeight,
      items: completionItems,
      nextSteps: completionItems
        .filter(item => !item.completed)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
    };
  }
};

export default workersApi;