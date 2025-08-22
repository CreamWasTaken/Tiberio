import axios from 'axios';

console.log('Environment variables:', import.meta.env);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

const API_URL = import.meta.env.VITE_API_URL;


export const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/login`, { username, password });
     
     
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      if(response.data.name){
        localStorage.setItem('name', response.data.name);
      }
  
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      } else if (error.request) {
        throw new Error('No response from server');
      } else {
        throw new Error(error.message);
      }
    }
  };

  export const getUserLogs = async () => {
    try {
      const token = localStorage.getItem('authToken'); 
      const response = await axios.get(`${API_URL}/api/users/get-user-logs`, {
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


  export const getUser = async () => {
    try {

      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/users/get-user`, {
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

  export const getAllUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/users/get-user`, {
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

  export const changeUserStatus = async (userId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/api/users/change-user-status/${userId}`, {
        status: status
      }, {
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

  export const changePassword = async (userId, password) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/api/users/change-password/${userId}`, {
        password: password
      }, {
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

export const addUser = async (userData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/users/add-user`, userData, {
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


