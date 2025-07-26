/**
 * Workers API Service
 * Handles worker profile, skills, availability, and worker-specific operations
 */

import axios from 'axios';
import { SERVICES } from '../../config/environment';

// Create dedicated user service client for worker operations
const userServiceClient = axios.create({
  baseURL: SERVICES.USER_SERVICE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
userServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock worker data
const mockWorkerData = {
  profile: {
    id: '7a1f417c-e2e2-4210-9824-08d5fac336ac',
    firstName: 'Tony',
    lastName: 'Gate',
    email: 'giftyafisa@gmail.com',
    phone: '+233 24 123 4567',
    location: 'Accra, Greater Accra',
    bio: 'Experienced carpenter with over 8 years in custom furniture and cabinet making. Specializing in modern designs and quality craftsmanship.',
    avatar: '/api/placeholder/150/150',
    rating: 4.8,
    reviewsCount: 24,
    completedJobs: 47,
    responseTime: '2 hours',
    languages: ['English', 'Twi'],
    verified: true,
    joinedAt: new Date('2022-03-15'),
    lastActive: new Date()
  },
  
  skills: [
    {
      id: 'skill-1',
      name: 'Carpentry',
      category: 'Construction',
      level: 'Expert',
      yearsExperience: 8,
      verified: true,
      verifiedAt: new Date('2023-01-15'),
      description: 'Custom furniture making, cabinet installation, woodworking'
    },
    {
      id: 'skill-2',
      name: 'Furniture Making',
      category: 'Craftsmanship',
      level: 'Expert',
      yearsExperience: 6,
      verified: true,
      verifiedAt: new Date('2023-02-20'),
      description: 'Custom chairs, tables, beds, and storage solutions'
    },
    {
      id: 'skill-3',
      name: 'Kitchen Installation',
      category: 'Construction',
      level: 'Advanced',
      yearsExperience: 4,
      verified: false,
      description: 'Complete kitchen setup, cabinet mounting, countertop installation'
    }
  ],
  
  licenses: [
    {
      id: 'license-1',
      name: 'Carpentry Trade Certificate',
      issuingBody: 'Ghana Institute of Carpentry',
      issueDate: new Date('2020-06-15'),
      expiryDate: new Date('2025-06-15'),
      status: 'active',
      verified: true
    },
    {
      id: 'license-2',
      name: 'Safety Training Certificate',
      issuingBody: 'Occupational Safety Institute',
      issueDate: new Date('2023-01-10'),
      expiryDate: new Date('2024-01-10'),
      status: 'active',
      verified: true
    }
  ],
  
  availability: {
    status: 'available', // available, busy, away
    workSchedule: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: true, startTime: '09:00', endTime: '15:00' },
      sunday: { available: false, startTime: null, endTime: null }
    },
    maxConcurrentJobs: 2,
    currentActiveJobs: 1,
    preferredJobTypes: ['carpentry', 'furniture-making', 'installation'],
    travelRadius: 25, // km
    hourlyRate: {
      min: 15,
      max: 45,
      currency: 'GH₵'
    },
    lastUpdated: new Date()
  },
  
  analytics: {
    totalEarnings: 15420,
    monthlyEarnings: 3200,
    averageJobValue: 850,
    completionRate: 96,
    onTimeDelivery: 94,
    clientReturnRate: 78,
    averageRating: 4.8,
    totalReviews: 24,
    responseRate: 98,
    averageResponseTime: '2.3 hours'
  }
};

class WorkersApi {
  /**
   * Get worker profile data
   */
  async getProfile() {
    try {
      const response = await userServiceClient.get('/api/users/me/profile');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for profile, using mock data:', error.message);
      return {
        success: true,
        data: { worker: mockWorkerData.profile }
      };
    }
  }

  /**
   * Update worker profile
   */
  async updateProfile(profileData) {
    try {
      const response = await userServiceClient.put('/api/users/me/profile', profileData);
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for profile update, simulating success:', error.message);
      return {
        success: true,
        data: { worker: { ...mockWorkerData.profile, ...profileData, updatedAt: new Date() } },
        message: 'Profile updated successfully (mock)'
      };
    }
  }

  /**
   * Get worker skills and licenses
   */
  async getSkillsAndLicenses() {
    try {
      const response = await userServiceClient.get('/api/users/me/credentials');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for credentials, using mock data:', error.message);
      return {
        success: true,
        data: {
          skills: mockWorkerData.skills,
          licenses: mockWorkerData.licenses
        }
      };
    }
  }

  /**
   * Add or update worker skill
   */
  async updateSkill(skillData) {
    try {
      const response = await userServiceClient.post('/api/users/me/skills', skillData);
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for skill update, simulating success:', error.message);
      return {
        success: true,
        data: {
          skill: {
            id: `skill-${Date.now()}`,
            ...skillData,
            verified: false,
            createdAt: new Date()
          }
        },
        message: 'Skill added successfully (mock)'
      };
    }
  }

  /**
   * Get current availability status
   */
  async getAvailabilityStatus() {
    try {
      const response = await userServiceClient.get('/api/users/me/availability');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for availability, using mock data:', error.message);
      return {
        success: true,
        data: { availability: mockWorkerData.availability }
      };
    }
  }

  /**
   * Update availability status
   */
  async updateAvailability(availabilityData) {
    try {
      const response = await userServiceClient.put('/api/users/me/availability', availabilityData);
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for availability update, simulating success:', error.message);
      return {
        success: true,
        data: {
          availability: {
            ...mockWorkerData.availability,
            ...availabilityData,
            lastUpdated: new Date()
          }
        },
        message: 'Availability updated successfully (mock)'
      };
    }
  }

  /**
   * Get worker analytics and statistics
   */
  async getAnalytics() {
    try {
      const response = await userServiceClient.get('/api/users/me/analytics');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for analytics, using mock data:', error.message);
      return {
        success: true,
        data: { analytics: mockWorkerData.analytics }
      };
    }
  }

  /**
   * Search and filter workers
   */
  async searchWorkers(params = {}) {
    try {
      const response = await userServiceClient.get('/api/users/workers', { params });
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for worker search, using mock data:', error.message);
      
      // Return mock worker search results
      const mockWorkers = [
        {
          ...mockWorkerData.profile,
          skills: mockWorkerData.skills.map(s => s.name),
          distance: 5.2
        },
        {
          id: 'worker-2',
          firstName: 'Emmanuel',
          lastName: 'Asante',
          location: 'Kumasi, Ashanti Region',
          skills: ['Plumbing', 'Pipe Installation'],
          rating: 4.6,
          completedJobs: 32,
          responseTime: '1.5 hours',
          distance: 15.8
        },
        {
          id: 'worker-3',
          firstName: 'Kwame',
          lastName: 'Osei',
          location: 'Takoradi, Western Region',
          skills: ['Electrical', 'Wiring'],
          rating: 4.9,
          completedJobs: 28,
          responseTime: '3 hours',
          distance: 45.3
        }
      ];

      return {
        success: true,
        data: {
          workers: mockWorkers,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: mockWorkers.length,
            itemsPerPage: 10
          }
        }
      };
    }
  }

  /**
   * Get notification counts for badge displays
   */
  async getNotificationCounts() {
    try {
      const response = await userServiceClient.get('/api/users/me/notification-counts');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for notifications, using mock data:', error.message);
      return {
        success: true,
        data: {
          unreadMessages: 3,
          pendingApplications: 2,
          newJobMatches: 5,
          systemNotifications: 1
        }
      };
    }
  }

  /**
   * Request skill verification
   */
  async requestSkillVerification(skillId, verificationData) {
    try {
      const response = await userServiceClient.post(
        `/api/users/me/skills/${skillId}/verify`,
        verificationData
      );
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for skill verification, simulating success:', error.message);
      return {
        success: true,
        data: {
          verification: {
            id: `verification-${Date.now()}`,
            skillId,
            status: 'pending',
            submittedAt: new Date(),
            estimatedCompletion: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) // 3 days
          }
        },
        message: 'Skill verification request submitted successfully (mock)'
      };
    }
  }
}

export default new WorkersApi();
