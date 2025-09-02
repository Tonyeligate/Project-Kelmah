/**
 * Hirers API Service
 * Handles hirer profiles and hirer-related operations
 */

import apiClient from '../index';
import { userServiceClient as hirersServiceClient } from '../../modules/common/services/axios';

class HirersApi {
  /**
   * Get hirer profile by ID
   * @param {string} hirerId - Hirer ID
   * @returns {Promise<Object>} Hirer profile data
   */
  async getHirerById(hirerId) {
    const response = await apiClient.get(`/hirers/${hirerId}`);
    return response.data;
  }

  /**
   * Get current hirer's profile
   * @returns {Promise<Object>} Current hirer profile
   */
  async getMyHirerProfile() {
    const response = await apiClient.get('/hirers/me');
    return response.data;
  }

  /**
   * Update hirer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateHirerProfile(profileData) {
    const response = await apiClient.put('/hirers/me', profileData);
    return response.data;
  }

  /**
   * Upload hirer profile image
   * @param {FormData} formData - Form data with image file
   * @returns {Promise<Object>} Upload response
   */
  async uploadProfileImage(formData) {
    const response = await apiClient.post('/hirers/me/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Dashboard-specific methods
  async getDashboardData() {
    try {
      const response = await hirersServiceClient.get('/api/users/hirers/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Hirers dashboard API unavailable, using mock data');
      return this.getMockDashboardData();
    }
  }

  async getActiveJobs(limit = 10) {
    try {
      const response = await hirersServiceClient.get(`/api/users/hirers/jobs/active?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Active jobs API unavailable, using mock data');
      return this.getMockActiveJobs();
    }
  }

  async getRecentApplications(limit = 10) {
    try {
      const response = await hirersServiceClient.get(`/api/users/hirers/applications/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Recent applications API unavailable, using mock data');
      return this.getMockRecentApplications();
    }
  }

  async getMetrics(timeframe = '30d') {
    try {
      const response = await hirersServiceClient.get(`/api/users/hirers/metrics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.warn('Metrics API unavailable, using mock data');
      return this.getMockMetrics();
    }
  }

  // Mock data methods
  getMockDashboardData() {
    return {
      metrics: this.getMockMetrics(),
      activeJobs: this.getMockActiveJobs(),
      recentApplications: this.getMockRecentApplications(),
      analytics: this.getMockAnalytics(),
    };
  }

  getMockMetrics() {
    return {
      activeJobs: Math.floor(Math.random() * 20) + 5,
      totalJobs: Math.floor(Math.random() * 100) + 20,
      totalApplications: Math.floor(Math.random() * 500) + 100,
      newApplications: Math.floor(Math.random() * 50) + 10,
      totalSpent: Math.floor(Math.random() * 50000) + 10000,
      monthlySpent: Math.floor(Math.random() * 5000) + 1000,
      hiredWorkers: Math.floor(Math.random() * 30) + 5,
      activeWorkers: Math.floor(Math.random() * 15) + 2,
      // Changes for trending indicators
      jobsChange: Math.floor(Math.random() * 20) - 5,
      applicationsChange: Math.floor(Math.random() * 30) + 5,
      spendingChange: Math.floor(Math.random() * 25) - 10,
      hiresChange: Math.floor(Math.random() * 15) + 2,
    };
  }

  getMockActiveJobs() {
    return [
      {
        id: 1,
        title: 'Senior React Developer',
        budget: 5000,
        applicationsCount: Math.floor(Math.random() * 25) + 5,
        status: 'Active',
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Looking for an experienced React developer for a large-scale project',
        skills: ['React', 'Redux', 'TypeScript', 'Node.js'],
      },
      {
        id: 2,
        title: 'UI/UX Designer for Mobile App',
        budget: 3500,
        applicationsCount: Math.floor(Math.random() * 20) + 8,
        status: 'Active',
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Need a creative designer for our fintech mobile application',
        skills: ['Figma', 'Sketch', 'Prototyping', 'User Research'],
      },
      {
        id: 3,
        title: 'Content Marketing Specialist',
        budget: 2000,
        applicationsCount: Math.floor(Math.random() * 15) + 3,
        status: 'Active',
        postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Seeking a marketing expert to boost our online presence',
        skills: ['Content Marketing', 'SEO', 'Social Media', 'Analytics'],
      },
    ];
  }

  getMockRecentApplications() {
    const workerNames = [
      'Kwame Asante', 'Ama Osei', 'Kofi Mensah', 'Akosua Adjei',
      'Yaw Boateng', 'Efua Annan', 'Kwaku Owusu', 'Adwoa Appiah',
    ];

    return Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      jobId: Math.floor(Math.random() * 3) + 1,
      jobTitle: ['Senior React Developer', 'UI/UX Designer for Mobile App', 'Content Marketing Specialist'][Math.floor(Math.random() * 3)],
      worker: {
        id: i + 1,
        name: workerNames[i],
        profilePicture: `https://i.pravatar.cc/150?img=${i + 1}`,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        completedJobs: Math.floor(Math.random() * 50) + 5,
        skills: ['React', 'Node.js', 'Design', 'Marketing'].slice(0, Math.floor(Math.random() * 3) + 2),
      },
      proposedBudget: Math.floor(Math.random() * 3000) + 1000,
      coverLetter: 'Professional cover letter with relevant experience and skills...',
      appliedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      timeAgo: `${i + 1}d ago`,
      status: ['pending', 'reviewed', 'shortlisted'][Math.floor(Math.random() * 3)],
    }));
  }

  getMockAnalytics() {
    return {
      totalJobsPosted: Math.floor(Math.random() * 100) + 20,
      totalAmountSpent: Math.floor(Math.random() * 50000) + 10000,
      averageProjectCost: Math.floor(Math.random() * 3000) + 1000,
      successfulHires: Math.floor(Math.random() * 50) + 15,
      averageTimeToHire: Math.floor(Math.random() * 10) + 3, // days
      workerRetentionRate: Math.floor(Math.random() * 20) + 75, // percentage
      topSkillsInDemand: ['Web Development', 'Mobile Apps', 'UI/UX Design', 'Content Writing', 'Digital Marketing'],
      monthlyStats: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        jobsPosted: Math.floor(Math.random() * 15) + 3,
        amountSpent: Math.floor(Math.random() * 5000) + 1000,
        successfulHires: Math.floor(Math.random() * 8) + 2,
      })),
    };
  }

  /**
   * Get hirer's job postings
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hirer's job postings
   */
  async getHirerJobs(hirerId, params = {}) {
    const response = await apiClient.get(`/hirers/${hirerId}/jobs`, { params });
    return response.data;
  }

  /**
   * Get hirer reviews
   * @param {string} hirerId - Hirer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hirer reviews
   */
  async getHirerReviews(hirerId, params = {}) {
    const response = await apiClient.get(`/hirers/${hirerId}/reviews`, {
      params,
    });
    return response.data;
  }

  /**
   * Update company information
   * @param {Object} companyData - Company data
   * @returns {Promise<Object>} Updated profile
   */
  async updateCompanyInfo(companyData) {
    const response = await apiClient.put('/hirers/me/company', companyData);
    return response.data;
  }

  /**
   * Upload company logo
   * @param {FormData} formData - Form data with logo file
   * @returns {Promise<Object>} Upload response
   */
  async uploadCompanyLogo(formData) {
    const response = await apiClient.post('/hirers/me/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get hirer's favorite workers
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Favorite workers
   */
  async getFavoriteWorkers(params = {}) {
    const response = await apiClient.get('/hirers/me/favorites', { params });
    return response.data;
  }

  /**
   * Add worker to favorites
   * @param {string} workerId - Worker ID to add to favorites
   * @returns {Promise<Object>} Updated favorites
   */
  async addWorkerToFavorites(workerId) {
    const response = await apiClient.post(`/hirers/me/favorites/${workerId}`);
    return response.data;
  }

  /**
   * Remove worker from favorites
   * @param {string} workerId - Worker ID to remove from favorites
   * @returns {Promise<Object>} Updated favorites
   */
  async removeWorkerFromFavorites(workerId) {
    const response = await apiClient.delete(`/hirers/me/favorites/${workerId}`);
    return response.data;
  }

  /**
   * Get hiring history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hiring history
   */
  async getHiringHistory(params = {}) {
    const response = await apiClient.get('/hirers/me/history', { params });
    return response.data;
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    const response = await apiClient.put(
      '/hirers/me/notifications',
      preferences,
    );
    return response.data;
  }
}

export default new HirersApi();
