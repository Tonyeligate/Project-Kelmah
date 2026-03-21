/**
 * Contract Service
 * Handles contract-related API operations with proper fallbacks
 * Gateway routes contracts through /api/jobs/contracts
 */

import { api } from '../../../services/apiClient';
import { unwrapApiData } from '../../../services/responseNormalizer';
import { captureRecoverableApiError } from '../../../services/errorTelemetry';

const CONTRACTS_BASE = '/jobs/contracts';

const isValidRouteId = (value) => {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim();
  return normalized.length > 0 && normalized !== 'undefined' && normalized !== 'null';
};

const assertMilestoneRouteIds = (contractId, milestoneId) => {
  if (!isValidRouteId(contractId) || !isValidRouteId(milestoneId)) {
    throw new Error('Valid contractId and milestoneId are required');
  }
};

const unwrapPayload = (response) =>
  unwrapApiData(response, { defaultValue: {} });

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
      const response = await api.get(CONTRACTS_BASE, {
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

      const response = await api.get(`${CONTRACTS_BASE}/${id}`);
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      // If the direct fetch fails with 404, the contract doesn't exist — return null.
      // Avoid fetching ALL contracts as a fallback (performance concern at scale).
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update contract
  async updateContract(id, updateData) {
    try {
      const response = await api.put(`${CONTRACTS_BASE}/${id}`, updateData);
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      throw error;
    }
  },

  async createContract(contractData) {
    try {
      const response = await api.post(CONTRACTS_BASE, contractData);
      const payload = unwrapPayload(response);
      return normalizeContract(payload, 0);
    } catch (error) {
      throw error;
    }
  },

  async signContract(contractId, signatureData = {}) {
    try {
      const response = await api.put(`${CONTRACTS_BASE}/${contractId}`, {
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
      const response = await api.put(`${CONTRACTS_BASE}/${contractId}`, {
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
      captureRecoverableApiError(error, {
        operation: 'contracts.getContractMilestones',
        fallbackUsed: true,
        suppressUi: true,
      });
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
    assertMilestoneRouteIds(contractId, milestoneId);

    try {
      const response = await api.put(
        `${CONTRACTS_BASE}/${contractId}/milestones/${milestoneId}/approve`,
        completionData,
      );
      return unwrapPayload(response);
    } catch (error) {
      captureRecoverableApiError(error, {
        operation: 'contracts.completeMilestone',
        fallbackUsed: true,
        suppressUi: true,
      });
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
    const response = await api.put(`${CONTRACTS_BASE}/${contractId}`, {
      status: 'cancelled',
      cancellationReason: reason,
    });
    const payload = unwrapPayload(response);
    return normalizeContract(payload, 0);
  },

  async completeContract(contractId) {
    const response = await api.put(`${CONTRACTS_BASE}/${contractId}`, {
      status: 'completed',
    });
    const payload = unwrapPayload(response);
    return normalizeContract(payload, 0);
  },

  async createDispute(contractId, disputeData) {
    const response = await api.post(
      `${CONTRACTS_BASE}/${contractId}/disputes`,
      disputeData,
    );
    return unwrapPayload(response);
  },

  async getContractTemplates() {
    // Default templates for common vocational contract types in Ghana
    return [
      {
        id: 'fixed-price',
        name: 'Fixed Price Contract',
        description: 'Agree on a total price for the complete job',
        paymentType: 'fixed',
        defaultTerms: 'Payment upon satisfactory completion of all work.',
      },
      {
        id: 'milestone-based',
        name: 'Milestone-Based Contract',
        description: 'Split work into milestones with payment at each stage',
        paymentType: 'milestone',
        defaultTerms: 'Payment released per milestone after approval.',
      },
      {
        id: 'hourly-rate',
        name: 'Hourly Rate Contract',
        description: 'Pay based on hours worked at an agreed rate',
        paymentType: 'hourly',
        defaultTerms: 'Weekly timesheet submission. Payment bi-weekly.',
      },
    ];
  },

  // Approve milestone within a contract
  async approveMilestone(contractId, milestoneId) {
    assertMilestoneRouteIds(contractId, milestoneId);

    try {
      const response = await api.put(
        `${CONTRACTS_BASE}/${contractId}/milestones/${milestoneId}/approve`,
        { status: 'approved' },
      );
      return unwrapPayload(response) || { success: true };
    } catch (error) {
      captureRecoverableApiError(error, {
        operation: 'contracts.approveMilestone.direct',
        fallbackUsed: true,
        suppressUi: true,
      });
      // If dedicated approve endpoint doesn't exist, try generic milestone update
      try {
        const response = await api.put(
          `${CONTRACTS_BASE}/${contractId}`,
          {
            milestoneId,
            milestoneStatus: 'approved',
          },
        );
        return unwrapPayload(response) || { success: true };
      } catch (fallbackError) {
        captureRecoverableApiError(fallbackError, {
          operation: 'contracts.approveMilestone.fallback',
          fallbackUsed: true,
          suppressUi: true,
        });
        throw error; // throw original error
      }
    }
  },
};
