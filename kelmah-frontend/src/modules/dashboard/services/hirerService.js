/**
 * Hirer Service - Dashboard Module
 * Handles hirer-specific operations for dashboard components
 * Follows module architecture pattern
 */

import { userServiceClient } from '../../common/services/axios';

class HirerService {
  /**
   * Get hirer dashboard data
   * @returns {Promise<Object>} Dashboard data including metrics, jobs, applications
   */
  async getDashboardData() {
    try {
      const response = await userServiceClient.get('/api/users/hirers/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Hirers dashboard API unavailable, using mock data');
      return this.getMockDashboardData();
    }
  }

  /**
   * Get hirer statistics
   * @param {string} timeframe - Time period for stats (default: '30d')
   * @returns {Promise<Object>} Hirer statistics
   */
  async getStats(timeframe = '30d') {
    try {
      const response = await userServiceClient.get(`/api/users/hirers/metrics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.warn('Metrics API unavailable, using mock data');
      return this.getMockMetrics();
    }
  }

  /**
   * Get recent jobs posted by hirer
   * @param {number} limit - Number of jobs to return (default: 10)
   * @returns {Promise<Array>} Recent jobs
   */
  async getRecentJobs(limit = 10) {
    try {
      const response = await userServiceClient.get(`/api/users/hirers/jobs/active?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Active jobs API unavailable, using mock data');
      return this.getMockActiveJobs();
    }
  }

  /**
   * Get recent applications for hirer's jobs
   * @param {Object} filters - Application filters
   * @returns {Promise<Array>} Recent applications
   */
  async getApplications(filters = {}) {
    try {
      const limit = filters.limit || 10;
      const response = await userServiceClient.get(`/api/users/hirers/applications/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Recent applications API unavailable, using mock data');
      return this.getMockRecentApplications();
    }
  }

  /**
   * Get hirer profile data
   * @returns {Promise<Object>} Hirer profile
   */
  async getProfile() {
    try {
      const response = await userServiceClient.get('/api/users/hirers/me');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch hirer profile:', error);
      throw error;
    }
  }

  // Mock data methods for fallback
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
    ];
  }

  getMockRecentApplications() {
    return [
      {
        id: 1,
        applicantName: 'John Doe',
        jobTitle: 'Senior React Developer',
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Under Review',
        profilePicture: null,
        skills: ['React', 'Node.js', 'TypeScript'],
        experience: '5+ years',
      },
      {
        id: 2,
        applicantName: 'Sarah Wilson',
        jobTitle: 'UI/UX Designer for Mobile App',
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'New',
        profilePicture: null,
        skills: ['Figma', 'User Research', 'Prototyping'],
        experience: '3+ years',
      },
    ];
  }

  getMockAnalytics() {
    return {
      applicationTrends: [
        { date: '2023-01-01', applications: 15 },
        { date: '2023-01-02', applications: 22 },
        { date: '2023-01-03', applications: 18 },
      ],
      jobPerformance: [
        { jobId: 1, title: 'React Developer', views: 245, applications: 18 },
        { jobId: 2, title: 'UI/UX Designer', views: 189, applications: 12 },
      ],
    };
  }
}

// Export as singleton
export default new HirerService();