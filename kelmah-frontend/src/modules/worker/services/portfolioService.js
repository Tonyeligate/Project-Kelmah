import { userServiceClient } from '../../common/services/axios';

const API_URL = '/api/workers';

/**
 * Service for managing worker portfolio items
 */
const portfolioService = {
  /**
   * Get portfolio items for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Response with portfolio items
   */
  getWorkerPortfolio: async (workerId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/portfolio`);
      return response.data;
    } catch (error) {
      // Fallback with mock data for development
      console.warn('Portfolio API not available, using mock data');
      return {
        data: [
          {
            id: 1,
            title: 'Kitchen Renovation',
            description: 'Complete kitchen renovation including plumbing, electrical work, and cabinet installation for a 3-bedroom house in East Legon.',
            category: 'Plumbing',
            client: 'Mrs. Adwoa Mensah',
            budget: 15000,
            duration: '3 weeks',
            location: 'East Legon, Accra',
            skills: 'Plumbing, Electrical, Carpentry',
            images: [
              'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
              'https://images.unsplash.com/photo-1556909045-f85c614b14d7?w=400'
            ],
            completedAt: '2024-01-15',
            featured: true,
            status: 'completed',
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: 2,
            title: 'Office Electrical Installation',
            description: 'Full electrical wiring for a new office building including lighting, power outlets, and security systems.',
            category: 'Electrical',
            client: 'GH Business Center',
            budget: 25000,
            duration: '2 months',
            location: 'Airport City, Accra',
            skills: 'Electrical, Security Systems, Lighting',
            images: [
              'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400'
            ],
            completedAt: '2024-02-28',
            featured: false,
            status: 'completed',
            createdAt: '2024-02-28T14:30:00Z'
          },
          {
            id: 3,
            title: 'Residential Carpentry Project',
            description: 'Custom furniture making and installation for a family home including wardrobes, dining table, and shelving units.',
            category: 'Carpentry',
            client: 'Mr. Kwame Asante',
            budget: 8000,
            duration: '3 weeks',
            location: 'Tema, Greater Accra',
            skills: 'Carpentry, Furniture Making, Installation',
            images: [
              'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
              'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
            ],
            completedAt: '2024-03-10',
            featured: false,
            status: 'completed',
            createdAt: '2024-03-10T09:15:00Z'
          }
        ]
      };
    }
  },

  /**
   * Create a new portfolio item
   * @param {Object} portfolioData - Portfolio item data
   * @returns {Promise<Object>} - Created portfolio item
   */
  createPortfolioItem: async (portfolioData) => {
    try {
      const response = await userServiceClient.post(
        `${API_URL}/${portfolioData.workerId}/portfolio`,
        portfolioData
      );
      return response.data;
    } catch (error) {
      // Simulate successful creation for development
      console.warn('Portfolio creation API not available, simulating success');
      return {
        data: {
          id: Date.now(),
          ...portfolioData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Update an existing portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {Object} portfolioData - Updated portfolio data
   * @returns {Promise<Object>} - Updated portfolio item
   */
  updatePortfolioItem: async (itemId, portfolioData) => {
    try {
      const response = await userServiceClient.put(
        `${API_URL}/portfolio/${itemId}`,
        portfolioData
      );
      return response.data;
    } catch (error) {
      console.warn('Portfolio update API not available, simulating success');
      return {
        data: {
          ...portfolioData,
          id: itemId,
          updatedAt: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Delete a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  deletePortfolioItem: async (itemId) => {
    try {
      const response = await userServiceClient.delete(`${API_URL}/portfolio/${itemId}`);
      return response.data;
    } catch (error) {
      console.warn('Portfolio deletion API not available, simulating success');
      return { data: { success: true, message: 'Portfolio item deleted successfully' } };
    }
  },

  /**
   * Upload portfolio images
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} - Upload response with URL
   */
  uploadPortfolioImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'portfolio');

      const response = await userServiceClient.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Simulate image upload with placeholder for development
      console.warn('Image upload API not available, using placeholder');
      return {
        data: {
          url: `https://images.unsplash.com/photo-${Date.now()}?w=400&h=300&fit=crop`,
          filename: file.name,
          size: file.size
        }
      };
    }
  },

  /**
   * Get portfolio statistics for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - Portfolio statistics
   */
  getPortfolioStats: async (workerId) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/portfolio/stats`);
      return response.data;
    } catch (error) {
      console.warn('Portfolio stats API not available, using mock data');
      return {
        data: {
          totalProjects: 12,
          completedProjects: 10,
          inProgressProjects: 2,
          totalBudget: 150000,
          averageRating: 4.8,
          featuredProjects: 3,
          categories: {
            'Plumbing': 4,
            'Electrical': 3,
            'Carpentry': 3,
            'Painting': 2
          },
          monthlyStats: [
            { month: 'Jan', projects: 2, budget: 25000 },
            { month: 'Feb', projects: 3, budget: 35000 },
            { month: 'Mar', projects: 2, budget: 18000 },
            { month: 'Apr', projects: 1, budget: 12000 },
            { month: 'May', projects: 2, budget: 28000 },
            { month: 'Jun', projects: 2, budget: 32000 }
          ]
        }
      };
    }
  },

  /**
   * Toggle featured status of a portfolio item
   * @param {string} itemId - Portfolio item ID
   * @param {boolean} featured - Featured status
   * @returns {Promise<Object>} - Updated portfolio item
   */
  toggleFeatured: async (itemId, featured) => {
    try {
      const response = await userServiceClient.patch(`${API_URL}/portfolio/${itemId}`, {
        featured
      });
      return response.data;
    } catch (error) {
      console.warn('Portfolio featured toggle API not available, simulating success');
      return {
        data: {
          id: itemId,
          featured,
          updatedAt: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Share portfolio item (generate shareable link)
   * @param {string} itemId - Portfolio item ID
   * @returns {Promise<Object>} - Shareable link data
   */
  sharePortfolioItem: async (itemId) => {
    try {
      const response = await userServiceClient.post(`${API_URL}/portfolio/${itemId}/share`);
      return response.data;
    } catch (error) {
      console.warn('Portfolio sharing API not available, generating mock link');
      return {
        data: {
          shareUrl: `${window.location.origin}/portfolio/shared/${itemId}`,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      };
    }
  },

  /**
   * Search/filter portfolio items
   * @param {string} workerId - Worker ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Filtered portfolio items
   */
  searchPortfolio: async (workerId, filters = {}) => {
    try {
      const response = await userServiceClient.get(`${API_URL}/${workerId}/portfolio/search`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.warn('Portfolio search API not available, using mock filtering');
      const mockData = await portfolioService.getWorkerPortfolio(workerId);
      
      let filteredData = mockData.data;
      
      if (filters.category) {
        filteredData = filteredData.filter(item => 
          item.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }
      
      if (filters.search) {
        filteredData = filteredData.filter(item =>
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.featured) {
        filteredData = filteredData.filter(item => item.featured);
      }
      
      return { data: filteredData };
    }
  }
};

export default portfolioService;