/**
 * Mock Workers API Service
 * Used as a fallback when the real API is unavailable
 */

class MockWorkersApi {
  /**
   * Get current availability status
   * @returns {Promise<Object>} Availability status
   */
  async getAvailabilityStatus() {
    return Promise.resolve({ isAvailable: true });
  }

  /**
   * Update availability settings
   * @param {Object} availabilityData - Availability data
   * @returns {Promise<Object>} Updated availability
   */
  async updateAvailability(availabilityData) {
    console.log('Mock API: Updated availability to', availabilityData);
    return Promise.resolve({ isAvailable: availabilityData.isAvailable });
  }

  /**
   * Get worker dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    return Promise.resolve({
      activeContracts: 3,
      pendingApplications: 7,
      monthlyEarnings: 2850,
      completionRate: 94,
    });
  }

  /**
   * Get notification counts for badge displays
   * @returns {Promise<Object>} Notification counts
   */
  async getNotificationCounts() {
    return Promise.resolve({
      messages: 5,
      applications: 2,
      contracts: 1,
    });
  }

  /**
   * Get worker portfolio projects
   * @returns {Promise<Array>} Portfolio projects
   */
  async getPortfolioProjects() {
    return Promise.resolve([
      {
        id: 1,
        title: 'Modern Kitchen Remodel',
        description:
          'Complete overhaul of a kitchen with custom cabinets and granite countertops.',
        imageUrl:
          'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      },
      {
        id: 2,
        title: 'Luxury Bathroom Tiling',
        description:
          'New tile installation for a spa-like bathroom, featuring a walk-in shower.',
        imageUrl:
          'https://images.pexels.com/photos/3288102/pexels-photo-3288102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      },
    ]);
  }

  /**
   * Get worker skills and licenses
   * @returns {Promise<Object>} Skills and licenses
   */
  async getSkillsAndLicenses() {
    return Promise.resolve({
      skills: [
        { name: 'Carpentry', verified: true },
        { name: 'Plumbing', verified: true },
        { name: 'Electrical', verified: false },
      ],
      licenses: [
        { name: 'Master Plumber', issuer: 'State Board', expiry: '12/2025' },
        {
          name: 'Certified Electrician',
          issuer: 'National Electrical Board',
          expiry: '06/2026',
        },
      ],
    });
  }

  /**
   * Search workers with filtering options
   * @returns {Promise<Object>} Workers search results
   */
  async searchWorkers() {
    return Promise.resolve({
      workers: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  }

  /**
   * Get worker profile by ID
   * @returns {Promise<Object>} Worker profile data
   */
  async getWorkerById() {
    return Promise.resolve({
      id: 'worker-123',
      firstName: 'Demo',
      lastName: 'Worker',
      profession: 'Professional Carpenter',
      rating: 4.5,
      profileImage: 'https://via.placeholder.com/150x150/1a1a1a/FFD700?text=Worker',
    });
  }

  /**
   * Get current worker's profile
   * @returns {Promise<Object>} Current worker profile
   */
  async getMyWorkerProfile() {
    return Promise.resolve({
      id: 'worker-123',
      firstName: 'Demo',
      lastName: 'Worker',
      profession: 'Professional Carpenter',
      rating: 4.5,
      profileImage: 'https://via.placeholder.com/150x150/1a1a1a/FFD700?text=Worker',
    });
  }
}

export default new MockWorkersApi();
