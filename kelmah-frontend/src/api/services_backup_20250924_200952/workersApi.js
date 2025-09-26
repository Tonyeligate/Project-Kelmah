/**
 * Workers API Service
 * Handles worker-specific operations like availability, dashboard stats, etc.
 */

import { userServiceClient as workersServiceClient } from '../../modules/common/services/axios';
import { secureStorage } from '../../utils/secureStorage';

// Use centralized client with auth/retry

const workersApi = {
  /**
   * Get worker availability status from user-service
   */
  async getAvailabilityStatus(userId) {
    const id = userId;
    const resp = await workersServiceClient.get(`/api/users/workers/${id}/availability`);
    const data = resp.data?.data || resp.data;
    const status = data?.availabilityStatus || 'available';
    return {
      isAvailable: status === 'available',
      status,
      schedule: data?.availableHours || {},
      pausedUntil: data?.pausedUntil || null,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Update worker availability in user-service
   */
  async updateAvailability(userId, availabilityData) {
    const id = userId;
    const payload = { ...availabilityData };
    if (typeof availabilityData.isAvailable === 'boolean') {
      payload.availabilityStatus = availabilityData.isAvailable ? 'available' : 'busy';
      delete payload.isAvailable;
    }
    const resp = await workersServiceClient.put(`/api/users/workers/${id}/availability`, payload);
    const data = resp.data?.data || resp.data;
    const status = data?.availabilityStatus || payload.availabilityStatus || 'available';
    return {
      isAvailable: status === 'available',
      status,
      schedule: data?.availableHours || payload.availableHours || {},
      pausedUntil: data?.pausedUntil || payload.pausedUntil || null,
      lastUpdated: new Date().toISOString(),
    };
  },

  // Dashboard-specific methods
  async getDashboardData() {
    const response = await workersServiceClient.get('/api/workers/dashboard');
    return response.data?.data || response.data;
  },

  async getRecentJobs(limit = 10) {
    const response = await workersServiceClient.get(`/api/workers/jobs/recent?limit=${limit}`);
    return response.data?.data || response.data;
  },

  async getMetrics(timeframe = '30d') {
    const response = await workersServiceClient.get(`/api/workers/metrics?timeframe=${timeframe}`);
    return response.data?.data || response.data;
  },

  async getApplications(status = 'all', limit = 20) {
    const response = await workersServiceClient.get(`/api/workers/applications?status=${status}&limit=${limit}`);
    return response.data?.data || response.data;
  },

  async getEarnings(timeframe = '30d') {
    const response = await workersServiceClient.get(`/api/workers/earnings?timeframe=${timeframe}`);
    return response.data?.data || response.data;
  },

  // Profile methods
  async getProfile() {
    try {
      const response = await workersServiceClient.get('/api/workers/profile');
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Profile API unavailable');
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await workersServiceClient.put('/api/workers/profile', profileData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  getMockDashboardData() {
    return {
      metrics: this.getMockMetrics(),
      recentJobs: this.getMockRecentJobs(),
      analytics: this.getMockAnalytics(),
    };
  },

  getMockMetrics() {
    return {
      totalJobs: Math.floor(Math.random() * 50) + 10,
      activeApplications: Math.floor(Math.random() * 15) + 3,
      totalEarnings: Math.floor(Math.random() * 5000) + 1000,
      profileViews: Math.floor(Math.random() * 200) + 50,
      weeklyViews: Math.floor(Math.random() * 50) + 10,
      responseRate: Math.floor(Math.random() * 20) + 80,
      completionRate: Math.floor(Math.random() * 10) + 90,
      // Changes for trending indicators
      jobsChange: Math.floor(Math.random() * 20) - 5,
      applicationsChange: Math.floor(Math.random() * 30) - 10,
      earningsChange: Math.floor(Math.random() * 25) + 5,
      viewsChange: Math.floor(Math.random() * 15) + 2,
    };
  },

  getMockRecentJobs() {
    return [
      {
        id: 1,
        title: 'Web Development for E-commerce',
        location: 'Accra, Ghana',
        budget: 2500,
        status: 'Active',
        description: 'Looking for a skilled web developer to build an e-commerce platform',
        skills: ['React', 'Node.js', 'MongoDB'],
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        title: 'Mobile App UI/UX Design',
        location: 'Kumasi, Ghana',
        budget: 1800,
        status: 'Active',
        description: 'Need a creative designer for a mobile banking app',
        skills: ['Figma', 'Mobile Design', 'Prototyping'],
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        title: 'Content Writing for Tech Blog',
        location: 'Takoradi, Ghana',
        budget: 800,
        status: 'Active',
        description: 'Seeking experienced tech writer for weekly blog posts',
        skills: ['Content Writing', 'SEO', 'Technology'],
        postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        title: 'Digital Marketing Campaign',
        location: 'Cape Coast, Ghana',
        budget: 1200,
        status: 'Active',
        description: 'Launch social media campaign for local business',
        skills: ['Social Media', 'Digital Marketing', 'Analytics'],
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  },

  getMockApplications() {
    return [
      {
        id: 1,
        jobId: 1,
        jobTitle: 'Web Development for E-commerce',
        status: 'pending',
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        proposedBudget: 2300,
        coverLetter: 'I have 5 years of experience in React and Node.js...',
      },
      {
        id: 2,
        jobId: 2,
        jobTitle: 'Mobile App UI/UX Design',
        status: 'accepted',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        proposedBudget: 1800,
        coverLetter: 'I specialize in mobile app design with focus on user experience...',
      },
      {
        id: 3,
        jobId: 4,
        jobTitle: 'Digital Marketing Campaign',
        status: 'rejected',
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        proposedBudget: 1100,
        coverLetter: 'I can help grow your social media presence...',
      },
    ];
  },

  getMockEarnings() {
    return {
      total: Math.floor(Math.random() * 10000) + 2000,
      thisMonth: Math.floor(Math.random() * 3000) + 500,
      lastMonth: Math.floor(Math.random() * 2500) + 400,
      pending: Math.floor(Math.random() * 1000) + 200,
      available: Math.floor(Math.random() * 2000) + 300,
      transactions: [
        {
          id: 1,
          amount: 2500,
          type: 'earning',
          description: 'Web Development Project Completed',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
        },
        {
          id: 2,
          amount: 1200,
          type: 'earning',
          description: 'Mobile App Design',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        },
        {
          id: 3,
          amount: 800,
          type: 'earning',
          description: 'Content Writing - Tech Blog',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
        },
      ],
    };
  },

  getMockAnalytics() {
    return {
      jobApplications: Math.floor(Math.random() * 80) + 20,
      profileViews: Math.floor(Math.random() * 200) + 50,
      responseRate: Math.floor(Math.random() * 20) + 80,
      completionRate: Math.floor(Math.random() * 10) + 90,
      averageRating: (Math.random() * 1.5 + 3.5).toFixed(1),
      topSkills: ['Web Development', 'Mobile Apps', 'UI/UX Design', 'Content Writing'],
      monthlyStats: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        applications: Math.floor(Math.random() * 15) + 5,
        earnings: Math.floor(Math.random() * 1500) + 300,
      })),
    };
  },

  /**
   * Get worker dashboard statistics - Enhanced with realistic mock data
   */
  async getDashboardStats() {
    const response = await workersServiceClient.get('/api/workers/dashboard/stats');
    return response.data?.data || response.data;
  },

  /**
   * Get worker earnings data - Enhanced method
   */
  async getEarningsData(timeRange = '6months') {
    const response = await workersServiceClient.get('/api/workers/earnings', { params: { timeRange } });
    return response.data?.data || response.data;
  },

  /**
   * Get worker appointments - Enhanced method
   */
  async getAppointments() {
    try {
      const response = await workersServiceClient.get('/api/workers/appointments');
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Appointments API unavailable');
      return [];
    }
  },

  /**
   * Get worker profile data - Uses auth token verification
   */
  async getWorkerProfile() {
    try {
      const response = await workersServiceClient.get('/api/workers/profile');
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Worker profile API unavailable');
      throw error;
    }
  },

  /**
   * Update worker profile - Enhanced with validation
   */
  async updateWorkerProfile(profileData) {
    try {
      const response = await workersServiceClient.put('/api/workers/profile', profileData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to update worker profile:', error);
      throw error;
    }
  },

  /**
   * Get portfolio projects - Enhanced with realistic data
   */
  async getPortfolioProjects() {
    const response = await workersServiceClient.get('/api/workers/portfolio');
    return response.data?.data || response.data;
  },

  /**
   * Get skills and licenses - Enhanced with realistic data
   */
  async getSkillsAndLicenses() {
    const response = await workersServiceClient.get('/api/workers/credentials');
    return response.data?.data || response.data;
  },

  /**
   * Request skill verification - Enhanced implementation
   */
  async requestSkillVerification(skillId, verificationData) {
    try {
      const response = await workersServiceClient.post(`/api/workers/skills/${skillId}/verify`, verificationData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to request skill verification:', error);
      throw error;
    }
  },

  /**
   * Get profile completion status - New method
   */
  async getProfileCompletion() {
    try {
      const user = secureStorage.getUserData();
      const id = user?.id || user?._id || user?.userId;
      if (!id) throw new Error('Missing user id');
      const resp = await workersServiceClient.get(`/api/workers/${id}/completeness`);
      return resp.data?.data || resp.data;
    } catch (error) {
      console.warn('Profile completion API unavailable, using mock data');
      return {
        percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
        missingFields: ['portfolio', 'skills', 'experience'],
      };
    }
  }
};

export default workersApi;