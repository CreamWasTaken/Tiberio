// API utility functions for request management
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Store active requests for deduplication and cancellation
const activeRequests = new Map();

// Add this to your apiUtils.js
const persistentRequests = new Set();

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.name === 'AbortError') {
      return Promise.reject(new Error('Request cancelled'));
    }
    return Promise.reject(error);
  }
);

// Generic API request function with deduplication
export const makeApiRequest = async (key, requestFn, signal = null, options = {}) => {
  const { persistent = false, allowDuplicates = false } = options;
  
  // Mark persistent requests
  if (persistent) {
    persistentRequests.add(key);
  }
  
  // Don't cancel persistent requests
  if (!persistent && activeRequests.has(key)) {
    activeRequests.get(key).abort();
  }
  
  // Handle duplicate requests for persistent data
  if (!allowDuplicates && activeRequests.has(key) && persistent) {
    // Wait for existing request to complete
    return new Promise((resolve, reject) => {
      const checkComplete = () => {
        if (!activeRequests.has(key)) {
          makeApiRequest(key, requestFn, signal, options).then(resolve).catch(reject);
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  }

  // Create new abort controller
  const abortController = new AbortController();
  activeRequests.set(key, abortController);

  try {
    // Use provided signal or create new one
    const finalSignal = signal || abortController.signal;
    const result = await requestFn(finalSignal);
    
    // Remove from active requests on success
    activeRequests.delete(key);
    return result;
  } catch (error) {
    // Remove from active requests on error
    activeRequests.delete(key);
    throw error;
  }
};

// Cancel only non-persistent requests
export const cancelAllRequests = () => {
  activeRequests.forEach((controller, key) => {
    if (!persistentRequests.has(key)) {
      controller.abort();
      activeRequests.delete(key);
    }
  });
};

// Cancel persistent requests specifically
export const cancelPersistentRequests = () => {
  activeRequests.forEach((controller, key) => {
    if (persistentRequests.has(key)) {
      controller.abort();
      activeRequests.delete(key);
      persistentRequests.delete(key);
    }
  });
};

// Cancel specific request
export const cancelRequest = (key) => {
  if (activeRequests.has(key)) {
    activeRequests.get(key).abort();
    activeRequests.delete(key);
  }
};

// Get request status
export const isRequestActive = (key) => {
  return activeRequests.has(key);
};
