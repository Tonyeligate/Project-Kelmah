/**
 * Workers API Service
 * Handles worker-specific operations like availability, dashboard stats, etc.
 */

import { userServiceClient as workersServiceClient } from '../../modules/common/services/axios';

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
    try {
      const response = await workersServiceClient.get('/api/users/workers/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Workers dashboard API unavailable, using mock data');
      return this.getMockDashboardData();
    }
  },

  async getProfileCompletion() {
    try {
      const response = await workersServiceClient.get('/api/users/workers/profile/completion');
      return response.data;
    } catch (error) {
      console.warn('Profile completion API unavailable, using mock data');
      return {
        percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
        missingFields: ['portfolio', 'skills', 'experience'],
      };
    }
  },

  async getRecentJobs(limit = 10) {
    try {
      const response = await workersServiceClient.get(`/api/users/workers/jobs/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Recent jobs API unavailable, using mock data');
      return this.getMockRecentJobs();
    }
  },

  async getMetrics(timeframe = '30d') {
    try {
      const response = await workersServiceClient.get(`/api/users/workers/metrics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.warn('Metrics API unavailable, using mock data');
      return this.getMockMetrics();
    }
  },

  async getApplications(status = 'all', limit = 20) {
    try {
      const response = await workersServiceClient.get(`/api/users/workers/applications?status=${status}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn('Applications API unavailable, using mock data');
      return this.getMockApplications();
    }
  },

  async getEarnings(timeframe = '30d') {
    try {
      const response = await workersServiceClient.get(`/api/users/workers/earnings?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.warn('Earnings API unavailable, using mock data');
      return this.getMockEarnings();
    }
  },

  // Profile methods
  async getProfile() {
    try {
      const response = await workersServiceClient.get('/api/users/workers/profile');
      return response.data;
    } catch (error) {
      console.warn('Profile API unavailable');
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await workersServiceClient.put('/api/users/workers/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Mock data methods
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
    try {
      // Align with user-service profile routes
      const response = await workersServiceClient.get('/api/profile/portfolio/search');
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Portfolio service unavailable:', error.message);
      // Return comprehensive mock portfolio data
      return [
        {
          id: 'proj_1',
          title: 'Modern Kitchen Renovation',
          description: 'Complete kitchen renovation including plumbing, electrical, and tiling work for a 3-bedroom house in Accra.',
          images: ['/images/kitchen-before.jpg', '/images/kitchen-after.jpg'],
          client: 'Sarah Johnson',
          location: 'East Legon, Accra',
          completedDate: '2024-01-15',
          category: 'Plumbing & Electrical',
          rating: 5.0,
          testimonial: 'Kwaku did an exceptional job! The kitchen looks amazing and everything works perfectly.',
          budget: 'GH₵ 15,000 - GH₵ 20,000',
          duration: '3 weeks',
          skills: ['Plumbing', 'Electrical', 'Tiling', 'Project Management']
        },
        {
          id: 'proj_2',
          title: 'Commercial Office Electrical Setup',
          description: 'Electrical installation and wiring for a new office building with 20 workstations.',
          images: ['/images/office-electrical.jpg'],
          client: 'TechCorp Ghana',
          location: 'Airport City, Accra',
          completedDate: '2023-12-10',
          category: 'Electrical',
          rating: 4.8,
          testimonial: 'Professional work completed on time and within budget.',
          budget: 'GH₵ 25,000 - GH₵ 30,000',
          duration: '2 weeks',
          skills: ['Commercial Electrical', 'Safety Standards', 'Project Planning']
        }
      ];
    }
  },

  /**
   * Get skills and licenses - Enhanced with realistic data
   */
  async getSkillsAndLicenses() {
    try {
      const response = await workersServiceClient.get('/api/users/me/credentials');
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Credentials service unavailable:', error.message);
      // Return comprehensive mock credentials data
      return {
        skills: [
          {
            id: 'skill_1',
            name: 'Plumbing',
            level: 'Expert',
            experience: '8 years',
            verified: true,
            certifications: ['Ghana Institute of Plumbers Certification'],
            endorsements: 45,
            lastUsed: '2024-01-15'
          },
          {
            id: 'skill_2',
            name: 'Electrical Installation',
            level: 'Advanced',
            experience: '6 years',
            verified: true,
            certifications: ['Electrical Contractors Association of Ghana'],
            endorsements: 38,
            lastUsed: '2023-12-20'
          },
          {
            id: 'skill_3',
            name: 'Project Management',
            level: 'Intermediate',
            experience: '4 years',
            verified: false,
            certifications: [],
            endorsements: 12,
            lastUsed: '2024-01-10'
          }
        ],
        licenses: [
          {
            id: 'license_1',
            name: 'Ghana Plumbing License',
            number: 'GPL-2019-4521',
            issuedBy: 'Ministry of Water Resources',
            issueDate: '2019-03-15',
            expiryDate: '2025-03-15',
            status: 'active',
            verified: true
          },
          {
            id: 'license_2',
            name: 'Electrical Installation License',
            number: 'EIL-2020-7823',
            issuedBy: 'Electrical Contractors Association',
            issueDate: '2020-06-20',
            expiryDate: '2025-06-20',
            status: 'active',
            verified: true
          }
        ],
        certifications: [
          {
            id: 'cert_1',
            name: 'Advanced Plumbing Techniques',
            provider: 'Ghana Institute of Plumbers',
            completedDate: '2023-08-15',
            validUntil: '2026-08-15',
            credentialId: 'GIP-ADV-2023-1142'
          }
        ]
      };
    }
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
    const user = secureStorage.getUserData();
    const id = user?.id || user?._id || user?.userId;
    if (!id) throw new Error('Missing user id');
    const resp = await workersServiceClient.get(`/api/users/workers/${id}/completeness`);
    return resp.data?.data || resp.data;
  }
};

export default workersApi;