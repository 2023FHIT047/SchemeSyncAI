import axiosClient from './axiosClient';

export const eligibilityApi = {
  evaluateScheme: async (schemeId, customProfileData = null) => {
    const payload = customProfileData ? { profile: customProfileData } : {};
    const res = await axiosClient.post(`/eligibility/evaluate/${schemeId}/`, payload);
    return res.data;
  },

  evaluateAllSchemes: async () => {
    const res = await axiosClient.get('/eligibility/evaluate-all/');
    return res.data;
  },

  downloadCertificate: async (schemeId) => {
    const res = await axiosClient.post(`/eligibility/certificate/${schemeId}/download/`, {}, {
      responseType: 'blob'
    });
    return res;
  },

  verifyCertificate: async (verificationId) => {
    const res = await axiosClient.get(`/eligibility/certificate/verify/${verificationId}/`);
    return res.data;
  }
};
