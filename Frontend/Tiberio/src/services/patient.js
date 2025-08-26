import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getPatients = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/patients/get-patients`);
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
    const response = await axios.post(`${API_URL}/api/patients/add-patient`, patientData);
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


