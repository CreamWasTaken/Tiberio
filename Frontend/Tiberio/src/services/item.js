import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Store active requests for cancellation
const activeRequests = new Map();

export const getItems = async (subcategoryId, signal = null) => {
  try {
    // Cancel any existing request for items
    if (activeRequests.has('getItems')) {
      activeRequests.get('getItems').abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    activeRequests.set('getItems', abortController);

    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/categories/get-items/${subcategoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: signal || abortController.signal
    });

    // Remove from active requests on success
    activeRequests.delete('getItems');
    return response.data.items;
  } catch (error) {
    // Remove from active requests on error
    activeRequests.delete('getItems');
    
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

export const addItem = async (itemData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/categories/add-item`, itemData, {
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

export const updateItem = async (id, itemData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL}/api/categories/update-item/${id}`, itemData, {
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

export const deleteItem = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL}/api/categories/delete-item/${id}`, {
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
