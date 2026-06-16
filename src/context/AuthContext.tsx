"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProfile, login as apiLogin } from "@/lib/api";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth";
import type { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const token = getAccessToken();
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        if (active) setUser(profile);
      } catch {
        clearTokens();
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiLogin(username, password);
    setTokens(response.access, response.refresh);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
