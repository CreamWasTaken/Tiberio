import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Store active requests for cancellation
const activeRequests = new Map();

export const getCategories = async (signal = null) => {
  try {
    // Cancel any existing request for categories
    if (activeRequests.has('getCategories')) {
      activeRequests.get('getCategories').abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    activeRequests.set('getCategories', abortController);

    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/categories/get-category`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: signal || abortController.signal
    });

    // Remove from active requests on success
    activeRequests.delete('getCategories');
    return response.data.categories;
  } catch (error) {
    // Remove from active requests on error
    activeRequests.delete('getCategories');
    
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

export const addCategory = async (categoryData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/categories/add-category`, categoryData, {
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

export const updateCategory = async (id, categoryData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL}/api/categories/update-category/${id}`, categoryData, {
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

export const deleteCategory = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL}/api/categories/delete-category/${id}`, {
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
