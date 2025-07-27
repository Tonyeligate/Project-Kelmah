import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service client - temporarily using AUTH_SERVICE until JOB_SERVICE is deployed
const jobServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE, // Will be SERVICES.JOB_SERVICE when deployed
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

// Comprehensive mock jobs data
const mockJobsData = {
  jobs: [
    {
      id: 'job-1',
      title: 'Kitchen Renovation - Custom Cabinets',
      description:
        'We need a skilled carpenter to design and install custom kitchen cabinets for a modern home renovation project. The work includes measuring, designing, building, and installing high-quality wooden cabinets.',
      category: 'Carpentry',
      subcategory: 'Cabinet Making',
      type: 'fixed',
      budget: 5500,
      currency: 'GHS',
      status: 'active',
      location: {
        city: 'Accra',
        region: 'Greater Accra',
        address: 'East Legon',
        coordinates: { lat: 5.6037, lng: -0.187 },
      },
      skills: ['Carpentry', 'Cabinet Making', 'Wood Finishing', 'Design'],
      urgency: 'medium',
      duration: '3 weeks',
      requirements: [
        'Minimum 3 years carpentry experience',
        'Portfolio of kitchen cabinet work',
        'Own tools and transportation',
        'Available for 3-week project timeline',
      ],
      benefits: [
        'Competitive fixed rate payment',
        'Potential for future projects',
        'Professional reference provided',
        'Material costs covered separately',
      ],
      postedBy: {
        id: 'hirer-001',
        name: 'Sarah Mitchell',
        company: 'Mitchell Construction Ltd',
        avatar: '/api/placeholder/50/50',
        rating: 4.8,
        verificationStatus: 'verified',
      },
      applicationsCount: 8,
      viewsCount: 24,
      savedCount: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      featured: true,
    },
    {
      id: 'job-2',
      title: 'Office Interior Design & Setup',
      description:
        'Looking for an experienced interior designer to completely redesign and set up our new office space. The project includes space planning, furniture selection, lighting design, and complete installation.',
      category: 'Interior Design',
      subcategory: 'Office Design',
      type: 'fixed',
      budget: 15000,
      currency: 'GHS',
      status: 'active',
      location: {
        city: 'Accra',
        region: 'Greater Accra',
        address: 'Airport City',
        coordinates: { lat: 5.61, lng: -0.1767 },
      },
      skills: [
        'Interior Design',
        'Space Planning',
        'Project Management',
        'Furniture Selection',
      ],
      urgency: 'high',
      duration: '4 weeks',
      requirements: [
        'Interior design certification or equivalent experience',
        'Proven track record with office designs',
        'Ability to manage full project lifecycle',
        'Experience with modern office layouts',
      ],
      benefits: [
        'High-value project with room for creativity',
        'Milestone-based payments',
        'Portfolio piece for future marketing',
        'Long-term client relationship potential',
      ],
      postedBy: {
        id: 'hirer-002',
        name: 'James Osei',
        company: 'TechFlow Solutions',
        avatar: '/api/placeholder/50/50',
        rating: 4.9,
        verificationStatus: 'verified',
      },
      applicationsCount: 12,
      viewsCount: 45,
      savedCount: 8,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      featured: true,
    },
    {
      id: 'job-3',
      title: 'Residential Electrical System Upgrade',
      description:
        'Complete electrical system upgrade for a 4-bedroom house including new wiring, outlets, modern electrical panel, and safety inspections.',
      category: 'Electrical',
      subcategory: 'Residential Wiring',
      type: 'fixed',
      budget: 8500,
      currency: 'GHS',
      status: 'active',
      location: {
        city: 'Tema',
        region: 'Greater Accra',
        address: 'Community 25',
        coordinates: { lat: 5.6698, lng: -0.0167 },
      },
      skills: [
        'Electrical Installation',
        'Wiring',
        'Safety Certification',
        'Electrical Panel',
      ],
      urgency: 'medium',
      duration: '2 weeks',
      requirements: [
        'Licensed electrician certification',
        'Experience with residential electrical systems',
        'Safety protocol compliance',
        'Insurance coverage required',
      ],
      benefits: [
        'Fair market rate compensation',
        'Materials provided by client',
        'Flexible working hours',
        'Safety equipment provided',
      ],
      postedBy: {
        id: 'hirer-003',
        name: 'Mary Asante',
        company: 'Asante Family',
        avatar: '/api/placeholder/50/50',
        rating: 4.6,
        verificationStatus: 'verified',
      },
      applicationsCount: 6,
      viewsCount: 18,
      savedCount: 4,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      featured: false,
    },
    {
      id: 'job-4',
      title: 'Bathroom Renovation - Modern Design',
      description:
        'Complete bathroom renovation with modern fixtures, tiling, plumbing updates, and stylish finishing touches.',
      category: 'Plumbing',
      subcategory: 'Bathroom Renovation',
      type: 'fixed',
      budget: 7800,
      currency: 'GHS',
      status: 'active',
      location: {
        city: 'Kumasi',
        region: 'Ashanti',
        address: 'Adum',
        coordinates: { lat: 6.6885, lng: -1.6244 },
      },
      skills: ['Plumbing', 'Tiling', 'Bathroom Design', 'Fixture Installation'],
      urgency: 'low',
      duration: '2.5 weeks',
      requirements: [
        'Licensed plumber certification',
        'Experience with bathroom renovations',
        'Tiling and fixture installation skills',
        'Portfolio of previous bathroom work',
      ],
      benefits: [
        'Creative project with modern design',
        'All materials provided',
        'Competitive compensation',
        'Potential for additional home projects',
      ],
      postedBy: {
        id: 'hirer-004',
        name: 'Kwame Boateng',
        company: 'Boateng Residence',
        avatar: '/api/placeholder/50/50',
        rating: 4.7,
        verificationStatus: 'verified',
      },
      applicationsCount: 9,
      viewsCount: 22,
      savedCount: 6,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18),
      featured: false,
    },
    {
      id: 'job-5',
      title: 'Commercial Painting - Office Building',
      description:
        'Professional painting services for a 3-story office building including interior and exterior work.',
      category: 'Painting',
      subcategory: 'Commercial Painting',
      type: 'fixed',
      budget: 12000,
      currency: 'GHS',
      status: 'active',
      location: {
        city: 'Takoradi',
        region: 'Western',
        address: 'Takoradi Market Circle',
        coordinates: { lat: 4.8845, lng: -1.7554 },
      },
      skills: [
        'Commercial Painting',
        'Surface Preparation',
        'Color Consultation',
        'Safety Protocols',
      ],
      urgency: 'medium',
      duration: '3 weeks',
      requirements: [
        'Commercial painting experience',
        'Safety certification required',
        'Own equipment and supplies',
        'Insurance coverage necessary',
      ],
      benefits: [
        'Large scale project',
        'Professional reference',
        'Competitive market rate',
        'Potential for ongoing maintenance work',
      ],
      postedBy: {
        id: 'hirer-005',
        name: 'Rebecca Mensah',
        company: 'Coastal Properties Ltd',
        avatar: '/api/placeholder/50/50',
        rating: 4.5,
        verificationStatus: 'verified',
      },
      applicationsCount: 11,
      viewsCount: 33,
      savedCount: 7,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      featured: false,
    },
  ],
  totalPages: 2,
  totalJobs: 8,
};

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
    urgency: job.urgency,
    duration: job.duration,
    postedBy: job.postedBy,
    applicationsCount: job.applicationsCount || 0,
    viewsCount: job.viewsCount || 0,
    savedCount: job.savedCount || 0,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    deadline: job.deadline,
    featured: job.featured || false,
  };
};

const transformJobDetail = (job) => {
  if (!job) return null;

  return {
    ...job,
    requirements: job.requirements || [],
    benefits: job.benefits || [],
    location: {
      ...job.location,
      coordinates: job.location?.coordinates || { lat: 5.6037, lng: -0.187 },
    },
  };
};

/**
 * Jobs API service
 */
const jobsApi = {
  /**
   * Get jobs with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Paginated jobs data in UI shape
   */
  getJobs: async (params = {}) => {
    try {
      const response = await jobServiceClient.get('/api/jobs', { params });
      // Unwrap paginated response: { success, message, data: [...], meta: { pagination } }
      const raw = response.data;
      const totalPages = raw.meta?.pagination?.totalPages || 1;
      const jobs = (raw.data || []).map(transformJobListItem);
      return { jobs, totalPages };
    } catch (error) {
      console.warn(
        'Job service unavailable, using comprehensive mock data:',
        error.message,
      );

      // Apply filters to mock data
      let filteredJobs = mockJobsData.jobs;

      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.title.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm) ||
            job.skills.some((skill) =>
              skill.toLowerCase().includes(searchTerm),
            ),
        );
      }

      if (params.category) {
        filteredJobs = filteredJobs.filter(
          (job) => job.category === params.category,
        );
      }

      if (params.location) {
        filteredJobs = filteredJobs.filter(
          (job) =>
            job.location.city
              .toLowerCase()
              .includes(params.location.toLowerCase()) ||
            job.location.region
              .toLowerCase()
              .includes(params.location.toLowerCase()),
        );
      }

      if (params.minBudget) {
        filteredJobs = filteredJobs.filter(
          (job) => job.budget >= parseInt(params.minBudget),
        );
      }

      if (params.maxBudget) {
        filteredJobs = filteredJobs.filter(
          (job) => job.budget <= parseInt(params.maxBudget),
        );
      }

      const jobs = filteredJobs.map(transformJobListItem);
      return {
        jobs,
        totalPages: Math.ceil(jobs.length / 10),
        totalJobs: jobs.length,
      };
    }
  },

  /**
   * Get job by ID
   * @param {string} id - Job ID
   * @returns {Promise<Object>} - Job data in UI shape
   */
  getJobById: async (id) => {
    try {
      const response = await jobServiceClient.get(`/api/jobs/${id}`);
      // Unwrap single job response: { success, message, data: job }
      const raw = response.data;
      const job = transformJobDetail(raw.data);
      return job;
    } catch (error) {
      console.warn(
        `Job service unavailable for job ${id}, using mock data:`,
        error.message,
      );

      // Return mock job data
      const job = mockJobsData.jobs.find((j) => j.id === id);
      if (job) {
        return transformJobDetail(job);
      } else {
        // Return first job as fallback
        return transformJobDetail(mockJobsData.jobs[0]);
      }
    }
  },

  /**
   * Create a new job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} - Promise with created job
   */
  createJob: async (jobData) => {
    try {
      const response = await jobServiceClient.post('/api/jobs', jobData);
      const raw = response.data;
      return transformJobDetail(raw.data);
    } catch (error) {
      console.warn(
        'Job service unavailable for job creation, simulating success:',
        error.message,
      );

      const newJob = {
        id: `job-${Date.now()}`,
        ...jobData,
        status: 'draft',
        applicationsCount: 0,
        viewsCount: 0,
        savedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        postedBy: {
          id: 'current-user',
          name: 'Current User',
          company: 'Your Company',
          avatar: '/api/placeholder/50/50',
          rating: 4.8,
          verificationStatus: 'verified',
        },
      };

      return transformJobDetail(newJob);
    }
  },

  /**
   * Update a job
   * @param {string} id - Job ID
   * @param {Object} jobData - Updated job data
   * @returns {Promise<Object>} - Promise with updated job
   */
  updateJob: async (id, jobData) => {
    try {
      const response = await jobServiceClient.put(`/api/jobs/${id}`, jobData);
      const raw = response.data;
      return transformJobDetail(raw.data);
    } catch (error) {
      console.warn(
        `Job service unavailable for job ${id} update, simulating success:`,
        error.message,
      );

      const existingJob =
        mockJobsData.jobs.find((j) => j.id === id) || mockJobsData.jobs[0];
      const updatedJob = {
        ...existingJob,
        ...jobData,
        updatedAt: new Date(),
      };

      return transformJobDetail(updatedJob);
    }
  },

  /**
   * Delete a job
   * @param {string} id - Job ID
   * @returns {Promise<void>}
   */
  deleteJob: async (id) => {
    try {
      await jobServiceClient.delete(`/api/jobs/${id}`);
    } catch (error) {
      console.warn(
        `Job service unavailable for job ${id} deletion, simulating success:`,
        error.message,
      );
      // Simulate successful deletion
    }
  },

  /**
   * Apply to a job
   * @param {string} jobId - Job ID
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} - Promise with application result
   */
  applyToJob: async (jobId, applicationData) => {
    try {
      const response = await jobServiceClient.post(
        `/api/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      console.warn(
        `Job service unavailable for job ${jobId} application, simulating success:`,
        error.message,
      );

      return {
        success: true,
        message: 'Application submitted successfully (mock)',
        data: {
          id: `app-${Date.now()}`,
          jobId,
          status: 'pending',
          submittedAt: new Date(),
          ...applicationData,
        },
      };
    }
  },

  /**
   * Get job applications
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} - Promise with applications
   */
  getJobApplications: async (jobId) => {
    try {
      const response = await jobServiceClient.get(
        `/api/jobs/${jobId}/applications`,
      );
      return response.data;
    } catch (error) {
      console.warn(
        `Job service unavailable for job ${jobId} applications, using mock data:`,
        error.message,
      );

      return [
        {
          id: `app-${jobId}-1`,
          jobId,
          applicant: {
            id: 'worker-1',
            name: 'Tony Gate',
            avatar: '/api/placeholder/50/50',
            rating: 4.8,
            completedJobs: 23,
          },
          status: 'pending',
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          coverLetter:
            'I am very interested in this position and have relevant experience.',
        },
      ];
    }
  },
};

export default jobsApi;
