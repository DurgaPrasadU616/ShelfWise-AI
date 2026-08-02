import api from './api.js';

const inventoryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  adjust: async (id, delta, reason) => {
    const response = await api.post(`/inventory/${id}/adjust`, { delta, reason });
    return response.data;
  },
};

export default inventoryService;
