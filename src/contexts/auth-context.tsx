import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as authService from "@/services/auth.service";
import type { AuthUser } from "@/services/auth.service";

interface AuthContextValue {
  user: AuthUser | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    // Silent refresh sekali saat app mount: reload halaman tidak memaksa
    // re-login selama refresh_token cookie masih valid.
    authService
      .refresh()
      .then((refreshedUser) => setUser(refreshedUser))
      .finally(() => setIsBootstrapping(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const registeredUser = await authService.register({ name, email, password });
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refetchUser = useCallback(async () => {
    const refreshedUser = await authService.refresh();
    setUser(refreshedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isBootstrapping, login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
