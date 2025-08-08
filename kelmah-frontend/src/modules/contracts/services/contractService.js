/**
 * Contract Service
 * Handles contract-related API operations with proper fallbacks
 */

import { jobServiceClient } from '../../common/services/axios';
import { getServiceStatusMessage } from '../../../utils/serviceHealthCheck';

export const contractService = {
  // Get contracts with filters
  async getContracts(filters = {}) {
    try {
      const response = await jobServiceClient.get('/api/jobs/contracts', {
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
      const response = await authServiceClient.put(
        `/api/contracts/${id}`,
        updateData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
