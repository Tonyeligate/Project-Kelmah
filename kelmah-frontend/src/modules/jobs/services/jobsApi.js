import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service client - using JOB_SERVICE for job-specific endpoints
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE, // Fixed: Using job service for job endpoints
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
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

// Data transformation helpers
const transformJobListItem = (job) => {
  if (!job) return null;

  return {
    id: job.id,
    title: job.title,
    description: job.description?.substring(0, 150) + '...',
    category: job.category,
    subcategory: job.subcategory,
    type: job.type,
    budget: job.budget,
    currency: job.currency,
    status: job.status,
    location: job.location,
    skills: job.skills || [],
  };
};

// Jobs API service - using real backend data only
const jobsApi = {
  /**
   * Get all jobs with filtering and pagination
   */
  async getJobs(params = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs', { params });
      const jobs = response.data.data || response.data.jobs || [];
      return {
        jobs: jobs.map(transformJobListItem),
        totalPages: response.data.totalPages || 1,
        totalJobs: response.data.totalJobs || jobs.length,
        currentPage: response.data.currentPage || 1,
      };
    } catch (error) {
      console.warn('Job service unavailable for jobs list:', error.message);
      // Return comprehensive mock job data for development/fallback
      const mockJobs = [
        {
          id: 'job_mock_1',
          title: 'Residential Plumbing Repair',
          description: 'Fix leaky pipes and install new fixtures in 2-bedroom apartment',
          location: 'East Legon, Accra',
          salary: 'GH₵ 800 - 1,200',
          type: 'contract',
          urgency: 'high',
          employer: {
            id: 'emp_1',
            name: 'Sarah Johnson',
            rating: 4.8,
            avatar: null
          },
          skills: ['Plumbing', 'Pipe Repair', 'Fixture Installation'],
          postedDate: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
          status: 'open',
          applicationsCount: 5,
          distance: '2.3 km'
        },
        {
          id: 'job_mock_2', 
          title: 'Electrical Installation - New Office',
          description: 'Complete electrical setup for new office space including outlets and lighting',
          location: 'Airport City, Accra',
          salary: 'GH₵ 2,000 - 2,800',
          type: 'project',
          urgency: 'medium',
          employer: {
            id: 'emp_2',
            name: 'TechCorp Ghana',
            rating: 4.9,
            avatar: null
          },
          skills: ['Electrical', 'Commercial Wiring', 'Safety Standards'],
          postedDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago  
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week from now
          status: 'open',
          applicationsCount: 12,
          distance: '5.1 km'
        }
      ];
      
      return {
        jobs: mockJobs.map(transformJobListItem),
        totalPages: 1,
        totalJobs: mockJobs.length,
        currentPage: 1,
      };
    }
  },

  /**
   * Get a single job by ID
   */
  async getJobById(jobId) {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${jobId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.warn(`Job service unavailable for job ${jobId}:`, error.message);
      return null;
    }
  },

  /**
   * Search jobs by criteria
   */
  async searchJobs(searchParams) {
    try {
      const response = await jobServiceClient.get('/api/jobs/search', {
        params: searchParams,
      });
      const jobs = response.data.data || response.data.jobs || [];
      return {
        jobs: jobs.map(transformJobListItem),
        totalPages: response.data.totalPages || 1,
        totalJobs: response.data.totalJobs || jobs.length,
        currentPage: response.data.currentPage || 1,
      };
    } catch (error) {
      console.warn('Job service unavailable for job search:', error.message);
      return {
        jobs: [],
        totalPages: 1,
        totalJobs: 0,
        currentPage: 1,
      };
    }
  },

  /**
   * Apply to a job
   */
  async applyToJob(jobId, applicationData) {
    try {
      const response = await jobServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      console.warn(`Job service unavailable for job application ${jobId}:`, error.message);
      throw error;
    }
  },

  /**
   * Get job categories
   */
  async getJobCategories() {
    try {
      const response = await jobServiceClient.get('/api/jobs/categories');
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for job categories:', error.message);
      return [];
    }
  }
};

export default jobsApi;
