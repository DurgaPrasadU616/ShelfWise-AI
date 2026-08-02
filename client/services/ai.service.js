import api from './api.js';

const aiService = {
  triggerAiAnalysis: async () => {
    const response = await api.post('/ai/trigger');
    return response.data;
  },
  
  getHealthMetrics: async () => {
    const response = await api.get('/ai/health');
    return response.data;
  },
  
  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return response.data;
  },

  actionRecommendation: async (id, action) => {
    const response = await api.patch(`/ai/recommendations/${id}/action`, { action });
    return response.data;
  }
};

export default aiService;
