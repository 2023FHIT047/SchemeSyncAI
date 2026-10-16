import axiosClient from './axiosClient';

export const documentsApi = {
  getMyDocuments: async () => {
    const response = await axiosClient.get('/documents/mine/');
    return response.data;
  },

  deleteDocument: async (id) => {
    await axiosClient.delete(`/documents/mine/${id}/`);
  },

  getDocumentFile: async (id) => {
    const response = await axiosClient.get(`/documents/mine/${id}/file/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getSchemeReadiness: async (schemeId) => {
    const response = await axiosClient.get(`/documents/readiness/${schemeId}/`);
    return response.data;
  },
};
