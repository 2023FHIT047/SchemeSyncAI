import axiosClient from './axiosClient';

export const adminApi = {
  createScheme: async (schemeData) => {
    const res = await axiosClient.post('/schemes/admin/create/', schemeData);
    return res.data;
  },

  getSchemes: async () => {
    const res = await axiosClient.get('/schemes/admin/list/');
    return res.data;
  },

  getNotifications: async () => {
    const res = await axiosClient.get('/schemes/admin/notifications/');
    return res.data;
  },
};
