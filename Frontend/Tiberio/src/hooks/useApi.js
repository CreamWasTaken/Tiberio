import { useState, useEffect, useRef, useCallback } from 'react';
import { makeApiRequest, cancelRequest } from '../services/apiUtils';

export const useApi = (requestKey, requestFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const executeRequest = useCallback(async (signal = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await makeApiRequest(requestKey, requestFn, signal);
      setData(result);
    } catch (err) {
      // Only set error if it's not a cancellation
      if (err.message !== 'Request cancelled') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [requestKey, requestFn]);

  useEffect(() => {
    // Create abort controller for this effect
    abortControllerRef.current = new AbortController();
    
    // Execute the request
    executeRequest(abortControllerRef.current.signal);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Also cancel the request in the global registry
      cancelRequest(requestKey);
    };
  }, dependencies);

  // Function to manually refetch data
  const refetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    executeRequest(abortControllerRef.current.signal);
  }, [executeRequest]);

  return { data, loading, error, refetch };
};

// Hook for multiple concurrent requests
export const useMultipleApi = (requests) => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const executeRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create abort controller
        abortControllerRef.current = new AbortController();
        
        // Execute all requests concurrently
        const promises = requests.map(({ key, fn }) => 
          makeApiRequest(key, fn, abortControllerRef.current.signal)
        );
        
        const results = await Promise.all(promises);
        
        // Combine results
        const combinedResults = {};
        requests.forEach(({ key }, index) => {
          combinedResults[key] = results[index];
        });
        
        setResults(combinedResults);
      } catch (err) {
        if (err.message !== 'Request cancelled') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    executeRequests();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel all requests
      requests.forEach(({ key }) => cancelRequest(key));
    };
  }, [requests]);

  return { results, loading, error };
};
