import axiosClient from './axiosClient';

export const ocrApi = {
  scanDocument: async (file, documentType = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) {
      formData.append('document_type', documentType);
    }
    const response = await axiosClient.post('/documents/scan/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },
};
