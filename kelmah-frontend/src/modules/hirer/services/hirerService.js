import { apiService } from '../../common/utils/apiUtils';

// Use Node.js environment variables for tests
const metaEnv = process.env;

/**
 * Service for making API calls related to hirers
 */
export const hirerService = {
  /**
   * Get hirer profile information
   * @returns {Promise<Object>} - Hirer profile object
   */
  getHirerProfile: async () => {
    try {
      const data = await apiService.get('/api/hirer/profile');
      return data;
    } catch (error) {
      console.error('Error fetching hirer profile:', error);
      // Return mock data in case of API failure in development
      if (metaEnv.DEV) {
        console.warn('API call for hirer profile failed. Returning mock data.');
        return Promise.resolve(mockHirerProfile);
      }
      throw error;
    }
  },

  /**
   * Update hirer profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Updated profile
   */
  updateHirerProfile: async (profileData) => {
    try {
      const data = await apiService.put('/api/hirer/profile', profileData);
      return data;
    } catch (error) {
      console.error('Error updating hirer profile:', error);
      throw error;
    }
  },

  /**
   * Get jobs posted by the hirer
   * @param {string} status - Job status (active, draft, completed, cancelled)
   * @returns {Promise<Array>} - Array of job objects
   */
  getHirerJobs: async (status = 'active') => {
    try {
      const raw = await apiService.get(`/api/jobs/my-jobs?status=${status}`);
      // Return the jobs array from the API response
      return raw.data;
    } catch (error) {
      console.error(`Error fetching hirer jobs with status ${status}:`, error);
      return getMockHirerJobs(status);
    }
  },

  /**
   * Create a new job
   * @param {Object} jobData - Job data to create
   * @returns {Promise<Object>} - Created job object
   */
  createJob: async (jobData) => {
    try {
      const data = await apiService.post('/api/hirer/jobs', jobData);
      return data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  /**
   * Update an existing job
   * @param {string} jobId - Job ID to update
   * @param {Object} jobData - Updated job data
   * @returns {Promise<Object>} - Updated job object
   */
  updateJob: async (jobId, jobData) => {
    try {
      const data = await apiService.put(`/api/hirer/jobs/${jobId}`, jobData);
      return data;
    } catch (error) {
      console.error(`Error updating job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a job
   * @param {string} jobId - Job ID to delete
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteJob: async (jobId) => {
    try {
      const data = await apiService.delete(`/api/hirer/jobs/${jobId}`);
      return data;
    } catch (error) {
      console.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Publish a draft job
   * @param {string} jobId - Job ID to publish
   * @returns {Promise<Object>} - Published job object
   */
  publishJob: async (jobId) => {
    try {
      const data = await apiService.post(`/api/hirer/jobs/${jobId}/publish`);
      return data;
    } catch (error) {
      console.error(`Error publishing job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get applications for a specific job
   * @param {string} jobId - Job ID
   * @param {string} status - Application status (pending, accepted, rejected)
   * @returns {Promise<Array>} - Array of application objects
   */
  getJobApplications: async (jobId, status = 'pending') => {
    try {
      const raw = await apiService.get(
        `/api/jobs/${jobId}/applications?status=${status}`,
      );
      // Return the applications array from the API response
      return raw.data;
    } catch (error) {
      console.error(`Error fetching applications for job ${jobId}:`, error);
      if (metaEnv.DEV) {
        console.warn(
          `API call for job applications failed. Returning mock data for job ${jobId}.`,
        );
        return Promise.resolve(getMockJobApplications(jobId, status));
      }
      return [];
    }
  },

  /**
   * Update an application status
   * @param {string} jobId - Job ID
   * @param {string} applicationId - Application ID
   * @param {string} status - New status (accepted, rejected)
   * @param {string} feedback - Optional feedback message
   * @returns {Promise<Object>} - Updated application object
   */
  updateApplicationStatus: async (
    jobId,
    applicationId,
    status,
    feedback = '',
  ) => {
    try {
      const raw = await apiService.put(
        `/api/jobs/${jobId}/applications/${applicationId}`,
        {
          status,
          feedback,
        },
      );
      // Return the updated application from the API response
      return raw.data;
    } catch (error) {
      console.error(
        `Error updating application ${applicationId} status:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Search for workers by various criteria
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results and pagination
   */
  searchWorkers: async (searchParams) => {
    try {
      const data = await apiService.get(
        '/api/hirer/workers/search',
        searchParams,
      );
      return data;
    } catch (error) {
      console.error('Error searching workers:', error);
      return getMockWorkerSearchResults(searchParams);
    }
  },

  /**
   * Get saved/favorite workers
   * @returns {Promise<Array>} - Array of saved worker objects
   */
  getSavedWorkers: async () => {
    try {
      const data = await apiService.get('/api/hirer/saved-workers');
      return data;
    } catch (error) {
      console.error('Error fetching saved workers:', error);
      return [];
    }
  },

  /**
   * Save a worker to favorites
   * @param {string} workerId - Worker ID to save
   * @returns {Promise<Object>} - Saved worker object
   */
  saveWorker: async (workerId) => {
    try {
      const data = await apiService.post('/api/hirer/saved-workers', {
        workerId,
      });
      return data;
    } catch (error) {
      console.error(`Error saving worker ${workerId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a worker from favorites
   * @param {string} workerId - Worker ID to remove
   * @returns {Promise<Object>} - Removal confirmation
   */
  unsaveWorker: async (workerId) => {
    try {
      const data = await apiService.delete(
        `/api/hirer/saved-workers/${workerId}`,
      );
      return data;
    } catch (error) {
      console.error(`Error removing saved worker ${workerId}:`, error);
      throw error;
    }
  },

  /**
   * Release payment for a milestone
   * @param {string} jobId - Job ID
   * @param {string} milestoneId - Milestone ID
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>} - Payment confirmation
   */
  releasePayment: async (jobId, milestoneId, amount) => {
    try {
      const data = await apiService.post(
        `/api/hirer/jobs/${jobId}/milestones/${milestoneId}/payment`,
        {
          amount,
        },
      );
      return data;
    } catch (error) {
      console.error(
        `Error releasing payment for milestone ${milestoneId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Create a review for a worker
   * @param {string} workerId - Worker ID
   * @param {string} jobId - Job ID
   * @param {Object} reviewData - Review data (rating, comment)
   * @returns {Promise<Object>} - Created review object
   */
  createReview: async (workerId, jobId, reviewData) => {
    try {
      const data = await apiService.post(
        `/api/hirer/workers/${workerId}/reviews`,
        {
          jobId,
          ...reviewData,
        },
      );
      return data;
    } catch (error) {
      console.error(`Error creating review for worker ${workerId}:`, error);
      throw error;
    }
  },
};

const mockHirerProfile = {
  id: 'hirer-001',
  companyName: 'Kelmah Construction',
  contactName: 'Aship',
  email: 'aship@kelmahconstruction.com',
  phone: '555-123-4567',
  website: 'https://kelmahconstruction.com',
  profileImage: 'https://i.pravatar.cc/150?u=aship',
  businessLogo: '/logo.png',
  bio: 'A leading construction company specializing in residential and commercial projects. We are committed to quality, safety, and customer satisfaction.',
  recentActivity: [
    {
      id: 1,
      type: 'application',
      title: 'New application received',
      description:
        'Michael Johnson applied for your "Plumbing Repair Project".',
      time: '30 minutes ago',
      isRead: false,
    },
    {
      id: 2,
      type: 'contract',
      title: 'Contract accepted',
      description:
        'Sarah Williams accepted the contract for "Bathroom Renovation".',
      time: '2 hours ago',
      isRead: false,
    },
    {
      id: 3,
      type: 'message',
      title: 'New message received',
      description:
        'David Brown sent you a message regarding the "Electrical Installation" job.',
      time: '5 hours ago',
      isRead: true,
    },
    {
      id: 4,
      type: 'job_expired',
      title: 'Job posting expiring soon',
      description:
        'Your job posting "Kitchen Renovation" will expire in 2 days.',
      time: '1 day ago',
      isRead: true,
    },
    {
      id: 5,
      type: 'payment',
      title: 'Payment Released',
      description:
        'You released a payment of $500 for the "Landscaping Project".',
      time: '2 days ago',
      isRead: true,
    },
  ],
  notifications: [
    {
      id: 1,
      message: 'You have 3 new job applicants.',
      type: 'info',
      link: '/hirer/applications',
    },
    {
      id: 2,
      message: 'Contract for "Bathroom Renovation" is awaiting your signature.',
      type: 'warning',
      link: '/contracts/2',
    },
    {
      id: 3,
      message: 'Milestone 1 for "Kitchen Remodeling" has been completed.',
      type: 'success',
      link: '/contracts/3',
    },
  ],
  stats: {
    activeJobs: 5,
    pendingApplications: 28,
    activeContracts: 3,
    totalSpent: 12500,
  },
};

/**
 * Get mock job application data for development
 * @param {string} jobId - The ID of the job
 * @param {string} status - Application status filter
 * @returns {Array} - Array of application objects
 */
const getMockJobApplications = (jobId, status = 'pending') => {
  const allApplications = [
    {
      id: 'app-001',
      jobId: 1,
      workerId: 2,
      workerName: 'Robert Johnson',
      workerAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      workerRating: 4.6,
      coverLetter:
        "I have extensive experience with home theater setups and smart home integrations. I'm confident I can deliver a high-quality installation.",
      status: 'pending',
      appliedAt: '2023-10-19T10:00:00Z',
    },
    {
      id: 'app-002',
      jobId: 1,
      workerId: 3,
      workerName: 'Michael Davis',
      workerAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      workerRating: 4.9,
      coverLetter:
        'As a master carpenter, I have an eye for detail and can build beautiful, functional pieces. I would love to create your custom bookshelves.',
      status: 'pending',
      appliedAt: '2023-10-20T14:30:00Z',
    },
    {
      id: 'app-003',
      jobId: 2,
      workerId: 1,
      workerName: 'John Smith',
      workerAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      workerRating: 4.8,
      coverLetter:
        'With over 15 years of experience in plumbing, I can handle your bathroom renovation efficiently and professionally. I am available to start next week.',
      status: 'accepted',
      appliedAt: '2023-10-16T09:00:00Z',
    },
    {
      id: 'app-004',
      jobId: 2,
      workerId: 4,
      workerName: 'David Miller',
      workerAvatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      workerRating: 4.5,
      coverLetter:
        "I'm a professional painter with a great portfolio of exterior house painting projects. I can provide a high-quality finish for your home.",
      status: 'rejected',
      appliedAt: '2023-09-06T11:00:00Z',
    },
  ];

  const numericJobId = parseInt(jobId, 10);
  return allApplications.filter(
    (app) => app.jobId === numericJobId && app.status === status,
  );
};

/**
 * Get mock job data for development
 * @param {string} status - Job status filter
 * @returns {Array} - Array of job objects
 */
const getMockHirerJobs = (status = 'active') => {
  return mockJobs.filter((job) => job.status === status);
};

/**
 * Get mock worker search results for development
 * @param {Object} searchParams - Search parameters
 * @returns {Object} - Search results and pagination
 */
const getMockWorkerSearchResults = (searchParams = {}) => {
  let filteredWorkers = [...mockWorkers];

  // Apply search term filter
  if (searchParams.searchTerm) {
    const term = searchParams.searchTerm.toLowerCase();
    filteredWorkers = filteredWorkers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(term) ||
        worker.skills.some((skill) => skill.toLowerCase().includes(term)),
    );
  }

  // Apply skill filter
  if (searchParams.skills && searchParams.skills.length > 0) {
    filteredWorkers = filteredWorkers.filter((worker) =>
      searchParams.skills.some((skill) => worker.skills.includes(skill)),
    );
  }

  // Apply rating filter
  if (searchParams.minRating) {
    filteredWorkers = filteredWorkers.filter(
      (worker) => worker.rating >= searchParams.minRating,
    );
  }

  // Apply location filter
  if (searchParams.location) {
    const location = searchParams.location.toLowerCase();
    filteredWorkers = filteredWorkers.filter((worker) =>
      worker.location.toLowerCase().includes(location),
    );
  }

  // Calculate pagination
  const page = searchParams.page || 1;
  const limit = searchParams.limit || 10;
  const totalItems = filteredWorkers.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedWorkers = filteredWorkers.slice(offset, offset + limit);

  return {
    workers: paginatedWorkers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
    },
  };
};

// Mock data for jobs
const mockJobs = [
  {
    id: 1,
    title: 'Bathroom Renovation',
    description:
      'Complete renovation of a master bathroom including new fixtures, tiling, and plumbing.',
    category: 'Plumbing',
    skills: ['Pipe Repair', 'Tiling', 'Fixture Installation'],
    status: 'active',
    budget: {
      min: 60,
      max: 80,
      fixed: null,
    },
    paymentType: 'hourly',
    duration: '2 weeks',
    location: 'New York, NY',
    createdAt: '2023-10-15',
    applicationsCount: 12,
  },
  {
    id: 2,
    title: 'Home Theater Setup',
    description:
      'Installation of home theater system including wiring, speaker setup, and smart home integration.',
    category: 'Electrical',
    skills: ['Wiring', 'Home Automation', 'Audio Systems'],
    status: 'active',
    budget: {
      min: null,
      max: null,
      fixed: 1200,
    },
    paymentType: 'fixed',
    duration: '3 days',
    location: 'Remote',
    createdAt: '2023-10-18',
    applicationsCount: 8,
  },
  {
    id: 3,
    title: 'Custom Built-in Bookshelves',
    description: 'Design and build custom bookshelves for living room wall.',
    category: 'Carpentry',
    skills: ['Furniture Making', 'Custom Woodwork', 'Design'],
    status: 'draft',
    budget: {
      min: null,
      max: null,
      fixed: 2500,
    },
    paymentType: 'fixed',
    duration: '2 weeks',
    location: 'Chicago, IL',
    createdAt: '2023-10-20',
    applicationsCount: 0,
  },
  {
    id: 4,
    title: 'House Exterior Painting',
    description: 'Paint exterior of 2-story house including trim and doors.',
    category: 'Painting',
    skills: ['Exterior Painting', 'Color Consultation'],
    status: 'completed',
    budget: {
      min: 35,
      max: 50,
      fixed: null,
    },
    paymentType: 'hourly',
    duration: '1 week',
    location: 'Austin, TX',
    createdAt: '2023-09-05',
    completedAt: '2023-09-15',
    applicationsCount: 15,
  },
  {
    id: 5,
    title: 'HVAC System Maintenance',
    description:
      'Regular maintenance check for central HVAC system before winter season.',
    category: 'HVAC',
    skills: ['Maintenance', 'Diagnostics'],
    status: 'cancelled',
    budget: {
      min: 75,
      max: 100,
      fixed: null,
    },
    paymentType: 'hourly',
    duration: '1 day',
    location: 'Remote',
    createdAt: '2023-09-28',
    cancelledAt: '2023-10-02',
    applicationsCount: 5,
  },
];

// Mock data for workers
const mockWorkers = [
  {
    id: 1,
    name: 'John Smith',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    title: 'Master Plumber',
    skills: ['Pipe Repair', 'Water Heater Installation', 'Drainage Systems'],
    rating: 4.8,
    location: 'New York, NY',
    hourlyRate: 65,
    completedJobs: 124,
  },
  {
    id: 2,
    name: 'Robert Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    title: 'Certified Electrician',
    skills: ['Wiring', 'Circuit Breakers', 'Lighting'],
    rating: 4.6,
    location: 'Chicago, IL',
    hourlyRate: 70,
    completedJobs: 98,
  },
  {
    id: 3,
    name: 'Michael Davis',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    title: 'Expert Carpenter',
    skills: ['Cabinetry', 'Furniture Making', 'Framing'],
    rating: 4.9,
    location: 'Los Angeles, CA',
    hourlyRate: 75,
    completedJobs: 147,
  },
  {
    id: 4,
    name: 'David Miller',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    title: 'Professional Painter',
    skills: ['Interior Painting', 'Exterior Painting', 'Wallpaper'],
    rating: 4.5,
    location: 'Houston, TX',
    hourlyRate: 45,
    completedJobs: 73,
  },
  {
    id: 5,
    name: 'Richard Wilson',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    title: 'HVAC Specialist',
    skills: ['AC Installation', 'Heating Systems', 'Ventilation'],
    rating: 4.7,
    location: 'Philadelphia, PA',
    hourlyRate: 80,
    completedJobs: 112,
  },
];

export default hirerService;
