import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, LoginResponse } from "@vetlog/shared";
import { apiRequest, setAccessToken, setUnauthenticatedHandler } from "../lib/api-client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(clearSession);
    return () => setUnauthenticatedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const refreshResponse = await apiRequest<{ accessToken: string }>("/auth/refresh", {
          method: "POST",
        });
        setAccessToken(refreshResponse.accessToken);
        const me = await apiRequest<AuthUser>("/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(response.accessToken);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
