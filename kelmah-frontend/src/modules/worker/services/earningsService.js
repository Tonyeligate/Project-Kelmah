import { api } from '../../../services/apiClient';

// Route through /users/workers to match API gateway proxy
const API_URL = '/users/workers';

/**
 * Service for fetching worker earnings data.
 * Backend exposes a single endpoint returning totals + monthly breakdown.
 */
const earningsService = {
  /**
   * Get earnings data for a worker
   * @param {string} workerId - Worker ID
   * @returns {Promise<Object>} - { success, data: { totals, breakdown, source } }
   */
  getEarnings: async (workerId) => {
    const response = await api.get(`${API_URL}/${workerId}/earnings`);
    return response.data;
  },
};

export default earningsService;
