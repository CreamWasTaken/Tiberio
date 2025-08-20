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


