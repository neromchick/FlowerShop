import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode, UserProfile, AuthResponse } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  updateProfile: (data: { fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(() => {
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
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const setAuthData = useCallback((data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const profile: UserProfile = data.user
      ? data.user
      : {
          id: (data as unknown as { userId: string }).userId,
          fullName: (data as unknown as { fullName: string }).fullName,
          email: (data as unknown as { email: string }).email,
          phone: (data as unknown as { phone?: string }).phone,
          role: (data as unknown as { role: string }).role,
        };
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login({ email, password });
      setAuthData(data);
    },
    [setAuthData]
  );

  const register = useCallback(
    async (data: { fullName: string; email: string; password: string; phone?: string }) => {
      const { data: response } = await authApi.register(data);
      setAuthData(response);
    },
    [setAuthData]
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      const { data } = await authApi.googleLogin(idToken);
      setAuthData(data);
    },
    [setAuthData]
  );

  const updateProfile = useCallback(async (data: { fullName: string; phone?: string }) => {
    const { data: updated } = await authApi.updateProfile(data);
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const { data } = await authApi.getProfile();
        localStorage.setItem('user', JSON.stringify(data));
        setUser((prev) => {
          if (!prev) return data;
          if (
            prev.id === data.id &&
            prev.email === data.email &&
            prev.fullName === data.fullName &&
            prev.phone === data.phone &&
            prev.role === data.role
          ) {
            return prev;
          }
          return data;
        });
      } catch {
        logout();
      }
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, updateProfile, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
