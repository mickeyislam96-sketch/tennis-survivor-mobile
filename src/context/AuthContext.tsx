import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, setStoredUser, clearStoredUser, StoredUser } from '../utils/storage';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: StoredUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredUser();
        if (stored) {
          // Verify user still exists on backend
          const verified = await authApi.getMe();
          const u = { id: verified.id, email: verified.email, displayName: verified.displayName };
          await setStoredUser(u);
          setUser(u);
        }
      } catch {
        // Stored user is invalid — clear
        await clearStoredUser();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const u = { id: res.id, email: res.email, displayName: res.displayName };
    await setStoredUser(u);
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, displayName: string, password: string) => {
    const res = await authApi.register(email, displayName, password);
    const u = { id: res.id, email: res.email, displayName: res.displayName };
    await setStoredUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clearStoredUser();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const verified = await authApi.getMe();
      const u = { id: verified.id, email: verified.email, displayName: verified.displayName };
      await setStoredUser(u);
      setUser(u);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
