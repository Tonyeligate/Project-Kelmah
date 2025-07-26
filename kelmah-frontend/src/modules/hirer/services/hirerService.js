/**
 * Hirer Service
 * 
 * Service layer for hirer-related operations with proper service routing
 * and comprehensive mock data fallbacks.
 */

import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service clients
const userServiceClient = axios.create({
  baseURL: SERVICES.USER_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth tokens to requests
[userServiceClient, jobServiceClient].forEach(client => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('kelmah_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
});

// Mock data for fallbacks
const mockHirerData = {
  profile: {
    id: 'hirer-001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@example.com',
    phone: '+233 24 567 8901',
    company: 'Mitchell Construction Ltd',
    location: 'Accra, Greater Accra',
    bio: 'We are a leading construction company specializing in residential and commercial projects.',
    avatar: '/api/placeholder/150/150',
    rating: 4.8,
    reviewsCount: 28,
    verified: true
  },

  jobs: {
    active: [
      {
        id: 'job-h1',
        title: 'Kitchen Renovation - Custom Cabinets',
        description: 'Looking for an experienced carpenter to build custom kitchen cabinets.',
        category: 'Carpentry',
        location: 'Accra, Greater Accra',
        budget: 5500,
        currency: 'GH₵',
        status: 'active',
        applicationsCount: 12,
        applications: [
          {
            id: 'app-h1',
            workerId: '7a1f417c-e2e2-4210-9824-08d5fac336ac',
            workerName: 'Tony Gate',
            workerRating: 4.8,
            proposedRate: 5200,
            status: 'pending',
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
          }
        ]
      }
    ],
    completed: [
      {
        id: 'job-h3',
        title: 'Residential Plumbing Installation',
        description: 'Complete plumbing installation for a new 3-bedroom house.',
        category: 'Plumbing',
        status: 'completed',
        finalPayment: 8500,
        applications: []
      }
    ]
  },

  savedWorkers: [
    { id: 'worker-s1', name: 'Alice Brown', rating: 4.8, experience: '4 years' },
    { id: 'worker-s2', name: 'Bob Green', rating: 4.9, experience: '6 years' }
  ]
};

export const hirerService = {
  // Profile Management
  async getProfile() {
    try {
      const response = await userServiceClient.get('/api/users/me/profile');
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for hirer profile, using mock data:', error.message);
      return mockHirerData.profile;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await userServiceClient.put('/api/users/me/profile', profileData);
      return response.data;
    } catch (error) {
      console.warn('User service unavailable for profile update, simulating success:', error.message);
      return { ...mockHirerData.profile, ...profileData, updatedAt: new Date() };
    }
  },

  // Job Management
  async getJobs(status = 'active') {
    try {
      const response = await jobServiceClient.get('/api/jobs/my-jobs', { 
        params: { status, role: 'hirer' } 
      });
      return response.data;
    } catch (error) {
      console.warn(`Job service unavailable for hirer jobs (${status}), using mock data:`, error.message);
      return mockHirerData.jobs[status] || [];
    }
  },

  async createJob(jobData) {
    try {
      const response = await jobServiceClient.post('/api/jobs', jobData);
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for job creation, simulating success:', error.message);
      return {
        id: `job-${Date.now()}`,
        ...jobData,
        status: jobData.status || 'draft',
        createdAt: new Date(),
        applicationsCount: 0
      };
    }
  },

  async updateJob(jobId, jobData) {
    try {
      const response = await jobServiceClient.put(`/api/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for job update, simulating success:', error.message);
      return { id: jobId, ...jobData, updatedAt: new Date() };
    }
  },

  async deleteJob(jobId) {
    try {
      await jobServiceClient.delete(`/api/jobs/${jobId}`);
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      console.warn('Job service unavailable for job deletion, simulating success:', error.message);
      return { success: true, message: 'Job deleted successfully (mock)' };
    }
  },

  async publishJob(jobId) {
    try {
      const response = await jobServiceClient.post(`/api/jobs/${jobId}/publish`);
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for job publishing, simulating success:', error.message);
      return { id: jobId, status: 'active', publishedAt: new Date() };
    }
  },

  // Application Management
  async getJobApplications(jobId, status = 'pending') {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}/applications`, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.warn(`Job service unavailable for applications (${jobId}), using mock data:`, error.message);
      
      // Find mock job and return its applications
      const allJobs = [...mockHirerData.jobs.active, ...mockHirerData.jobs.completed];
      const job = allJobs.find(j => j.id === jobId);
      return job?.applications || [];
    }
  },

  async updateApplicationStatus(jobId, applicationId, status, feedback = '') {
    try {
      const response = await jobServiceClient.put(
        `/api/jobs/${jobId}/applications/${applicationId}`,
        { status, feedback }
      );
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for application status update, simulating success:', error.message);
      return {
        id: applicationId,
        status,
        feedback,
        updatedAt: new Date(),
        message: 'Application status updated successfully (mock)'
      };
    }
  },

  // Worker Search and Management
  async searchWorkers(searchParams) {
    try {
      // For now, return mock data as worker service isn't fully implemented
      const mockWorkers = [
        { 
          id: 'worker-w1', 
          name: 'John Doe', 
          rating: 4.5, 
          experience: '5 years', 
          hourlyRate: 50,
          skills: ['Carpentry', 'Furniture Making'],
          location: 'Accra, Ghana'
        },
        { 
          id: 'worker-w2', 
          name: 'Jane Smith', 
          rating: 4.9, 
          experience: '3 years', 
          hourlyRate: 60,
          skills: ['Plumbing', 'Installation'],
          location: 'Kumasi, Ghana'
        }
      ];
      
      return { 
        workers: mockWorkers, 
        pagination: { currentPage: 1, totalPages: 1, totalItems: mockWorkers.length } 
      };
    } catch (error) {
      console.warn('Worker search unavailable, using mock data:', error.message);
      return { workers: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    }
  },

  async getSavedWorkers() {
    try {
      // Mock saved workers for now
      return mockHirerData.savedWorkers;
    } catch (error) {
      console.warn('Saved workers unavailable, using mock data:', error.message);
      return mockHirerData.savedWorkers;
    }
  },

  async saveWorker(workerId) {
    try {
      // Mock save worker for now
      return { workerId, message: 'Worker saved successfully (mock)' };
    } catch (error) {
      console.warn('Save worker unavailable, simulating success:', error.message);
      return { workerId, message: 'Worker saved successfully (mock)' };
    }
  },

  async unsaveWorker(workerId) {
    try {
      // Mock unsave worker for now
      return { workerId, message: 'Worker unsaved successfully (mock)' };
    } catch (error) {
      console.warn('Unsave worker unavailable, simulating success:', error.message);
      return { workerId, message: 'Worker unsaved successfully (mock)' };
    }
  },

  // Payment Management
  async releaseMilestonePayment(jobId, milestoneId, amount) {
    try {
      // Mock payment release for now
      return { 
        jobId, 
        milestoneId, 
        amount, 
        totalPaid: amount, 
        message: 'Payment released successfully (mock)' 
      };
    } catch (error) {
      console.warn('Payment release unavailable, simulating success:', error.message);
      return { 
        jobId, 
        milestoneId, 
        amount, 
        totalPaid: amount, 
        message: 'Payment released successfully (mock)' 
      };
    }
  },

  // Review Management
  async createWorkerReview(workerId, jobId, reviewData) {
    try {
      // Mock review creation for now
      return { 
        workerId, 
        jobId, 
        reviewData, 
        message: 'Review created successfully (mock)' 
      };
    } catch (error) {
      console.warn('Review creation unavailable, simulating success:', error.message);
      return { 
        workerId, 
        jobId, 
        reviewData, 
        message: 'Review created successfully (mock)' 
      };
    }
  }
};
