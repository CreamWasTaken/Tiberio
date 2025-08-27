import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Store active requests for cancellation
const activeRequests = new Map();

export const getSuppliers = async (signal = null) => {
  try {
    // Cancel any existing request for suppliers
    if (activeRequests.has('getSuppliers')) {
      activeRequests.get('getSuppliers').abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    activeRequests.set('getSuppliers', abortController);

    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/suppliers/get-suppliers`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: signal || abortController.signal
    });

    // Remove from active requests on success
    activeRequests.delete('getSuppliers');
    return response.data;
  } catch (error) {
    // Remove from active requests on error
    activeRequests.delete('getSuppliers');
    
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

export const addSupplier = async (supplierData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/suppliers/add-supplier`, supplierData, {
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

export const updateSupplier = async (id, supplierData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL}/api/suppliers/update-supplier/${id}`, supplierData, {
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

export const deleteSupplier = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL}/api/suppliers/delete-supplier/${id}`, {
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
