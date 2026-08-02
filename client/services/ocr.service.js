import api from './api.js';

const ocrService = {
  uploadInvoice: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ocr/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  getUploadStatus: async (uploadId) => {
    const response = await api.get(`/ocr/${uploadId}`);
    return response.data;
  },
  
  commitOcr: async (uploadId, extractedItems) => {
    const response = await api.put(`/ocr/${uploadId}`, { extractedItems });
    return response.data;
  },
  
  rejectOcr: async (uploadId, reason) => {
    const response = await api.post(`/ocr/${uploadId}/reject`, { reason });
    return response.data;
  },
  
  retryOcr: async (uploadId) => {
    const response = await api.post(`/ocr/${uploadId}/retry`);
    return response.data;
  }
};

export default ocrService;
