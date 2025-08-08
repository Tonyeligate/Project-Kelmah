import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/search';

/**
 * Service for AI-powered smart job search and recommendations
 */
const smartSearchService = {
  /**
   * Get AI-powered job recommendations for a user
   * @param {string} userId - User ID
   * @param {Object} options - Search options and filters
   * @returns {Promise<Object>} - Job recommendations with AI insights
   */
  getSmartJobRecommendations: async (userId, options = {}) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/recommendations/${userId}`,
        { params: options }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Perform AI-enhanced job search
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Enhanced search results
   */
  performSmartSearch: async (searchParams) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/smart-search`, searchParams);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get job matching score and explanation
   * @param {string} jobId - Job ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Match analysis
   */
  getJobMatchAnalysis: async (jobId, userId) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/match-analysis/${jobId}/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save a job for later
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Save confirmation
   */
  saveJob: async (jobId) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/save-job`, { jobId });
      return response.data;
    } catch (error) {
      console.warn('Save job API not available:', error.message);
      throw error;
    }
  },

  /**
   * Remove a job from saved list
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Removal confirmation
   */
  unsaveJob: async (jobId) => {
    try {
      const response = await userServiceClient.delete(`${API_URL}/save-job/${jobId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Track user interaction with job recommendations
   * @param {string} jobId - Job ID
   * @param {string} action - Action type (view, click, apply, etc.)
   * @returns {Promise<Object>} - Tracking confirmation
   */
  trackJobInteraction: async (jobId, action) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/track-interaction`, {
        jobId,
        action,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get personalized search suggestions
   * @param {string} userId - User ID
   * @param {string} query - Partial search query
   * @returns {Promise<Object>} - Search suggestions
   */
  getSearchSuggestions: async (userId, query) => {
    try {
      const response = await userServiceClient.get(
        `${API_URL}/suggestions/${userId}`,
        { params: { q: query } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get job market insights
   * @param {Object} filters - Market analysis filters
   * @returns {Promise<Object>} - Market insights
   */
  getMarketInsights: async (filters = {}) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/market-insights`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get saved searches for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Saved searches
   */
  getSavedSearches: async (userId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/saved-searches/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a saved search
   * @param {string} userId - User ID
   * @param {Object} searchData - Search criteria and settings
   * @returns {Promise<Object>} - Created saved search
   */
  createSavedSearch: async (userId, searchData) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/saved-searches`, {
        userId,
        ...searchData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a saved search
   * @param {string} searchId - Saved search ID
   * @param {Object} updateData - Updated search data
   * @returns {Promise<Object>} - Updated saved search
   */
  updateSavedSearch: async (searchId, updateData) => {
    try {
      const response = await userServiceClient.put(
        `${API_URL}/saved-searches/${searchId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a saved search
   * @param {string} searchId - Saved search ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deleteSavedSearch: async (searchId) => {
    try {
      const response = await userServiceClient.delete(`${API_URL}/saved-searches/${searchId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Generate mock job recommendations
 * @param {string} userId - User ID
 * @param {Object} options - Search options
 * @returns {Object} Mock recommendations data
 */
const generateMockRecommendations = () => ({ jobs: [], savedJobIds: [], insights: {}, totalCount: 0, lastUpdated: new Date().toISOString() });

/**
 * Generate mock job recommendations for a specific user
 * This provides realistic fallback data when the recommendations API is unavailable
 */
const generateMockJobRecommendations = (userId, options = {}) => {
  const { limit = 6 } = options;
  
  const mockRecommendations = [
    {
      id: `rec-${userId}-1`,
      title: 'Senior Carpenter - Kitchen Specialist',
      company: 'Elite Woodworks Ghana',
      location: 'Accra, Greater Accra',
      type: 'Contract',
      experience: 'Mid-level',
      salary: { min: 4500, max: 6000, currency: 'GHS', period: 'project' },
      matchScore: 95,
      description: 'Join our team for high-end kitchen renovations. Perfect match for your carpentry skills.',
      postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
      skills: ['Carpentry', 'Kitchen Installation', 'Measurement', 'Cabinet Making'],
      urgency: 'high',
      featured: true,
      verified: true
    },
    {
      id: `rec-${userId}-2`,
      title: 'Plumbing Installation Specialist',
      company: 'HydroFix Solutions',
      location: 'Kumasi, Ashanti',
      type: 'Full-time',
      experience: 'Entry-level',
      salary: { min: 3200, max: 4200, currency: 'GHS', period: 'month' },
      matchScore: 88,
      description: 'Expand your skills with residential and commercial plumbing projects.',
      postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
      skills: ['Plumbing', 'Pipe Installation', 'Leak Repair', 'Maintenance'],
      urgency: 'medium',
      featured: false,
      verified: true
    },
    {
      id: `rec-${userId}-3`,
      title: 'Construction Site Supervisor',
      company: 'BuildRight Construction',
      location: 'Tema, Greater Accra',
      type: 'Contract',
      experience: 'Senior-level',
      salary: { min: 6000, max: 8500, currency: 'GHS', period: 'month' },
      matchScore: 82,
      description: 'Lead construction teams on commercial building projects. Leadership opportunity.',
      postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      skills: ['Project Management', 'Team Leadership', 'Construction', 'Safety Compliance'],
      urgency: 'high',
      featured: true,
      verified: true
    },
    {
      id: `rec-${userId}-4`,
      title: 'Electrical Maintenance Technician',
      company: 'PowerGrid Services',
      location: 'Takoradi, Western',
      type: 'Part-time',
      experience: 'Mid-level',
      salary: { min: 2800, max: 3800, currency: 'GHS', period: 'month' },
      matchScore: 79,
      description: 'Maintain electrical systems for residential complexes. Flexible schedule.',
      postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12), // 12 days from now
      skills: ['Electrical Maintenance', 'Troubleshooting', 'Wiring', 'Safety Protocols'],
      urgency: 'low',
      featured: false,
      verified: true
    },
    {
      id: `rec-${userId}-5`,
      title: 'Painting & Decoration Specialist',
      company: 'Artistic Interiors',
      location: 'Cape Coast, Central',
      type: 'Freelance',
      experience: 'Entry-level',
      salary: { min: 150, max: 250, currency: 'GHS', period: 'day' },
      matchScore: 75,
      description: 'Creative painting projects for homes and offices. Build your portfolio.',
      postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), // 15 days from now
      skills: ['Painting', 'Color Coordination', 'Interior Design', 'Surface Preparation'],
      urgency: 'medium',
      featured: false,
      verified: false
    },
    {
      id: `rec-${userId}-6`,
      title: 'Welding Fabrication Expert',
      company: 'SteelCraft Industries',
      location: 'Sunyani, Bono',
      type: 'Contract',
      experience: 'Senior-level',
      salary: { min: 5500, max: 7500, currency: 'GHS', period: 'project' },
      matchScore: 72,
      description: 'High-precision welding for industrial equipment. Certification provided.',
      postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8), // 8 days from now
      skills: ['Arc Welding', 'Metal Fabrication', 'Blueprint Reading', 'Quality Control'],
      urgency: 'high',
      featured: true,
      verified: true
    }
  ];

  // Return only the requested number of recommendations
  return mockRecommendations.slice(0, limit);
};

/**
 * Generate mock job search results
 * @param {Object} searchParams - Search parameters
 * @returns {Array} Mock job results
 */
const generateMockJobResults = (searchParams) => {
  // This would typically process searchParams and return relevant results
  // For now, return a subset of the mock recommendations
  return [];
};

export default smartSearchService;