import api from './api.js';

const reportService = {
  getReports: async () => {
    const response = await api.get('/reports');
    return response.data;
  },
  
  generateReport: async (type, filters) => {
    const response = await api.post('/reports/generate', { type, filters });
    return response.data;
  },

  downloadReport: (reportId, format) => {
    // This triggers a browser download by hitting the endpoint directly, bypassing axios parsing.
    const token = localStorage.getItem('access_token');
    const url = `${api.defaults.baseURL}/reports/${reportId}/download?format=${format}`;
    
    // Create a temporary hidden anchor to trigger download (pass token in URL if needed, 
    // or use a fetch request that creates a Blob URL)
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Download failed');
      const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `report.${format === 'excel' ? 'xlsx' : format}`;
      return res.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    });
  }
};

export default reportService;
