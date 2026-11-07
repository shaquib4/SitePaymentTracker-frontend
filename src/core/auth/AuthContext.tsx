import React, { createContext, useContext, useState } from 'react';
import { LoginResponse, UserRole } from '../types';
import { apiClient } from '../api/client';

interface AuthState {
  token: string | null;
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
  } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isSupervisor: boolean;
  isVendor: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ke_auth_token'));
  const [user, setUser] = useState<AuthState['user']>(() => {
    const saved = localStorage.getItem('ke_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    const data = res.data;

    const userData = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      tenantId: data.tenantId,
      tenantName: data.tenantName,
    };

    localStorage.setItem('ke_auth_token', data.token);
    localStorage.setItem('ke_auth_user', JSON.stringify(userData));

    setToken(data.token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ke_auth_token');
    localStorage.removeItem('ke_auth_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'Admin';
  const isAccountant = user?.role === 'Accountant';
  const isSupervisor = user?.role === 'Supervisor';
  const isVendor = user?.role === 'Vendor';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isAccountant,
        isSupervisor,
        isVendor,
        login,
        logout,
      }}
    >
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
