import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import authService from '../services/authService';
import { User, LoginCredentials, RegisterCredentials, AdminRegisterCredentials, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const token = authService.getToken();
          setToken(token);
          
          const response = await authService.getProfile();
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        authService.removeToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      setUser(response.data.user);
      setToken(response.data.token);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(credentials);
      setUser(response.data.user);
      setToken(response.data.token);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async (credentials: AdminRegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.registerAdmin(credentials);
      setUser(response.data.user);
      setToken(response.data.token);
    } catch (error: any) {
      setError(error.message || 'Admin registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const updateProfile = async (profileData: Partial<User['profile']>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.updateProfile(profileData);
      setUser(response.data.user);
    } catch (error: any) {
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    registerAdmin,
    logout,
    updateProfile,
    loading,
    error
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
