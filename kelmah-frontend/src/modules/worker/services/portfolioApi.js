import { api } from '../../../services/apiClient';

const portfolioService = {
  async getMyPortfolio(params = {}) {
    // Changed from '/api/profile/...' to '/profile/...' to avoid /api duplication
    // baseURL='/api' is provided by axios instance on Vercel
    const { data } = await api.get('/profile/portfolio/search', {
      params,
    });
    return data?.data || data;
  },
  async getWorkerPortfolio(workerId, params = {}) {
    const { data } = await api.get(`/profile/workers/${workerId}/portfolio`, {
      params,
    });
    return data?.data || data;
  },
  async getPortfolioItem(id) {
    const { data } = await api.get(`/profile/portfolio/${id}`);
    return data?.data || data;
  },
  async uploadWorkSamples(files = []) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await api.post('/profile/portfolio/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },
  async uploadCertificates(files = []) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await api.post('/profile/certificates/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },
};

export default portfolioService;
// Legacy export for backward compatibility during migration
export const portfolioApi = portfolioService;
