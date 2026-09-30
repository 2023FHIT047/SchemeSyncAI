import axiosClient from './axiosClient';

export const schemeApi = {
  getSchemes: async (params = {}) => {
    const res = await axiosClient.get('/schemes/', { params });
    return res.data;
  },

  getSchemeDetail: async (schemeId) => {
    const res = await axiosClient.get(`/schemes/${schemeId}/`);
    return res.data;
  },

  getSavedSchemes: async () => {
    const res = await axiosClient.get('/schemes/saved/');
    return res.data;
  },

  toggleSaveScheme: async (schemeId) => {
    const res = await axiosClient.post(`/schemes/${schemeId}/save/`);
    return res.data;
  },

  compareSchemes: async (schemeIdsArray) => {
    const ids = schemeIdsArray.join(',');
    const res = await axiosClient.get(`/schemes/compare/?ids=${ids}`);
    return res.data;
  }
};
