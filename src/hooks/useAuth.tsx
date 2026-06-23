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
  const [user, setUser] = useState<Record<string, unknown> | null>({
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@example.com',
    name: 'Demo User',
    plan: 'PRO'
  });
  const [token, setToken] = useState<string | null>('demo-token');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = (newToken: string, userData?: Record<string, unknown>) => {
    setToken(newToken);
    setApiAccessToken(newToken);
    if (userData) setUser(userData);
  };

  const logout = () => {
    // Disabled for demo
    console.log('Logout clicked - disabled for demo mode');
  };

  useEffect(() => {
    // Automatically set API access token to bypass
    setApiAccessToken('demo-token');
  }, []);

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
