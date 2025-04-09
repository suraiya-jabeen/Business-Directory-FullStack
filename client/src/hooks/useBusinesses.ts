import { useCallback, useState } from 'react';
import api from '../services/api';

export const useBusinesses = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async (params = {}) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/business', { params });
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return { 
    data, 
    isLoading, 
    error, 
    fetchBusinesses 
  };
};
