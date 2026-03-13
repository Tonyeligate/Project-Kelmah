import { api } from '../../../services/apiClient';

const homeService = {
  async getPlatformStats(options = {}) {
    const response = await api.get('/jobs/stats', {
      signal: options.signal,
    });

    return response?.data?.data || response?.data || null;
  },

  async getWorkerTradeStats(options = {}) {
    const response = await api.get('/users/workers/stats/trades', {
      signal: options.signal,
    });

    return response?.data?.data || response?.data || null;
  },
};

export default homeService;
