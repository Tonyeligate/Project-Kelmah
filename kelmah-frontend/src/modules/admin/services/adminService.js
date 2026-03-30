import { api } from '../../../services/apiClient';

export const adminService = {
  async listPayouts(params = {}) {
    const response = await api.get('/payments/admin/payouts', { params });
    return response.data;
  },

  async enqueuePayout(data) {
    const response = await api.post('/payments/admin/payouts/queue', data);
    return response.data;
  },

  async processPayoutBatch(limit = 10) {
    const response = await api.post('/payments/admin/payouts/process', {
      limit,
    });
    return response.data;
  },

  async getSystemStats() {
    const response = await api.get('/users/analytics/platform');
    const stats = response.data?.data || response.data || {};

    return {
      totalUsers: stats.totalUsers ?? 0,
      activeUsers: stats.activeUsers ?? 0,
      newUsersThisMonth: stats.newUsers ?? 0,
      totalWorkers: stats.totalWorkers ?? 0,
      systemHealth: stats.systemHealth ?? 'unknown',
    };
  },
};

export default adminService;
