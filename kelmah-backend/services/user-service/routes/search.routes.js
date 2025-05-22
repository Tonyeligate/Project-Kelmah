const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const availabilityController = require('../controllers/availability.controller');
const skillsController = require('../controllers/skills.controller');
const authenticateToken = require('../middleware/authenticateToken');

// Temporary authentication middleware
const authMiddleware = {
  authenticate: (req, res, next) => {
    // For development, just add a mock user to the request
    req.user = { id: req.params.userId || 'development-user-id' };
    next();
  }
};

// Mock data for search results
const searchData = {
  workers: [
    {
      id: '1',
      name: 'John Smith',
      headline: 'Senior Frontend Developer',
      location: 'San Francisco, CA',
      rating: 4.8,
      hourlyRate: 75,
      skills: ['React', 'TypeScript', 'Node.js'],
      availability: 'Full-Time',
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
      isRemote: true
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      headline: 'Full Stack Engineer',
      location: 'New York, NY',
      rating: 4.9,
      hourlyRate: 85,
      skills: ['Angular', 'Java', 'Spring Boot'],
      availability: 'Contract',
      profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
      isRemote: false
    },
    {
      id: '3',
      name: 'Michael Chen',
      headline: 'Mobile App Developer',
      location: 'Austin, TX',
      rating: 4.7,
      hourlyRate: 70,
      skills: ['React Native', 'Swift', 'Firebase'],
      availability: 'Part-Time',
      profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg',
      isRemote: true
    },
    {
      id: '4',
      name: 'Emily Davis',
      headline: 'UX/UI Designer',
      location: 'Seattle, WA',
      rating: 4.6,
      hourlyRate: 65,
      skills: ['Figma', 'Adobe XD', 'Sketch'],
      availability: 'Freelance',
      profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg',
      isRemote: true
    },
    {
      id: '5',
      name: 'David Wilson',
      headline: 'DevOps Engineer',
      location: 'Chicago, IL',
      rating: 4.9,
      hourlyRate: 90,
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
      availability: 'Full-Time',
      profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg',
      isRemote: false
    },
    {
      id: '6',
      name: 'Jessica Brown',
      headline: 'Data Scientist',
      location: 'Boston, MA',
      rating: 4.8,
      hourlyRate: 95,
      skills: ['Python', 'TensorFlow', 'SQL', 'R'],
      availability: 'Contract',
      profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg',
      isRemote: true
    }
  ],
  recommended: [
    {
      id: '1',
      name: 'John Smith',
      headline: 'Senior Frontend Developer',
      location: 'San Francisco, CA',
      rating: 4.8,
      matchScore: 92,
      skills: ['React', 'TypeScript', 'Node.js'],
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      id: '6',
      name: 'Jessica Brown',
      headline: 'Data Scientist',
      location: 'Boston, MA',
      rating: 4.8,
      matchScore: 88,
      skills: ['Python', 'TensorFlow', 'SQL', 'R'],
      profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg'
    },
    {
      id: '3',
      name: 'Michael Chen',
      headline: 'Mobile App Developer',
      location: 'Austin, TX',
      rating: 4.7,
      matchScore: 85,
      skills: ['React Native', 'Swift', 'Firebase'],
      profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg'
    }
  ],
  nearby: [
    {
      id: '2',
      name: 'Sarah Johnson',
      headline: 'Full Stack Engineer',
      location: 'New York, NY',
      distance: 2.5,
      rating: 4.9,
      profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      id: '5',
      name: 'David Wilson',
      headline: 'DevOps Engineer',
      location: 'Chicago, IL',
      distance: 3.8,
      rating: 4.9,
      profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg'
    },
    {
      id: '4',
      name: 'Emily Davis',
      headline: 'UX/UI Designer',
      location: 'Seattle, WA',
      distance: 5.2,
      rating: 4.6,
      profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg'
    }
  ],
  skills: [
    { id: '1', name: 'JavaScript', category: 'Programming', popularity: 95 },
    { id: '2', name: 'React', category: 'Frontend', popularity: 92 },
    { id: '3', name: 'Node.js', category: 'Backend', popularity: 88 },
    { id: '4', name: 'Python', category: 'Programming', popularity: 90 },
    { id: '5', name: 'AWS', category: 'DevOps', popularity: 85 },
    { id: '6', name: 'Docker', category: 'DevOps', popularity: 80 },
    { id: '7', name: 'TypeScript', category: 'Programming', popularity: 82 },
    { id: '8', name: 'Angular', category: 'Frontend', popularity: 78 },
    { id: '9', name: 'SQL', category: 'Database', popularity: 86 },
    { id: '10', name: 'MongoDB', category: 'Database', popularity: 75 }
  ],
  featured: [
    {
      id: '2',
      name: 'Sarah Johnson',
      headline: 'Full Stack Engineer',
      location: 'New York, NY',
      rating: 4.9,
      profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      id: '5',
      name: 'David Wilson',
      headline: 'DevOps Engineer',
      location: 'Chicago, IL',
      rating: 4.9,
      profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg'
    },
    {
      id: '6',
      name: 'Jessica Brown',
      headline: 'Data Scientist',
      location: 'Boston, MA',
      rating: 4.8,
      profilePicture: 'https://randomuser.me/api/portraits/women/6.jpg'
    }
  ],
  availability: [
    { id: '1', name: 'Full-Time', count: 156 },
    { id: '2', name: 'Part-Time', count: 89 },
    { id: '3', name: 'Contract', count: 112 },
    { id: '4', name: 'Freelance', count: 75 }
  ]
};

// Worker search routes
router.get('/workers', searchController.searchWorkers);

// Job search routes
router.get('/jobs', searchController.searchJobs);

// Recommendation routes (require authentication)
router.get('/recommendations/jobs/:workerId', authenticateToken, searchController.getJobRecommendations);
router.get('/recommendations/workers/:jobId', authenticateToken, searchController.getWorkerRecommendations);

// Saved searches (require authentication)
router.post('/saved', authenticateToken, searchController.saveSearch);

// Analytics routes (could be restricted to admins in a real app)
router.get('/analytics/popular-terms', searchController.getPopularSearchTerms);

// Cache management (admin only in production)
router.delete('/cache', authenticateToken, searchController.clearSearchCache);

// Search workers
router.get('/workers', (req, res) => {
  // Get query parameters
  const { skills, location, availability, remote } = req.query;
  
  // In a real implementation, we would filter based on these parameters
  // For now, just return all mock workers
  
  res.status(200).json({
    success: true,
    data: searchData.workers,
    filters: { skills, location, availability, remote }
  });
});

// Advanced search for workers
router.post('/workers/advanced', (req, res) => {
  // Get filter criteria from request body
  const { skills, location, experience, hourlyRateRange, availability, remote } = req.body;
  
  // In a real implementation, we would filter based on these parameters
  // For now, just return all mock workers with search criteria
  
  res.status(200).json({
    success: true,
    data: searchData.workers,
    searchCriteria: { skills, location, experience, hourlyRateRange, availability, remote }
  });
});

// Get recommended workers for a project
router.get('/workers/recommended/:projectId', authMiddleware.authenticate, (req, res) => {
  // Get project ID from parameters
  const { projectId } = req.params;
  
  res.status(200).json({
    success: true,
    data: searchData.recommended,
    projectId
  });
});

// Get nearby workers
router.get('/workers/nearby', (req, res) => {
  // Get location parameters
  const { latitude, longitude, radius } = req.query;
  
  res.status(200).json({
    success: true,
    data: searchData.nearby,
    location: { latitude, longitude, radius }
  });
});

// Get featured workers
router.get('/featured', (req, res) => {
  res.status(200).json({
    success: true,
    data: searchData.featured
  });
});

// Get availability options with counts
router.get('/availability', (req, res) => {
  res.status(200).json({
    success: true,
    data: searchData.availability
  });
});

// Get popular skills
router.get('/skills/popular', (req, res) => {
  // Get limit parameter or default to 10
  const limit = parseInt(req.query.limit) || 10;
  
  // Sort by popularity and take the first 'limit' skills
  const popularSkills = searchData.skills
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
  
  res.status(200).json({
    success: true,
    data: popularSkills
  });
});

// Get all skills
router.get('/skills', (req, res) => {
  res.status(200).json({
    success: true,
    data: searchData.skills
  });
});

module.exports = router; 