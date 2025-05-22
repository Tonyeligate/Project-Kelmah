/**
 * Hirer Controller
 * Handles hirer-specific operations
 */

const { AppError } = require('../utils/error');

// Mock data
const HIRER_PROFILES = {
  'ee650194-5336-4978-9441-046dae049dc9': { // This is Sammy's ID from logs
    id: 'ee650194-5336-4978-9441-046dae049dc9',
    firstName: 'Sam',
    lastName: 'Gemini',
    email: 'sammy@gmail.com',
    company: 'Gemini Enterprises',
    role: 'hirer',
    jobsPosted: 5,
    activeJobs: 2,
    completedJobs: 3,
    totalSpent: 12500,
    rating: 4.8,
    country: 'United States',
    city: 'San Francisco',
    joinedDate: '2022-08-15',
    lastActive: new Date().toISOString(),
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    activeWorkers: [
      { id: 1, name: 'John Doe', jobTitle: 'Web Developer', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', startDate: '2023-01-15' },
      { id: 2, name: 'Jane Smith', jobTitle: 'UX Designer', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', startDate: '2023-02-20' },
    ],
    recentActivity: [
      { 
        title: 'Posted a new job', 
        description: 'Full Stack Developer needed', 
        date: '2023-03-01', 
        icon: 'work', 
        color: 'primary.main' 
      },
      { 
        title: 'Hired new talent', 
        description: 'Mark Johnson for UI/UX project', 
        date: '2023-02-28', 
        icon: 'person', 
        color: 'success.main' 
      },
      { 
        title: 'Released payment', 
        description: '$2,500 for completed project', 
        date: '2023-02-25', 
        icon: 'payment', 
        color: 'info.main' 
      },
      { 
        title: 'Received proposals', 
        description: '5 new applications', 
        date: '2023-02-24', 
        icon: 'proposal', 
        color: 'warning.main' 
      },
    ]
  }
};

const MOCK_JOBS = {
  active: [
    {
      id: 'job-001',
      title: 'Full Stack Developer',
      description: 'Looking for a skilled full stack developer for a 3-month project',
      skills: ['React', 'Node.js', 'MongoDB'],
      budget: 5000,
      postedDate: '2023-02-15',
      proposals: 12,
      status: 'active',
      duration: '3 months',
      hirerInfo: {
        id: 'ee650194-5336-4978-9441-046dae049dc9',
        name: 'Sam Gemini',
      }
    },
    {
      id: 'job-002',
      title: 'UI/UX Designer',
      description: 'Need an experienced designer for a mobile app',
      skills: ['Figma', 'UI Design', 'Mobile Design'],
      budget: 3500,
      postedDate: '2023-02-28',
      proposals: 8,
      status: 'active',
      duration: '1 month',
      hirerInfo: {
        id: 'ee650194-5336-4978-9441-046dae049dc9',
        name: 'Sam Gemini',
      }
    }
  ],
  completed: [
    {
      id: 'job-003',
      title: 'Backend Developer',
      description: 'Built a REST API for our e-commerce platform',
      skills: ['Java', 'Spring Boot', 'PostgreSQL'],
      budget: 4500,
      completedDate: '2023-01-20',
      status: 'completed',
      rating: 5,
      duration: '2 months',
      hirerInfo: {
        id: 'ee650194-5336-4978-9441-046dae049dc9',
        name: 'Sam Gemini',
      },
      worker: {
        id: 'worker-001',
        name: 'Alice Johnson',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
      }
    },
    {
      id: 'job-004',
      title: 'WordPress Developer',
      description: 'Created a custom WordPress theme for our company',
      skills: ['WordPress', 'PHP', 'CSS'],
      budget: 2000,
      completedDate: '2023-01-05',
      status: 'completed',
      rating: 4.5,
      duration: '1 month',
      hirerInfo: {
        id: 'ee650194-5336-4978-9441-046dae049dc9',
        name: 'Sam Gemini',
      },
      worker: {
        id: 'worker-002',
        name: 'Robert Williams',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
      }
    },
    {
      id: 'job-005',
      title: 'Mobile App Developer',
      description: 'Developed a cross-platform mobile app',
      skills: ['React Native', 'Firebase', 'Redux'],
      budget: 6000,
      completedDate: '2022-12-15',
      status: 'completed',
      rating: 5,
      duration: '3 months',
      hirerInfo: {
        id: 'ee650194-5336-4978-9441-046dae049dc9',
        name: 'Sam Gemini',
      },
      worker: {
        id: 'worker-003',
        name: 'Jennifer Adams',
        avatar: 'https://randomuser.me/api/portraits/women/6.jpg'
      }
    }
  ]
};

/**
 * Get hirer profile
 */
exports.getHirerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find hirer profile in mock data
    const hirerProfile = HIRER_PROFILES[userId];
    
    if (!hirerProfile) {
      return res.status(200).json({ 
        success: true,
        data: {
          // Return empty default profile if not found
          id: userId,
          firstName: req.user.firstName || 'New',
          lastName: req.user.lastName || 'Hirer',
          email: req.user.email,
          company: 'Your Company',
          role: 'hirer',
          jobsPosted: 0,
          activeJobs: 0,
          completedJobs: 0,
          totalSpent: 0,
          rating: 0,
          country: '',
          city: '',
          joinedDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          activeWorkers: [],
          recentActivity: []
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: hirerProfile
    });
  } catch (error) {
    console.error('Error in getHirerProfile:', error);
    return next(new AppError('Failed to fetch hirer profile', 500));
  }
};

/**
 * Get hirer jobs
 */
exports.getHirerJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    if (!status || !['active', 'completed', 'draft', 'all'].includes(status)) {
      return next(new AppError('Please provide a valid job status', 400));
    }
    
    // Get jobs based on status
    let jobs = [];
    if (status === 'active') {
      jobs = MOCK_JOBS.active;
    } else if (status === 'completed') {
      jobs = MOCK_JOBS.completed;
    } else if (status === 'all') {
      jobs = [...MOCK_JOBS.active, ...MOCK_JOBS.completed];
    }
    
    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error in getHirerJobs:', error);
    return next(new AppError('Failed to fetch hirer jobs', 500));
  }
};

/**
 * Create job
 */
exports.createJob = async (req, res, next) => {
  try {
    // Placeholder for job creation
    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: {
        id: `job-${Date.now()}`,
        ...req.body,
        hirerInfo: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        status: 'active',
        postedDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in createJob:', error);
    return next(new AppError('Failed to create job', 500));
  }
};

/**
 * Update job
 */
exports.updateJob = async (req, res, next) => {
  try {
    // Placeholder for job update
    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: {
        id: req.params.jobId,
        ...req.body,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in updateJob:', error);
    return next(new AppError('Failed to update job', 500));
  }
}; 