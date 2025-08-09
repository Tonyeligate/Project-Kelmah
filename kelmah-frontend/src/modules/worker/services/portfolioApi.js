import axios from '../../common/services/axios';

export const portfolioApi = {
  async getMyPortfolio(params = {}) {
    const { data } = await axios.get('/api/profile/portfolio/search', { params });
    return data?.data || data;
  },
  async getWorkerPortfolio(workerId, params = {}) {
    const { data } = await axios.get(`/api/profile/workers/${workerId}/portfolio`, { params });
    return data?.data || data;
  },
  async getPortfolioItem(id) {
    const { data } = await axios.get(`/api/profile/portfolio/${id}`);
    return data?.data || data;
  },
  async uploadWorkSamples(files = []) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await axios.post('/api/profile/portfolio/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },
  async uploadCertificates(files = []) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await axios.post('/api/profile/certificates/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data || data;
  },
};

export default portfolioApi;


