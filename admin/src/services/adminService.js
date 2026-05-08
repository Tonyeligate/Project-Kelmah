import api from './apiClient';

const unwrap = (response) => {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

export const adminService = {
  async getSystemStats() {
    const response = await api.get('/users/analytics/platform');
    const stats = unwrap(response) || {};

    return {
      totalUsers: stats.totalUsers ?? 0,
      activeUsers: stats.activeUsers ?? 0,
      newUsersThisMonth: stats.newUsers ?? stats.newUsersThisMonth ?? 0,
      totalWorkers: stats.totalWorkers ?? 0,
      systemHealth: stats.systemHealth ?? 'unknown',
    };
  },

  async getProviderStatus() {
    const response = await api.get('/health/aggregate');
    return unwrap(response) || {};
  },

  async listPayouts(params = {}) {
    const response = await api.get('/payments/admin/payouts', { params });
    const payload = response?.data || {};
    return payload?.data || payload?.items || payload || [];
  },

  async enqueuePayout(data) {
    const response = await api.post('/payments/admin/payouts/queue', data);
    return unwrap(response) || {};
  },

  async processPayoutBatch(limit = 10) {
    const response = await api.post('/payments/admin/payouts/process', {
      limit,
    });
    return unwrap(response) || {};
  },
};

export default adminService;
