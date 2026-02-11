import { api } from '../../../services/apiClient';

/**
 * Milestone Service
 * NOTE: No standalone /api/milestones gateway route exists yet.
 * Read methods return empty defaults on error so the UI renders gracefully.
 * Write methods still throw so the caller can show proper error feedback.
 */
class MilestoneService {
  constructor() {}

  async getMilestones(contractId) {
    try {
      const response = await api.get(`/milestones/contract/${contractId}`);
      return response.data;
    } catch {
      return { milestones: [] };
    }
  }

  async getMilestone(milestoneId) {
    try {
      const response = await api.get(`/milestones/${milestoneId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async createMilestone(contractId, milestoneData) {
    const response = await api.post(
      `/milestones/contract/${contractId}`,
      milestoneData,
    );
    return response.data;
  }

  async updateMilestone(milestoneId, updateData) {
    const response = await api.put(`/milestones/${milestoneId}`, updateData);
    return response.data;
  }

  async deleteMilestone(milestoneId) {
    const response = await api.delete(`/milestones/${milestoneId}`);
    return response.data;
  }

  async startMilestone(milestoneId) {
    const response = await api.put(`/milestones/${milestoneId}`, {
      status: 'in_progress',
    });
    return response.data;
  }

  async submitMilestone(milestoneId, submissionNotes, deliverables) {
    const response = await api.put(`/milestones/${milestoneId}`, {
      status: 'submitted',
      submissionNotes,
      deliverables,
    });
    return response.data;
  }

  async approveMilestone(milestoneId, feedback = '') {
    const response = await api.put(`/milestones/${milestoneId}`, {
      status: 'approved',
      feedback,
    });
    return response.data;
  }

  async rejectMilestone(milestoneId, rejectionReason) {
    const response = await api.put(`/milestones/${milestoneId}`, {
      status: 'rejected',
      rejectionReason,
    });
    return response.data;
  }

  async markMilestonePaid(milestoneId) {
    const response = await api.patch(`/milestones/${milestoneId}/pay`);
    return response.data;
  }
}

export default new MilestoneService();
