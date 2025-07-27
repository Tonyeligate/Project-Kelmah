/**
 * Jobs API Service
 * Handles job posting, searching, and job-related operations
 */

import axios from 'axios';
import { SERVICES, FEATURES } from '../../config/environment';

// Create a dedicated job service client
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Mock data for development/fallback
const mockJobs = [
  {
    id: 'job-1',
    title: 'Kitchen Renovation - Custom Cabinets',
    description:
      'Looking for an experienced carpenter to build custom kitchen cabinets. The project involves measuring, designing, and installing high-quality wooden cabinets with modern hardware.',
    company: 'Mitchell Residence',
    location: 'Accra, Greater Accra',
    category: 'Carpentry',
    budget: 5500,
    currency: 'GH₵',
    type: 'fixed-price',
    status: 'open',
    urgency: 'normal',
    featured: true,
    tags: ['Carpentry', 'Kitchen', 'Custom Work'],
    requirements: [
      'Minimum 5 years carpentry experience',
      'Portfolio of kitchen cabinet work',
      'Own tools and equipment',
      'Available for 3-4 weeks project duration',
    ],
    postedBy: {
      id: 'client-1',
      name: 'Sarah Mitchell',
      avatar: '/api/placeholder/50/50',
      rating: 4.8,
      reviewsCount: 12,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    applicationsCount: 8,
    viewsCount: 45,
    distance: 5.2,
  },
  {
    id: 'job-2',
    title: 'Emergency Bathroom Plumbing Repair',
    description:
      'Urgent plumbing repair needed for bathroom. Issues include leaking pipes, faulty faucet, and drainage problems. Need immediate professional help.',
    company: 'Chen Family Home',
    location: 'Kumasi, Ashanti Region',
    category: 'Plumbing',
    budget: 800,
    currency: 'GH₵',
    type: 'hourly',
    status: 'open',
    urgency: 'urgent',
    featured: false,
    tags: ['Plumbing', 'Emergency', 'Bathroom'],
    requirements: [
      'Licensed plumber',
      'Available within 24 hours',
      'Emergency repair experience',
      'Own professional tools',
    ],
    postedBy: {
      id: 'client-2',
      name: 'David Chen',
      avatar: '/api/placeholder/50/50',
      rating: 4.6,
      reviewsCount: 8,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 48),
    applicationsCount: 12,
    viewsCount: 67,
    distance: 15.8,
  },
  {
    id: 'job-3',
    title: 'Complete House Rewiring Project',
    description:
      'Full electrical rewiring for a 3-bedroom house. Includes new electrical panel, outlets, switches, and lighting fixtures. Must comply with current electrical codes.',
    company: 'Thompson Residence',
    location: 'Takoradi, Western Region',
    category: 'Electrical',
    budget: 3200,
    currency: 'GH₵',
    type: 'fixed-price',
    status: 'open',
    urgency: 'normal',
    featured: true,
    tags: ['Electrical', 'Rewiring', 'Residential'],
    requirements: [
      'Certified electrician with license',
      'Experience with residential rewiring',
      'Knowledge of current electrical codes',
      'Ability to work 2-3 weeks on project',
    ],
    postedBy: {
      id: 'client-3',
      name: 'Lisa Thompson',
      avatar: '/api/placeholder/50/50',
      rating: 4.9,
      reviewsCount: 15,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
    applicationsCount: 6,
    viewsCount: 32,
    distance: 45.3,
  },
  {
    id: 'job-4',
    title: 'Interior House Painting',
    description:
      'Professional painting services needed for interior walls of a 2-bedroom apartment. Includes wall preparation, primer, and two coats of paint.',
    company: 'Apartment Complex',
    location: 'Tema, Greater Accra',
    category: 'Painting',
    budget: 1200,
    currency: 'GH₵',
    type: 'fixed-price',
    status: 'open',
    urgency: 'normal',
    featured: false,
    tags: ['Painting', 'Interior', 'Residential'],
    requirements: [
      'Professional painting experience',
      'Own brushes, rollers, and equipment',
      'Attention to detail and clean work',
      'Available within 2 weeks',
    ],
    postedBy: {
      id: 'client-4',
      name: 'Robert Johnson',
      avatar: '/api/placeholder/50/50',
      rating: 4.4,
      reviewsCount: 7,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    applicationsCount: 4,
    viewsCount: 28,
    distance: 8.7,
  },
  {
    id: 'job-5',
    title: 'Roof Repair and Maintenance',
    description:
      'Roof inspection and repair needed. Issues include loose tiles, minor leaks, and gutter cleaning. Looking for experienced roofer.',
    company: 'Wilson Residence',
    location: 'Cape Coast, Central Region',
    category: 'Roofing',
    budget: 950,
    currency: 'GH₵',
    type: 'fixed-price',
    status: 'open',
    urgency: 'high',
    featured: false,
    tags: ['Roofing', 'Repair', 'Maintenance'],
    requirements: [
      'Roofing experience minimum 3 years',
      'Safety equipment and insurance',
      'Ability to work at heights',
      'Available for inspection this week',
    ],
    postedBy: {
      id: 'client-5',
      name: 'Mary Wilson',
      avatar: '/api/placeholder/50/50',
      rating: 4.7,
      reviewsCount: 9,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    applicationsCount: 3,
    viewsCount: 19,
    distance: 78.2,
  },
];

class JobsApi {
  /**
   * Get all jobs with optional filtering
   */
  async getJobs(params = {}) {
    try {
      // Try to call the actual job service
      const response = await jobServiceClient.get('/api/jobs', { params });
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable, using mock data:', error.message);

      // Return mock data with proper pagination structure
      const {
        page = 1,
        limit = 10,
        search = '',
        category = '',
        location = '',
      } = params;
      let filteredJobs = mockJobs;

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.title.toLowerCase().includes(searchLower) ||
            job.description.toLowerCase().includes(searchLower) ||
            job.company.toLowerCase().includes(searchLower),
        );
      }

      if (category) {
        filteredJobs = filteredJobs.filter(
          (job) => job.category.toLowerCase() === category.toLowerCase(),
        );
      }

      if (location) {
        filteredJobs = filteredJobs.filter((job) =>
          job.location.toLowerCase().includes(location.toLowerCase()),
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          jobs: paginatedJobs,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredJobs.length / limit),
            totalItems: filteredJobs.length,
            itemsPerPage: limit,
            hasNextPage: endIndex < filteredJobs.length,
            hasPrevPage: page > 1,
          },
        },
      };
    }
  }

  /**
   * Get featured jobs for homepage
   */
  async getFeaturedJobs(limit = 6) {
    try {
      const response = await jobServiceClient.get('/api/jobs/featured', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock featured jobs:',
        error.message,
      );

      const featuredJobs = mockJobs
        .filter((job) => job.featured)
        .slice(0, limit);
      return {
        success: true,
        data: {
          jobs: featuredJobs,
          count: featuredJobs.length,
        },
      };
    }
  }

  /**
   * Get a specific job by ID
   */
  async getJobById(jobId) {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock job data:',
        error.message,
      );

      const job = mockJobs.find((j) => j.id === jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        success: true,
        data: { job },
      };
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData) {
    try {
      const response = await jobServiceClient.post('/api/jobs', jobData);
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job creation:',
        error.message,
      );

      // Simulate successful job creation
      const newJob = {
        id: `job-${Date.now()}`,
        ...jobData,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationsCount: 0,
        viewsCount: 0,
      };

      return {
        success: true,
        data: { job: newJob },
        message: 'Job created successfully (mock)',
      };
    }
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId, jobData) {
    try {
      const response = await jobServiceClient.put(
        `/api/jobs/${jobId}`,
        jobData,
      );
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job update:',
        error.message,
      );

      return {
        success: true,
        data: { job: { id: jobId, ...jobData, updatedAt: new Date() } },
        message: 'Job updated successfully (mock)',
      };
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    try {
      const response = await jobServiceClient.delete(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job deletion:',
        error.message,
      );

      return {
        success: true,
        message: 'Job deleted successfully (mock)',
      };
    }
  }

  /**
   * Apply to a job
   */
  async applyToJob(jobId, applicationData) {
    try {
      const response = await jobServiceClient.post(
        `/api/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job application:',
        error.message,
      );

      return {
        success: true,
        data: {
          application: {
            id: `app-${Date.now()}`,
            jobId,
            ...applicationData,
            status: 'pending',
            appliedAt: new Date(),
          },
        },
        message: 'Application submitted successfully (mock)',
      };
    }
  }

  /**
   * Get jobs posted by current hirer
   */
  async getMyJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs/my-jobs', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock my jobs:',
        error.message,
      );

      // Return subset of mock jobs as if posted by current user
      return {
        success: true,
        data: {
          jobs: mockJobs.slice(0, 2), // Return first 2 as user's jobs
          count: 2,
        },
      };
    }
  }

  /**
   * Get applications for a job
   */
  async getJobApplications(jobId, params = {}) {
    try {
      const response = await jobServiceClient.get(
        `/api/jobs/${jobId}/applications`,
        { params },
      );
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock applications:',
        error.message,
      );

      return {
        success: true,
        data: {
          applications: [],
          count: 0,
        },
      };
    }
  }

  /**
   * Get applications submitted by current worker
   */
  async getMyApplications(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs/my-applications', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock applications:',
        error.message,
      );

      return {
        success: true,
        data: {
          applications: [],
          count: 0,
        },
      };
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(jobId, applicationId, status) {
    try {
      const response = await jobServiceClient.put(
        `/api/jobs/${jobId}/applications/${applicationId}`,
        { status },
      );
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating status update:',
        error.message,
      );

      return {
        success: true,
        data: {
          application: {
            id: applicationId,
            jobId,
            status,
            updatedAt: new Date(),
          },
        },
        message: 'Application status updated (mock)',
      };
    }
  }

  /**
   * Save a job for later
   */
  async saveJob(jobId) {
    try {
      const response = await jobServiceClient.post(`/api/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job save:',
        error.message,
      );

      return {
        success: true,
        message: 'Job saved successfully (mock)',
      };
    }
  }

  /**
   * Remove a saved job
   */
  async unsaveJob(jobId) {
    try {
      const response = await jobServiceClient.delete(`/api/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, simulating job unsave:',
        error.message,
      );

      return {
        success: true,
        message: 'Job removed from saved list (mock)',
      };
    }
  }

  /**
   * Get saved jobs for current user
   */
  async getSavedJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs/saved', {
        params,
      });
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock saved jobs:',
        error.message,
      );

      return {
        success: true,
        data: {
          jobs: [],
          count: 0,
        },
      };
    }
  }

  /**
   * Get job categories
   */
  async getJobCategories() {
    try {
      const response = await jobServiceClient.get('/api/jobs/categories');
      return response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable, using mock categories:',
        error.message,
      );

      return {
        success: true,
        data: {
          categories: [
            { id: 'carpentry', name: 'Carpentry', count: 15 },
            { id: 'plumbing', name: 'Plumbing', count: 12 },
            { id: 'electrical', name: 'Electrical', count: 8 },
            { id: 'painting', name: 'Painting', count: 6 },
            { id: 'roofing', name: 'Roofing', count: 4 },
            { id: 'masonry', name: 'Masonry', count: 7 },
            { id: 'welding', name: 'Welding', count: 3 },
          ],
        },
      };
    }
  }
}

export default new JobsApi();
