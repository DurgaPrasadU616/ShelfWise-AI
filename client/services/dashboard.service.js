import api from './api.js';

const dashboardService = {
  getAnalytics: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
  getCategories: async () => {
    const response = await api.get('/dashboard/categories');
    return response.data;
  },
};

export default dashboardService;