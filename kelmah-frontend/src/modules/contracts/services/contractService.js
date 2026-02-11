/**
 * Contract Service
 * Handles contract-related API operations with proper fallbacks
 * Gateway routes contracts through /api/jobs/contracts
 */

import { api } from '../../../services/apiClient';

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

  // Get contract by ID
  async getContractById(id) {
    try {
      const response = await api.get(`/jobs/contracts/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      // Fallback: fetch all contracts and find by ID
      try {
        const all = await this.getContracts();
        const contracts = all?.contracts || (Array.isArray(all) ? all : []);
        return contracts.find(
          (c) => c._id === id || c.id === id,
        ) || null;
      } catch {
        return null;
      }
    }
  },

  // Update contract
  async updateContract(id, updateData) {
    try {
      const response = await api.put(`/jobs/contracts/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Approve milestone within a contract
  async approveMilestone(contractId, milestoneId) {
    try {
      const response = await api.put(
        `/jobs/contracts/${contractId}/milestones/${milestoneId}/approve`,
        { status: 'approved' },
      );
      return response.data?.data || response.data || { success: true };
    } catch (error) {
      // If dedicated approve endpoint doesn't exist, try generic milestone update
      try {
        const response = await api.put(
          `/jobs/contracts/${contractId}`,
          {
            milestoneId,
            milestoneStatus: 'approved',
          },
        );
        return response.data?.data || response.data || { success: true };
      } catch {
        throw error; // throw original error
      }
    }
  },
};
