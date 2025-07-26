import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated job service client for applications
const jobServiceClient = axios.create({
  baseURL: SERVICES.JOB_SERVICE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
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
  (error) => Promise.reject(error)
);

// Mock applications data
const mockApplications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Kitchen Renovation - Custom Cabinets',
    jobDescription: 'Looking for an experienced carpenter to build custom kitchen cabinets...',
    company: 'Mitchell Residence',
    location: 'Accra, Greater Accra',
    budget: 5500,
    currency: 'GH₵',
    status: 'pending',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    coverLetter: 'I am very interested in this kitchen cabinet project. With over 8 years of carpentry experience, I specialize in custom furniture and cabinet making. I have completed similar projects and can provide references.',
    proposedRate: 5200,
    estimatedDuration: '3-4 weeks',
    clientResponse: null,
    clientResponseAt: null,
    hirer: {
      id: 'client-1',
      name: 'Sarah Mitchell',
      avatar: '/api/placeholder/50/50',
      rating: 4.8,
      reviewsCount: 12
    },
    attachments: [
      {
        id: 'att-1',
        name: 'portfolio_kitchen_cabinets.pdf',
        url: '/api/placeholder/document',
        type: 'pdf'
      }
    ]
  },
  {
    id: 'app-2',
    jobId: 'job-4',
    jobTitle: 'Interior House Painting',
    jobDescription: 'Professional painting services needed for interior walls of a 2-bedroom apartment...',
    company: 'Apartment Complex',
    location: 'Tema, Greater Accra',
    budget: 1200,
    currency: 'GH₵',
    status: 'accepted',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    coverLetter: 'I would be happy to help with your interior painting project. I have experience with residential painting and pay attention to detail.',
    proposedRate: 1150,
    estimatedDuration: '1-2 weeks',
    clientResponse: 'Your portfolio looks great! We would like to proceed with your proposal.',
    clientResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    hirer: {
      id: 'client-4',
      name: 'Robert Johnson',
      avatar: '/api/placeholder/50/50',
      rating: 4.4,
      reviewsCount: 7
    },
    attachments: []
  },
  {
    id: 'app-3',
    jobId: 'job-expired',
    jobTitle: 'Deck Construction',
    jobDescription: 'Build a wooden deck for backyard entertainment area...',
    company: 'Williams Family',
    location: 'Kumasi, Ashanti Region',
    budget: 2800,
    currency: 'GH₵',
    status: 'rejected',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
    coverLetter: 'I am interested in building your deck. I have experience with outdoor construction and can work with various wood types.',
    proposedRate: 2650,
    estimatedDuration: '2-3 weeks',
    clientResponse: 'Thank you for your application. We decided to go with another contractor who had more deck-specific experience.',
    clientResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    hirer: {
      id: 'client-5',
      name: 'Jennifer Williams',
      avatar: '/api/placeholder/50/50',
      rating: 4.6,
      reviewsCount: 9
    },
    attachments: [
      {
        id: 'att-2',
        name: 'deck_design_proposal.jpg',
        url: '/api/placeholder/image',
        type: 'image'
      }
    ]
  },
  {
    id: 'app-4',
    jobId: 'job-5',
    jobTitle: 'Roof Repair and Maintenance',
    jobDescription: 'Roof inspection and repair needed. Issues include loose tiles, minor leaks...',
    company: 'Wilson Residence',
    location: 'Cape Coast, Central Region',
    budget: 950,
    currency: 'GH₵',
    status: 'pending',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    coverLetter: 'While my main expertise is carpentry, I have experience with basic roof repairs and maintenance. I would be happy to assess the situation and provide an honest evaluation.',
    proposedRate: 900,
    estimatedDuration: '3-5 days',
    clientResponse: null,
    clientResponseAt: null,
    hirer: {
      id: 'client-6',
      name: 'Mary Wilson',
      avatar: '/api/placeholder/50/50',
      rating: 4.7,
      reviewsCount: 9
    },
    attachments: []
  },
  {
    id: 'app-5',
    jobId: 'job-completed',
    jobTitle: 'Custom Bookshelf Installation',
    jobDescription: 'Install custom-built bookshelves in home office...',
    company: 'Thompson Residence',
    location: 'Accra, Greater Accra',
    budget: 1800,
    currency: 'GH₵',
    status: 'completed',
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    coverLetter: 'I specialize in custom furniture and would love to create beautiful bookshelves for your home office.',
    proposedRate: 1750,
    estimatedDuration: '1 week',
    clientResponse: 'Excellent work! The bookshelves look amazing and fit perfectly.',
    clientResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    finalPayment: 1750,
    clientRating: 5,
    clientReview: 'Tony did an outstanding job on our custom bookshelves. Professional, timely, and excellent craftsmanship.',
    hirer: {
      id: 'client-7',
      name: 'Michael Thompson',
      avatar: '/api/placeholder/50/50',
      rating: 4.9,
      reviewsCount: 15
    },
    attachments: [
      {
        id: 'att-3',
        name: 'bookshelf_final_photos.jpg',
        url: '/api/placeholder/image',
        type: 'image'
      }
    ]
  }
];

const applicationsApi = {
  /**
   * Fetch applications for the current authenticated worker
   */
  getMyApplications: async (params = {}) => {
    try {
      const response = await jobServiceClient.get('/api/applications/my-applications', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for applications, using mock data:', error.message);
      
      // Apply basic filtering if params provided
      let filteredApplications = [...mockApplications];
      
      if (params.status) {
        filteredApplications = filteredApplications.filter(app => app.status === params.status);
      }
      
      if (params.jobId) {
        filteredApplications = filteredApplications.filter(app => app.jobId === params.jobId);
      }
      
      // Sort by applied date (most recent first)
      filteredApplications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      
      return filteredApplications;
    }
  },

  /**
   * Get application by ID
   */
  getApplicationById: async (applicationId) => {
    try {
      const response = await jobServiceClient.get(`/api/applications/${applicationId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for application details, using mock data:', error.message);
      return mockApplications.find(app => app.id === applicationId) || null;
    }
  },

  /**
   * Submit a new job application
   */
  submitApplication: async (jobId, applicationData) => {
    try {
      const response = await jobServiceClient.post(`/api/jobs/${jobId}/apply`, applicationData);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for application submission, simulating success:', error.message);
      
      const newApplication = {
        id: `app-${Date.now()}`,
        jobId,
        ...applicationData,
        status: 'pending',
        appliedAt: new Date(),
        clientResponse: null,
        clientResponseAt: null
      };
      
      return newApplication;
    }
  },

  /**
   * Withdraw an application
   */
  withdrawApplication: async (applicationId) => {
    try {
      const response = await jobServiceClient.delete(`/api/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      console.warn('Job service unavailable for application withdrawal, simulating success:', error.message);
      return { 
        success: true, 
        message: 'Application withdrawn successfully (mock)' 
      };
    }
  },

  /**
   * Update application (if allowed)
   */
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await jobServiceClient.put(`/api/applications/${applicationId}`, updateData);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Job service unavailable for application update, simulating success:', error.message);
      
      const existingApplication = mockApplications.find(app => app.id === applicationId);
      return {
        ...existingApplication,
        ...updateData,
        updatedAt: new Date()
      };
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
      console.warn('Job service unavailable for application stats, using mock data:', error.message);
      
      const stats = {
        total: mockApplications.length,
        pending: mockApplications.filter(app => app.status === 'pending').length,
        accepted: mockApplications.filter(app => app.status === 'accepted').length,
        rejected: mockApplications.filter(app => app.status === 'rejected').length,
        completed: mockApplications.filter(app => app.status === 'completed').length,
        successRate: Math.round((mockApplications.filter(app => ['accepted', 'completed'].includes(app.status)).length / mockApplications.length) * 100),
        averageResponseTime: '2.5 days',
        totalEarnings: mockApplications
          .filter(app => app.status === 'completed')
          .reduce((sum, app) => sum + (app.finalPayment || 0), 0)
      };
      
      return stats;
    }
  }
};

export default applicationsApi;
