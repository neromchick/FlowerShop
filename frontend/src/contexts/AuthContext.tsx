import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode, UserProfile, AuthResponse } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (accessToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const setAuthData = (data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const profile: UserProfile = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setAuthData(data);
  };

  const register = async (data: { fullName: string; email: string; password: string; phone?: string }) => {
    const { data: response } = await authApi.register(data);
    setAuthData(response);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const { data } = await authApi.getProfile();
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      } catch {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}