import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
};

// Auth response types
type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  error?: string;
};

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  error?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{success: boolean, error?: string}>;
  register: (userData: RegisterData) => Promise<{success: boolean, error?: string}>;
  logout: () => Promise<void>;
  error: string | null;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: {children: React.ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // Check if tokens exist
        const refreshToken = localStorage.getItem('refreshToken');
        const accessToken = localStorage.getItem('accessToken');
        
        if (!refreshToken || !accessToken) {
          setIsLoading(false);
          return;
        }
        
        // Try to get current user with existing token
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else if (response.status === 401 || response.status === 403) {
          // Token expired, try to refresh
          await refreshTokens();
        }
      } catch (err) {
        console.error('Auth check error:', err);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Function to refresh tokens
  const refreshTokens = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const response = await apiRequest<TokenResponse>(
        'POST',
        '/api/auth/refresh-token', 
        {
          body: JSON.stringify({ refreshToken }),
        }
      );
      
      if (response && response.accessToken && response.refreshToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        await fetchCurrentUser();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh error:', err);
      clearAuthData();
      return false;
    }
  };
  
  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return null;
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('Fetch user error:', err);
      return null;
    }
  };
  
  // Login function
  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const response = await apiRequest<AuthResponse>(
        'POST',
        '/api/auth/login',
        {
          body: JSON.stringify({ username, password }),
        }
      );
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Set user
      setUser(response.user);
      
      // Reset query cache
      queryClient.invalidateQueries();
      
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };
  
  // Register function
  const register = async (userData: RegisterData) => {
    setError(null);
    try {
      const response = await apiRequest<AuthResponse>(
        'POST',
        '/api/auth/register', 
        {
          body: JSON.stringify(userData),
        }
      );
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Set user
      setUser(response.user);
      
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiRequest<{success: boolean}>(
          'POST',
          '/api/auth/logout', 
          {
            body: JSON.stringify({ refreshToken }),
          }
        );
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthData();
      // Reset query cache
      queryClient.invalidateQueries();
    }
  };
  
  // Clear auth data
  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };
  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Must be a named function, not an arrow function, for component exports
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}