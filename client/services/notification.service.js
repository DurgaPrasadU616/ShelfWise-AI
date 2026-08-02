import api from './api.js';

const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  sendTest: async ({ title, message, type, sendEmail }) => {
    const response = await api.post('/notifications/test', { title, message, type, sendEmail });
    return response.data;
  }
};

export default notificationService;
