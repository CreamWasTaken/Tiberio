import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getSuppliers = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/suppliers/get-suppliers`, {
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
