import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getPatients = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/patients/get-patients`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch patients');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

export const addPatient = async (patientData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/patients/add-patient`, patientData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to add patient');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

export const getPatientCheckups = async (patientId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/patients/patients/${patientId}/checkups`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch checkups');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

export const addCheckup = async (patientId, payload) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/patients/patients/${patientId}/checkups`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to add checkup');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

export const getTotalCheckupsCount = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/patients/checkups/count`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data?.count ?? 0;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch total checkups count');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};


