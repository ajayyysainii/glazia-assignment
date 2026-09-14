"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "./api";
import { getStoredUser } from "./storage";
import type { AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const cached = getStoredUser();
    if (cached) setUser(cached);

    authApi
      .restoreSession()
      .then((restored) => {
        if (!active) return;
        setUser(restored);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const session = await authApi.login(input);
    setUser(session.user);
  }, []);

  const signup = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const session = await authApi.register(input);
      setUser(session.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
