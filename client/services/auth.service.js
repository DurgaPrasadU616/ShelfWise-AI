import api from './api';

const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success && response.data?.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
    }
  },

  async me() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
