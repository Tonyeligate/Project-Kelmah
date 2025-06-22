import axiosInstance from '../../common/services/axios';

const applicationsApi = {
  /**
   * Fetch applications for the current authenticated worker
   * @returns {Promise<Array>} Array of application objects
   */
  getMyApplications: async () => {
    try {
      const response = await axiosInstance.get('/api/applications');
      // Assuming API responds with { success, data: [...] }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }
};

export default applicationsApi; 