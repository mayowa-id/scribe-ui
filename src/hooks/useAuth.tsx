import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAccessToken as setApiAccessToken } from '../lib/api';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: Record<string, unknown> | null;
  token: string | null;
  login: (token: string, userData?: Record<string, unknown>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = (newToken: string, userData?: Record<string, unknown>) => {
    setToken(newToken);
    setApiAccessToken(newToken);
    if (userData) setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setApiAccessToken(null);
    setUser(null);
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  useEffect(() => {
    // Attempt silent refresh on mount to see if user is logged in
    const initAuth = async () => {
      try {
        const axiosModule = await import('axios');
        const axios = axiosModule.default;
        const rt = localStorage.getItem('refreshToken');
        if (!rt || rt === 'null' || rt === 'undefined') throw new Error('No refresh token');
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`, { refreshToken: rt });
        if (res.data.data?.accessToken) {
          if (res.data.data.refreshToken) localStorage.setItem('refreshToken', res.data.data.refreshToken);
          login(res.data.data.accessToken, res.data.data.user);
        }
      } catch (err: unknown) {
        // Not logged in
        console.debug('No valid session found during initialization', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();

    const handleTokenRefreshed = (e: CustomEvent<string>) => {
      setToken(e.detail);
      setApiAccessToken(e.detail);
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
    return () => window.removeEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
  }, []);

  // login and logout are defined above

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
