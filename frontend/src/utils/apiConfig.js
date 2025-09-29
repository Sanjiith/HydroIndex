const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  ANALYZE_SAMPLE: `${API_BASE_URL}/analyze-sample`,
  UPLOAD_FILE: `${API_BASE_URL}/upload-file`,
  BATCH_ANALYZE: `${API_BASE_URL}/batch-analyze`,
  GET_SAMPLES: `${API_BASE_URL}/samples`,
  GET_STATISTICS: `${API_BASE_URL}/statistics`,
  EXPORT_CSV: `${API_BASE_URL}/export-csv`,
  DELETE_SAMPLES: `${API_BASE_URL}/delete-samples`
};

export default API_BASE_URL;