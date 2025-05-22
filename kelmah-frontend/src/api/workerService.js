import { apiService } from '../utils/apiUtils';

/**
 * Service for making API calls related to workers
 */
export const workerService = {
  /**
   * Get all workers with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Array of worker objects
   */
  getWorkers: async (filters = {}) => {
    try {
      // In a real implementation, this would convert filters to query parameters
      const data = await apiService.get('/workers', filters);
      return data;
    } catch (error) {
      console.error('Error fetching workers:', error);
      // For now, return mock data
      return getMockWorkers(filters);
    }
  },

  /**
   * Get a specific worker by ID
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Worker object
   */
  getWorkerById: async (workerId) => {
    try {
      const data = await apiService.get(`/workers/${workerId}`);
      return data;
    } catch (error) {
      console.error(`Error fetching worker ${workerId}:`, error);
      // Return mock data for the specific worker
      return mockWorkers.find(worker => worker.id === Number(workerId)) || null;
    }
  },
  
  /**
   * Get reviews for a specific worker
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Filter criteria for reviews
   * @returns {Promise<Array>} - Array of review objects
   */
  getWorkerReviews: async (workerId, filters = {}) => {
    try {
      const data = await apiService.get(`/workers/${workerId}/reviews`, filters);
      return data;
    } catch (error) {
      console.error(`Error fetching reviews for worker ${workerId}:`, error);
      // Return mock reviews
      return mockWorkers.find(worker => worker.id === Number(workerId))?.reviews || [];
    }
  },
  
  /**
   * Submit a review for a worker
   * @param {string} workerId - Worker ID
   * @param {Object} reviewData - Review data to submit
   * @returns {Promise<Object>} - Created review object
   */
  submitReview: async (workerId, reviewData) => {
    try {
      const data = await apiService.post(`/workers/${workerId}/reviews`, reviewData);
      return data;
    } catch (error) {
      console.error(`Error submitting review for worker ${workerId}:`, error);
      throw error;
    }
  }
};

/**
 * Apply filters to mock worker data
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered array of worker objects
 */
const getMockWorkers = (filters = {}) => {
  let filteredWorkers = [...mockWorkers];
  
  // Apply text search filter
  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase();
    filteredWorkers = filteredWorkers.filter(worker => 
      worker.name.toLowerCase().includes(searchTerm) || 
      worker.title.toLowerCase().includes(searchTerm) ||
      worker.skills.some(skill => skill.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply location filter
  if (filters.location) {
    const location = filters.location.toLowerCase();
    filteredWorkers = filteredWorkers.filter(worker => 
      worker.location.toLowerCase().includes(location)
    );
  }
  
  // Apply category filter
  if (filters.category && filters.category !== 'All Categories') {
    filteredWorkers = filteredWorkers.filter(worker => 
      worker.category === filters.category
    );
  }
  
  // Apply hourly rate range filter
  if (filters.hourlyRateRange) {
    const [min, max] = filters.hourlyRateRange;
    filteredWorkers = filteredWorkers.filter(worker => 
      worker.hourlyRate >= min && worker.hourlyRate <= max
    );
  }
  
  // Apply minimum rating filter
  if (filters.minRating > 0) {
    filteredWorkers = filteredWorkers.filter(worker => 
      worker.rating >= filters.minRating
    );
  }
  
  // Apply verified only filter
  if (filters.verifiedOnly) {
    filteredWorkers = filteredWorkers.filter(worker => worker.verified);
  }
  
  // Apply sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'rating':
        filteredWorkers.sort((a, b) => b.rating - a.rating);
        break;
      case 'hourlyRate':
        filteredWorkers.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'hourlyRateDesc':
        filteredWorkers.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case 'experience':
        filteredWorkers.sort((a, b) => b.experience - a.experience);
        break;
      case 'completedJobs':
        filteredWorkers.sort((a, b) => b.completedJobs - a.completedJobs);
        break;
      default:
        break;
    }
  }
  
  return filteredWorkers;
};

// Mock data for workers
export const mockWorkers = [
  {
    id: 1,
    name: 'John Smith',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    title: 'Master Plumber',
    category: 'Plumbing',
    rating: 4.8,
    reviewCount: 47,
    location: 'New York, NY',
    hourlyRate: 65,
    verified: true,
    completedJobs: 124,
    experience: 12,
    skills: ['Pipe Repair', 'Water Heater Installation', 'Drainage Systems', 'Emergency Repairs', 'Fixture Installation'],
    reviews: [
      { id: 101, rating: 5, comment: 'Excellent work, very professional', author: 'James Wilson', date: '2023-11-15' },
      { id: 102, rating: 4, comment: 'Good job, a bit pricey', author: 'Sarah Johnson', date: '2023-10-22' }
    ]
  },
  {
    id: 2,
    name: 'Robert Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    title: 'Certified Electrician',
    category: 'Electrical',
    rating: 4.6,
    reviewCount: 39,
    location: 'Chicago, IL',
    hourlyRate: 70,
    verified: true,
    completedJobs: 98,
    experience: 8,
    skills: ['Wiring', 'Circuit Breakers', 'Lighting', 'Home Automation', 'Electrical Repairs'],
    reviews: [
      { id: 103, rating: 5, comment: 'Very knowledgeable and efficient', author: 'Lisa Thompson', date: '2023-11-05' },
      { id: 104, rating: 4, comment: 'Did a great job installing my lights', author: 'Michael Brown', date: '2023-09-18' }
    ]
  },
  {
    id: 3,
    name: 'Michael Davis',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    title: 'Expert Carpenter',
    category: 'Carpentry',
    rating: 4.9,
    reviewCount: 52,
    location: 'Los Angeles, CA',
    hourlyRate: 75,
    verified: true,
    completedJobs: 147,
    experience: 15,
    skills: ['Cabinetry', 'Furniture Making', 'Framing', 'Wood Repair', 'Custom Woodwork'],
    reviews: [
      { id: 105, rating: 5, comment: 'Amazing craftsmanship', author: 'Jennifer Clark', date: '2023-10-30' },
      { id: 106, rating: 5, comment: 'Built beautiful custom cabinets', author: 'Robert Lee', date: '2023-09-25' }
    ]
  },
  {
    id: 4,
    name: 'David Miller',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    title: 'Professional Painter',
    category: 'Painting',
    rating: 4.5,
    reviewCount: 28,
    location: 'Houston, TX',
    hourlyRate: 45,
    verified: false,
    completedJobs: 73,
    experience: 6,
    skills: ['Interior Painting', 'Exterior Painting', 'Wallpaper', 'Color Consultation', 'Decorative Painting'],
    reviews: [
      { id: 107, rating: 4, comment: 'Good work but took longer than expected', author: 'Patricia Moore', date: '2023-11-02' },
      { id: 108, rating: 5, comment: 'Excellent attention to detail', author: 'Thomas Young', date: '2023-10-15' }
    ]
  },
  {
    id: 5,
    name: 'Richard Wilson',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    title: 'HVAC Specialist',
    category: 'HVAC',
    rating: 4.7,
    reviewCount: 41,
    location: 'Philadelphia, PA',
    hourlyRate: 80,
    verified: true,
    completedJobs: 112,
    experience: 10,
    skills: ['AC Installation', 'Heating Systems', 'Ventilation', 'Maintenance', 'Diagnostics'],
    reviews: [
      { id: 109, rating: 5, comment: 'Fixed my AC quickly in the summer heat', author: 'Charles Lopez', date: '2023-08-10' },
      { id: 110, rating: 4, comment: 'Knowledgeable but a bit expensive', author: 'Nancy Garcia', date: '2023-07-22' }
    ]
  },
  {
    id: 6,
    name: 'Thomas Brown',
    avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
    title: 'Master Welder',
    category: 'Welding',
    rating: 4.8,
    reviewCount: 36,
    location: 'Phoenix, AZ',
    hourlyRate: 90,
    verified: true,
    completedJobs: 84,
    experience: 14,
    skills: ['MIG Welding', 'TIG Welding', 'Structural Welding', 'Metal Fabrication', 'Custom Projects'],
    reviews: [
      { id: 111, rating: 5, comment: 'Amazing work on my custom gate', author: 'Daniel Robinson', date: '2023-10-18' },
      { id: 112, rating: 5, comment: 'Professional and precise', author: 'Mark Williams', date: '2023-09-05' }
    ]
  },
  {
    id: 7,
    name: 'Steven Taylor',
    avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
    title: 'Landscape Architect',
    category: 'Landscaping',
    rating: 4.6,
    reviewCount: 33,
    location: 'San Diego, CA',
    hourlyRate: 85,
    verified: false,
    completedJobs: 67,
    experience: 9,
    skills: ['Garden Design', 'Irrigation', 'Hardscaping', 'Plant Selection', 'Maintenance'],
    reviews: [
      { id: 113, rating: 4, comment: 'Transformed my yard beautifully', author: 'Susan Wright', date: '2023-10-25' },
      { id: 114, rating: 5, comment: 'Great ideas and execution', author: 'Joseph Jones', date: '2023-08-15' }
    ]
  },
  {
    id: 8,
    name: 'Emily Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    title: 'Interior Decorator',
    category: 'Painting',
    rating: 4.9,
    reviewCount: 48,
    location: 'Boston, MA',
    hourlyRate: 95,
    verified: true,
    completedJobs: 104,
    experience: 11,
    skills: ['Color Schemes', 'Space Planning', 'Furniture Selection', 'Custom Designs', 'Project Management'],
    reviews: [
      { id: 115, rating: 5, comment: 'Amazing eye for design', author: 'William Davis', date: '2023-11-10' },
      { id: 116, rating: 5, comment: 'Completely transformed my living space', author: 'Elizabeth Taylor', date: '2023-09-28' }
    ]
  },
  {
    id: 9,
    name: 'Jessica Smith',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    title: 'Master Plumber',
    category: 'Plumbing',
    rating: 4.7,
    reviewCount: 31,
    location: 'Seattle, WA',
    hourlyRate: 70,
    verified: true,
    completedJobs: 89,
    experience: 8,
    skills: ['Pipe Repair', 'Fixture Installation', 'Drain Cleaning', 'Water Systems', 'Commercial Plumbing'],
    reviews: [
      { id: 117, rating: 5, comment: 'Very professional and knowledgeable', author: 'Mary Johnson', date: '2023-10-20' },
      { id: 118, rating: 4, comment: 'Fixed our leak quickly', author: 'James Wilson', date: '2023-09-12' }
    ]
  },
  {
    id: 10,
    name: 'Sarah Davis',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    title: 'Certified Electrician',
    category: 'Electrical',
    rating: 4.8,
    reviewCount: 42,
    location: 'Denver, CO',
    hourlyRate: 75,
    verified: true,
    completedJobs: 118,
    experience: 12,
    skills: ['Electrical Panels', 'Wiring', 'Troubleshooting', 'Lighting Installation', 'Electrical Upgrades'],
    reviews: [
      { id: 119, rating: 5, comment: 'Excellent work rewiring my home', author: 'Linda Martinez', date: '2023-11-08' },
      { id: 120, rating: 4, comment: 'Professional and reliable', author: 'Richard Harris', date: '2023-10-05' }
    ]
  }
];

export default workerService; 