/**
 * Contract Service
 * Handles contract-related API operations with proper fallbacks
 * Gateway routes contracts through /api/jobs/contracts
 */

import { api } from '../../../services/apiClient';

const unwrapPayload = (response) =>
  response?.data?.data ?? response?.data ?? {};

const normalizeMilestone = (milestone = {}, index = 0) => ({
  id: milestone.id || milestone._id || `milestone-${index}`,
  title: milestone.title || `Milestone ${index + 1}`,
  status: milestone.status || 'pending',
  dueDate: milestone.dueDate || null,
  amount: Number(milestone.amount || 0),
});

const normalizeContract = (contract = {}, index = 0) => {
  const id = contract.id || contract._id || `contract-${index}`;
  const clientName =
    contract.clientName ||
    contract.client?.name ||
    (typeof contract.client === 'string' ? contract.client : '') ||
    contract.hirerName ||
    `${contract.hirer?.firstName || ''} ${contract.hirer?.lastName || ''}`.trim() ||
    'Client';

  const companyName =
    contract.client?.company ||
    (typeof contract.client === 'string' ? contract.client : '') ||
    'Independent';

  const value = Number(contract.value ?? contract.amount ?? contract.budget ?? 0);

  return {
    ...contract,
    id,
    title: contract.title || 'Untitled Contract',
    status: contract.status || 'pending',
    clientName,
    workerName:
      contract.workerName ||
      (typeof contract.worker === 'string' ? contract.worker : '') ||
      `${contract.worker?.firstName || ''} ${contract.worker?.lastName || ''}`.trim() ||
      'Worker',
    client: {
      name: clientName,
      company: companyName,
    },
    hirer: {
      name: clientName,
      avatar: contract.hirer?.avatar || contract.client?.avatar || '',
    },
    budget: value,
    value,
    amountPaid: Number(contract.amountPaid || 0),
    currency: contract.currency || 'GHS',
    lastUpdated: contract.updatedAt || contract.lastUpdated || contract.startDate || Date.now(),
    milestones: Array.isArray(contract.milestones)
      ? contract.milestones.map((milestone, milestoneIndex) =>
        normalizeMilestone(milestone, milestoneIndex),
      )
      : [],
  };
};

export const contractService = {
  // Get contracts with filters
  async getContracts(filters = {}) {
    try {
      const response = await api.get('/jobs/contracts', {
        params: filters,
      });
      const payload = unwrapPayload(response);
      const contracts = Array.isArray(payload?.contracts)
        ? payload.contracts
        : Array.isArray(payload)
          ? payload
          : [];
      return contracts.map((contract, index) =>
        normalizeContract(contract, index),
      );
    } catch (error) {
      throw error;
    }
  },

  // Get contract by ID
  async getContractById(id) {
    try {
      // Mock contracts from backend list currently use ids like "contract-1".
      // Avoid hitting detail endpoint for those non-ObjectId ids (it returns server error).
      if (typeof id === 'string' && /^contract-\d+$/i.test(id)) {
        const all = await this.getContracts();
        const contracts = Array.isArray(all) ? all : [];
        return contracts.find((c) => c._id === id || c.id === id) || null;
      }

      const response = await api.get(`/jobs/contracts/${id}`);
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      // Fallback: fetch all contracts and find by ID
      try {
        const all = await this.getContracts();
        const contracts = Array.isArray(all) ? all : [];
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
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      throw error;
    }
  },

  async createContract(contractData) {
    try {
      const response = await api.post('/jobs/contracts', contractData);
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      throw error;
    }
  },

  async signContract(contractId, signatureData = {}) {
    try {
      const response = await api.put(`/jobs/contracts/${contractId}`, {
        ...signatureData,
        status: 'active',
      });
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      throw error;
    }
  },

  async sendContractForSignature(contractId) {
    try {
      const response = await api.put(`/jobs/contracts/${contractId}`, {
        status: 'pending',
      });
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      throw error;
    }
  },

  async getContractMilestones(contractId) {
    try {
      const contract = await this.getContractById(contractId);
      return Array.isArray(contract?.milestones) ? contract.milestones : [];
    } catch (error) {
      return [];
    }
  },

  async createMilestone(contractId, milestoneData) {
    const contract = await this.getContractById(contractId);
    if (!contract) throw new Error('Contract not found');

    const milestones = Array.isArray(contract.milestones)
      ? [...contract.milestones]
      : [];
    milestones.push({
      id: `milestone-${Date.now()}`,
      status: 'pending',
      ...milestoneData,
    });

    const updated = await this.updateContract(contractId, { milestones });
    return milestones[milestones.length - 1] || updated?.milestones?.at(-1);
  },

  async completeMilestone(contractId, milestoneId, completionData = {}) {
    try {
      const response = await api.put(
        `/jobs/contracts/${contractId}/milestones/${milestoneId}/approve`,
        completionData,
      );
      return unwrapPayload(response);
    } catch (error) {
      const contract = await this.getContractById(contractId);
      if (!contract) throw error;

      const milestones = Array.isArray(contract.milestones)
        ? contract.milestones.map((milestone) =>
          String(milestone.id) === String(milestoneId)
            ? { ...milestone, status: 'completed', ...completionData }
            : milestone,
        )
        : [];

      await this.updateContract(contractId, { milestones });
      return milestones.find(
        (milestone) => String(milestone.id) === String(milestoneId),
      );
    }
  },

  async cancelContract(contractId, reason) {
    const response = await api.put(`/jobs/contracts/${contractId}`, {
      status: 'cancelled',
      cancellationReason: reason,
    });
    const payload = unwrapPayload(response);
    return normalizeContract(payload, 0);
  },

  async createDispute(contractId, disputeData) {
    const response = await api.post(
      `/jobs/contracts/${contractId}/disputes`,
      disputeData,
    );
    return unwrapPayload(response);
  },

  async getContractTemplates() {
    return [];
  },

  // Approve milestone within a contract
  async approveMilestone(contractId, milestoneId) {
    try {
      const response = await api.put(
        `/jobs/contracts/${contractId}/milestones/${milestoneId}/approve`,
        { status: 'approved' },
      );
      return unwrapPayload(response) || { success: true };
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
        return unwrapPayload(response) || { success: true };
      } catch {
        throw error; // throw original error
      }
    }
  },
};
