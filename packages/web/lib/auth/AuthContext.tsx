'use client';

// Auth Context für ShareLocal
// Verwaltet Authentication State über die gesamte App

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@sharelocal/shared';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Beim App-Start: Token und User aus localStorage laden
  useEffect(() => {
    const storedToken = authApi.getToken();
    const storedUser = authApi.getUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { user, token } = await authApi.login({ email, password });
    authApi.setAuth(user, token);
    setUser(user);
    setToken(token);
  };

  const register = async (email: string, name: string, password: string) => {
    const { user, token } = await authApi.register({ email, name, password });
    authApi.setAuth(user, token);
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook um Auth Context zu verwenden
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

