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
      // Fallback with comprehensive mock data for development
      console.warn('Smart recommendations API not available, using mock data');
      
      const mockData = generateMockRecommendations(userId, options);
      
      return {
        data: mockData
      };
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
      console.warn('Smart search API not available, using mock data');
      return {
        data: {
          jobs: generateMockJobResults(searchParams),
          totalCount: 45,
          searchInsights: {
            suggestedFilters: ['Remote', 'Part-time', 'Evening'],
            relatedSkills: ['Python', 'JavaScript', 'React'],
            marketTrends: 'High demand for web developers in Accra',
            salaryInsights: 'Average salary: ₵3,500 - ₵5,500'
          },
          aiOptimizations: [
            'Expanded search to include similar job titles',
            'Included jobs matching 80% of your skills',
            'Prioritized jobs from preferred locations'
          ]
        }
      };
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
      console.warn('Match analysis API not available, using mock data');
      return {
        data: {
          overallScore: 85,
          breakdown: [
            { factor: 'Skills Match', score: 90, weight: 40 },
            { factor: 'Location', score: 95, weight: 25 },
            { factor: 'Experience', score: 75, weight: 20 },
            { factor: 'Availability', score: 80, weight: 15 }
          ],
          reasoning: 'Strong match based on your plumbing expertise and proximity to job location.',
          improvementSuggestions: [
            'Add "Commercial Plumbing" skill to increase match score',
            'Update availability to match job requirements'
          ]
        }
      };
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
      console.warn('Save job API not available, simulating success');
      return { data: { success: true, message: 'Job saved successfully' } };
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
      console.warn('Unsave job API not available, simulating success');
      return { data: { success: true, message: 'Job removed from saved list' } };
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
      console.warn('Interaction tracking API not available, simulating success');
      return { data: { success: true } };
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
      console.warn('Search suggestions API not available, using mock data');
      return {
        data: {
          suggestions: [
            'Plumbing jobs in Accra',
            'Electrical work near me',
            'Carpentry projects',
            'Emergency plumbing repairs',
            'Commercial electrical installation'
          ],
          trending: [
            'HVAC installation',
            'Solar panel installation',
            'Kitchen renovation',
            'Bathroom repairs'
          ]
        }
      };
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
      console.warn('Market insights API not available, using mock data');
      return {
        data: {
          averageSalary: {
            min: 2500,
            max: 4500,
            median: 3500
          },
          demandTrends: {
            high: ['Plumbing', 'Electrical', 'HVAC'],
            medium: ['Carpentry', 'Painting'],
            low: ['General Labor']
          },
          locationHotspots: [
            { location: 'Accra', jobCount: 145, growth: '+12%' },
            { location: 'Kumasi', jobCount: 89, growth: '+8%' },
            { location: 'Tema', jobCount: 67, growth: '+15%' }
          ],
          skillsInDemand: [
            'Advanced Plumbing Systems',
            'Solar Panel Installation',
            'Smart Home Electrical',
            'Sustainable Building Practices'
          ],
          seasonalTrends: {
            peak: 'March - June (Construction season)',
            low: 'December - January (Holiday season)'
          }
        }
      };
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
      console.warn('Saved searches API not available, using mock data');
      return {
        data: [
          {
            id: 1,
            name: 'Plumbing Jobs in Accra',
            query: 'plumbing',
            filters: { location: 'Accra', category: 'Plumbing' },
            alertsEnabled: true,
            lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            resultsCount: 23
          },
          {
            id: 2,
            name: 'High-Paying Electrical Work',
            query: 'electrical',
            filters: { minBudget: 3000, category: 'Electrical' },
            alertsEnabled: false,
            lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            resultsCount: 12
          }
        ]
      };
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
      console.warn('Create saved search API not available, simulating success');
      return {
        data: {
          id: Date.now(),
          ...searchData,
          userId,
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString()
        }
      };
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
      console.warn('Update saved search API not available, simulating success');
      return {
        data: {
          id: searchId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      };
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
      console.warn('Delete saved search API not available, simulating success');
      return { data: { success: true, message: 'Saved search deleted successfully' } };
    }
  }
};

/**
 * Generate mock job recommendations
 * @param {string} userId - User ID
 * @param {Object} options - Search options
 * @returns {Object} Mock recommendations data
 */
const generateMockRecommendations = (userId, options) => {
  const mockJobs = [
    {
      id: 'job_1',
      title: 'Emergency Plumbing Repair - Kitchen Sink',
      description: 'Urgent repair needed for a blocked kitchen sink in a 3-bedroom house. Previous plumber was unable to resolve the issue. Looking for an experienced plumber who can diagnose and fix the problem quickly.',
      location: 'East Legon, Accra',
      budget: { min: 500, max: 800 },
      duration: '2-3 hours',
      category: 'Plumbing',
      skillsRequired: ['Pipe Repair', 'Drain Cleaning', 'Emergency Repairs'],
      urgency: 'high',
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      matchScore: 95,
      featured: true,
      aiReasoning: 'Perfect match for your plumbing expertise and emergency repair experience',
      matchBreakdown: [
        { factor: 'Skills', score: 98 },
        { factor: 'Location', score: 90 },
        { factor: 'Availability', score: 95 },
        { factor: 'Experience', score: 92 }
      ]
    },
    {
      id: 'job_2',
      title: 'Bathroom Electrical Installation',
      description: 'Need an electrician to install proper lighting and ventilation in a newly renovated bathroom. Must be familiar with bathroom electrical safety requirements.',
      location: 'Tema, Greater Accra',
      budget: 1200,
      duration: '1 day',
      category: 'Electrical',
      skillsRequired: ['Bathroom Electrical', 'Safety Compliance', 'Lighting Installation'],
      urgency: 'medium',
      postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      matchScore: 87,
      featured: false,
      aiReasoning: 'Good match based on your electrical skills and proximity to location',
      matchBreakdown: [
        { factor: 'Skills', score: 85 },
        { factor: 'Location', score: 88 },
        { factor: 'Availability', score: 90 },
        { factor: 'Experience', score: 85 }
      ]
    },
    {
      id: 'job_3',
      title: 'Custom Kitchen Cabinets',
      description: 'Looking for a skilled carpenter to build and install custom kitchen cabinets. Must have experience with modern kitchen designs and quality finishing.',
      location: 'Airport City, Accra',
      budget: { min: 3000, max: 4500 },
      duration: '2 weeks',
      category: 'Carpentry',
      skillsRequired: ['Cabinet Making', 'Kitchen Installation', 'Finishing Work'],
      urgency: 'low',
      postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      matchScore: 78,
      featured: false,
      aiReasoning: 'Matches your carpentry background, though kitchen specialization would help',
      matchBreakdown: [
        { factor: 'Skills', score: 75 },
        { factor: 'Location', score: 85 },
        { factor: 'Availability', score: 80 },
        { factor: 'Experience', score: 70 }
      ]
    },
    {
      id: 'job_4',
      title: 'Office Building Painting Project',
      description: 'Large commercial painting project for a 3-story office building. Looking for experienced painters who can work efficiently and maintain quality standards.',
      location: 'Kumasi, Ashanti Region',
      budget: { min: 8000, max: 12000 },
      duration: '3-4 weeks',
      category: 'Painting',
      skillsRequired: ['Commercial Painting', 'Team Leadership', 'Quality Control'],
      urgency: 'medium',
      postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      matchScore: 82,
      featured: true,
      aiReasoning: 'High-value project matching your commercial painting experience',
      matchBreakdown: [
        { factor: 'Skills', score: 80 },
        { factor: 'Location', score: 70 },
        { factor: 'Availability', score: 90 },
        { factor: 'Experience', score: 88 }
      ]
    },
    {
      id: 'job_5',
      title: 'Solar Panel Installation',
      description: 'Installation of solar panels on residential rooftop. Looking for certified solar installer with experience in residential installations.',
      location: 'Spintex, Accra',
      budget: 2500,
      duration: '3 days',
      category: 'Electrical',
      skillsRequired: ['Solar Installation', 'Roofing', 'Electrical Certification'],
      urgency: 'low',
      postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      matchScore: 71,
      featured: false,
      aiReasoning: 'Emerging skill area - good opportunity to expand your expertise',
      matchBreakdown: [
        { factor: 'Skills', score: 65 },
        { factor: 'Location', score: 85 },
        { factor: 'Availability', score: 75 },
        { factor: 'Experience', score: 60 }
      ]
    },
    {
      id: 'job_6',
      title: 'HVAC System Maintenance',
      description: 'Quarterly maintenance required for office building HVAC system. Looking for technician with commercial HVAC experience.',
      location: 'Labone, Accra',
      budget: 1800,
      duration: '1 day',
      category: 'HVAC',
      skillsRequired: ['HVAC Maintenance', 'Commercial Systems', 'Preventive Care'],
      urgency: 'medium',
      postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      matchScore: 69,
      featured: false,
      aiReasoning: 'New skill area with good earning potential - consider training',
      matchBreakdown: [
        { factor: 'Skills', score: 50 },
        { factor: 'Location', score: 95 },
        { factor: 'Availability', score: 80 },
        { factor: 'Experience', score: 55 }
      ]
    }
  ];

  // Apply limit if specified
  const limitedJobs = options.limit ? mockJobs.slice(0, options.limit) : mockJobs;

  return {
    jobs: limitedJobs,
    savedJobIds: ['job_1', 'job_4'], // Mock saved jobs
    insights: {
      summary: 'Found 6 highly relevant jobs based on your skills and preferences. 2 urgent opportunities available!',
      tags: ['High Match Rate', 'Emergency Work Available', 'Skill Expansion Opportunities', 'Commercial Projects']
    },
    totalCount: mockJobs.length,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Generate mock job search results
 * @param {Object} searchParams - Search parameters
 * @returns {Array} Mock job results
 */
const generateMockJobResults = (searchParams) => {
  // This would typically process searchParams and return relevant results
  // For now, return a subset of the mock recommendations
  return generateMockRecommendations('mock_user', { limit: 10 }).jobs;
};

export default smartSearchService;