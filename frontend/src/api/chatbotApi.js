import axiosClient from './axiosClient';

export const chatbotApi = {
  sendQuery: async (query) => {
    const res = await axiosClient.post('/chatbot/query/', { query });
    return res.data;
  }
};
