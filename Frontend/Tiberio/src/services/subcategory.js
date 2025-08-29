import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Store active requests for cancellation
const activeRequests = new Map();

export const getSubcategories = async (categoryId, signal = null) => {
  try {
    // Cancel any existing request for subcategories
    if (activeRequests.has('getSubcategories')) {
      activeRequests.get('getSubcategories').abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    activeRequests.set('getSubcategories', abortController);

    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/categories/get-subcategories/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: signal || abortController.signal
    });

    // Remove from active requests on success
    activeRequests.delete('getSubcategories');
    return response.data.subcategories;
  } catch (error) {
    // Remove from active requests on error
    activeRequests.delete('getSubcategories');
    
    if (error.name === 'AbortError') {
      throw new Error('Request cancelled');
    } else if (error.response) {
      throw new Error(error.response.data.error);
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message);
    }
  }
};

export const addSubcategory = async (subcategoryData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/categories/add-subcategory`, subcategoryData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message);
    }
  }
};

export const updateSubcategory = async (id, subcategoryData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL}/api/categories/update-subcategory/${id}`, subcategoryData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message);
    }
  }
};

export const deleteSubcategory = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL}/api/categories/delete-subcategory/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    } else if (error.request) {
      throw new Error("No response from server");
    } else {
      throw new Error(error.message);
    }
  }
};
