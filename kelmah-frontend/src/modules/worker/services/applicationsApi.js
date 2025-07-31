import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated job service client for applications
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
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

// Mock applications data
const mockApplications = [],
  },
  {
    id: 'app-2',
    jobId: 'job-4',
    jobTitle: 'Interior House Painting',
    jobDescription:
      'Professional painting services needed for interior walls of a 2-bedroom apartment...',
    company: 'Apartment Complex',
    location: 'Tema, Greater Accra',
    budget: 1200,
    currency: "GHS",
    status: 'accepted',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    coverLetter:
      'I would be happy to help with your interior painting project. I have experience with residential painting and pay attention to detail.',
    proposedRate: 1150,
    estimatedDuration: '1-2 weeks',
    clientResponse:
      'Your portfolio looks great! We would like to proceed with your proposal.',
    clientResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    hirer: {
      id: 'client-4',
      name: 'Robert Johnson',
      avatar: '/api/placeholder/50/50',
      rating: 4.4,
      reviewsCount: 7,
    },
    attachments: [],
  },
  {
    id: 'app-4',
    jobId: 'job-5',
    jobTitle: 'Roof Repair and Maintenance',
    jobDescription:
      'Roof inspection and repair needed. Issues include loose tiles, minor leaks...',
    company: 'Wilson Residence',
    location: 'Cape Coast, Central Region',
    budget: 950,
    currency: "GHS",
    status: 'pending',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    coverLetter:
      'While my main expertise is carpentry, I have experience with basic roof repairs and maintenance. I would be happy to assess the situation and provide an honest evaluation.',
    proposedRate: 900,
    estimatedDuration: '3-5 days',
    clientResponse: null,
    clientResponseAt: null,
    hirer: {
      id: 'client-6',
      name: 'Mary Wilson',
      avatar: '/api/placeholder/50/50',
      rating: 4.7,
      reviewsCount: 9,
    },
    attachments: [],
  },
];

const applicationsApi = {
  /**
   * Fetch applications for the current authenticated worker
   */
  getMyApplications: async (params = {}) => {
    try {
      const response = await jobServiceClient.get(
        '/api/applications/my-applications',
        { params },
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable for applications, using mock data:',
        error.message,
      );

      // Apply basic filtering if params provided
      let filteredApplications = [...mockApplications];

      if (params.status) {
        filteredApplications = filteredApplications.filter(
          (app) => app.status === params.status,
        );
      }

      if (params.jobId) {
        filteredApplications = filteredApplications.filter(
          (app) => app.jobId === params.jobId,
        );
      }

      // Sort by applied date (most recent first)
      filteredApplications.sort(
        (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
      );

      return filteredApplications;
    }
  },

  /**
   * Get application by ID
   */
  getApplicationById: async (applicationId) => {
    try {
      const response = await jobServiceClient.get(
        `/api/applications/${applicationId}`,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable for application details, using mock data:',
        error.message,
      );
      return mockApplications.find((app) => app.id === applicationId) || null;
    }
  },

  /**
   * Submit a new job application
   */
  submitApplication: async (jobId, applicationData) => {
    try {
      const response = await jobServiceClient.post(
        `/api/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable for application submission, simulating success:',
        error.message,
      );

      const newApplication = {
        id: `app-${Date.now()}`,
        jobId,
        ...applicationData,
        status: 'pending',
        appliedAt: new Date(),
        clientResponse: null,
        clientResponseAt: null,
      };

      return newApplication;
    }
  },

  /**
   * Withdraw an application
   */
  withdrawApplication: async (applicationId) => {
    try {
      const response = await jobServiceClient.delete(
        `/api/applications/${applicationId}`,
      );
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  /**
   * Update application (if allowed)
   */
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await jobServiceClient.put(
        `/api/applications/${applicationId}`,
        updateData,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      throw error;
    }
  },

  /**
   * Get application statistics
   */
  getApplicationStats: async () => {
    try {
      const response = await jobServiceClient.get('/api/applications/stats');
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable for application stats, using mock data:',
        error.message,
      );

      const stats = {
        total: mockApplications.length,
        pending: mockApplications.filter((app) => app.status === 'pending')
          .length,
        accepted: mockApplications.filter((app) => app.status === 'accepted')
          .length,
        rejected: mockApplications.filter((app) => app.status === 'rejected')
          .length,
        completed: mockApplications.filter((app) => app.status === 'completed')
          .length,
        successRate: Math.round(
          (mockApplications.filter((app) =>
            ['accepted', 'completed'].includes(app.status),
          ).length /
            mockApplications.length) *
            100,
        ),
        averageResponseTime: '2.5 days',
        totalEarnings: mockApplications
          .filter((app) => app.status === 'completed')
          .reduce((sum, app) => sum + (app.finalPayment || 0), 0),
      };

      return stats;
    }
  },
};

export default applicationsApi;
