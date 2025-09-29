const API_BASE_URL = 'http://localhost:8000';

// Map frontend metal abbreviations to backend full names
const metalMapping = {
  'As': 'arsenic',
  'Pb': 'lead', 
  'Cd': 'cadmium',
  'Cr': 'chromium',
  'Hg': 'mercury',
  'Ni': 'nickel',
  'Cu': 'copper',
  'Zn': 'zinc',
  'Fe': 'iron',
  'Mn': 'manganese'
};

// Convert frontend form data to backend format
function convertFrontendToBackendFormat(frontendData) {
  const backendSample = {
    location_name: frontendData.location || 'Unknown Location',
    latitude: frontendData.lat ? parseFloat(frontendData.lat) : null,
    longitude: frontendData.lng ? parseFloat(frontendData.lng) : null,
    unit_input: "Auto-detect"
  };

  // Add all metals with proper naming conversion and handle empty values
  Object.keys(metalMapping).forEach(frontendMetal => {
    const backendMetal = metalMapping[frontendMetal];
    const value = frontendData[frontendMetal];
    
    // Handle empty strings and convert to 0.0
    if (value === '' || value === null || value === undefined) {
      backendSample[backendMetal] = 0.0;
    } else {
      // Convert to number, default to 0.0 if conversion fails
      const numValue = parseFloat(value);
      backendSample[backendMetal] = isNaN(numValue) ? 0.0 : numValue;
    }
  });

  return backendSample;
}

export const analyzeSingleSample = async (sampleData) => {
  try {
    // Transform data to match backend expectations
    const backendSample = convertFrontendToBackendFormat(sampleData);

    console.log('Sending to backend:', JSON.stringify(backendSample, null, 2));

    const response = await fetch(`${API_BASE_URL}/analyze-sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendSample),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Backend response received:', result);
    return result;
  } catch (error) {
    console.error('API Error in analyzeSingleSample:', error);
    throw new Error(`Failed to analyze sample: ${error.message}`);
  }
};

export const analyzeBatchSamples = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Batch analysis error:', error);
    throw error;
  }
};

export const getSamples = async (days = 30, location = null) => {
  try {
    const params = new URLSearchParams({ days: days.toString() });
    if (location) params.append('location', location);

    const response = await fetch(`${API_BASE_URL}/samples?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching samples:', error);
    throw error;
  }
};

export const getSampleById = async (sampleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/samples/${sampleId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Sample not found');
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sample:', error);
    throw error;
  }
};

export const getStatistics = async (days = 30) => {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics?days=${days}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

export const deleteSamples = async (deleteOption, startDate = null, endDate = null, sampleIds = null) => {
  try {
    const deleteData = {
      delete_option: deleteOption
    };

    if (startDate && endDate) {
      deleteData.start_date = startDate;
      deleteData.end_date = endDate;
    }

    if (sampleIds && sampleIds.length > 0) {
      deleteData.sample_ids = sampleIds;
    }

    const response = await fetch(`${API_BASE_URL}/delete-samples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting samples:', error);
    throw error;
  }
};

export const exportToCSV = async (days = 30) => {
  try {
    const response = await fetch(`${API_BASE_URL}/export-csv?days=${days}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

export const batchAnalyzeJSON = async (samples) => {
  try {
    // Convert frontend samples to backend format
    const backendSamples = samples.map(sample => convertFrontendToBackendFormat(sample));

    const batchRequest = {
      samples: backendSamples
    };

    const response = await fetch(`${API_BASE_URL}/batch-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in batch analysis:', error);
    throw error;
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { connected: true, message: data.message };
  } catch (error) {
    return { connected: false, message: error.message };
  }
};

// Utility function to download CSV
export const downloadCSV = (csvData, filename) => {
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default {
  analyzeSingleSample,
  analyzeBatchSamples,
  getSamples,
  getSampleById,
  getStatistics,
  deleteSamples,
  exportToCSV,
  batchAnalyzeJSON,
  testConnection,
  downloadCSV
};