import api from './api';

const transform = (items) =>
  items.map((u) => ({
    ...u,
    id: u.id || u._id,
    roles: Array.isArray(u.roles) ? u.roles : [u.role],
  }));

export const userService = {
  async getAll(params = {}) {
    const { data } = await api.get('/users', { params });
    return { ...data, data: { ...data.data, items: transform(data.data.items || []) } };
  },
  async getById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/users', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};

export default userService;