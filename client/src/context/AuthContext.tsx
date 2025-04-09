import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  email: string;
  role: string;
  businessName?: string;
  businessId?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login'; // Using window.location instead of useNavigate
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        setUser(res.data.data);
      } catch (error) {
        logout(); // Use the centralized logout
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('auth_token', res.data.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
      setUser(res.data.data.user);
      
      return { success: true };
    } catch (error: any) {
      logout();
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};