import axiosClient from './axiosClient';

export const authApi = {
  login: async (username, password) => {
    const res = await axiosClient.post('/auth/token/', { username, password });
    if (res.data.access) {
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await axiosClient.post('/users/register/', userData);
    return res.data;
  },

  getMe: async () => {
    const res = await axiosClient.get('/users/me/');
    return res.data;
  },

  getProfile: async () => {
    const res = await axiosClient.get('/users/profile/');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await axiosClient.patch('/users/profile/', profileData);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};
