import React, { createContext, useEffect, useState } from 'react';
import { apiClient, type ProfileDto } from '@/lib/api-client';

export interface AuthContextType {
  user: ProfileDto | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await apiClient.getCurrentUser();
        if (response.data) {
          setUser(response.data);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });

    if (response.data) {
      // After successful login, get user profile
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.data) {
        setUser(userResponse.data);
      }
      return {};
    } else {
      return { error: response.error || 'Login failed' };
    }
  };

  const register = async (email: string, password: string) => {
    const response = await apiClient.register({ email, password });

    if (response.data) {
      // After successful registration, get user profile
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.data) {
        setUser(userResponse.data);
      }
      return {};
    } else {
      return { error: response.error || 'Registration failed' };
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
