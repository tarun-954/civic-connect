import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUserProfile, StoredUserProfile } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: StoredUserProfile | null;
  login: (userData: StoredUserProfile) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<StoredUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Check if we have a stored auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Check if we have stored user profile
      const storedProfile = await getStoredUserProfile();
      if (storedProfile && storedProfile.email) {
        setIsAuthenticated(true);
        setUser(storedProfile);
      } else {
        // Token exists but no profile, clear everything
        await AsyncStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: StoredUserProfile) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Clear all stored authentication data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('cc_user_profile');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('deptToken');
      await AsyncStorage.removeItem('departmentInfo');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
