import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (!error.response) {
      const networkError = new Error('Network Error: Please check your internet connection');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;
    const errorMessage = (data as any)?.message || 'Request failed';

    switch (status) {
      case 401:
        if ((error.config as any)?._retry) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
        (error.config as any)._retry = true;
        try {
          const newToken = await refreshToken();
          localStorage.setItem('auth_token', newToken);
          if (error.config) {
            return api(error.config);
          }
          return Promise.reject(new Error('Request configuration is missing.'));
        } catch (refreshError) {
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      case 404:
        if (error.config?.url?.includes('/users/search')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error(errorMessage));
      default:
        return Promise.reject(new Error(errorMessage));
    }
  }
);

// Properly typed search function
// In your api.ts
export const searchUsers = async (query: string) => {
  try {
    const response = await api.get('/users/search', {
      params: { query }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      return [];
    }
    console.error('Search failed:', error);
    throw error;
  }
};

// Mock refresh token function - implement your actual logic
async function refreshToken(): Promise<string> {
  try {
    const response = await axios.post('/api/auth/refresh', {}, {
      withCredentials: true
    });
    return response.data.token;
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
}

export default api;