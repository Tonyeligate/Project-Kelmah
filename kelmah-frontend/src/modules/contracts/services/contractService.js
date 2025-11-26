/**
 * Contract Service
 * Handles contract-related API operations with proper fallbacks
 */

import { api } from '../../../services/apiClient';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';

export const contractService = {
  // Get contracts with filters
  async getContracts(filters = {}) {
    try {
      const response = await api.get('/jobs/contracts', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update contract
  async updateContract(id, updateData) {
    try {
      const response = await api.put(`/contracts/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
