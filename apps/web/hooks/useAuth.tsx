"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { UserPrivateDTO } from "@peerconnect/types";
import type { LoginInput, RegisterInput } from "@peerconnect/validation";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface AuthContextValue {
  user: UserPrivateDTO | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserPrivateDTO) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPrivateDTO | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const router = useRouter();

  // Restores authentication state after a full page refresh by asking
  // the API who the current access/refresh-token cookies belong to.
  // The API client itself will transparently attempt a refresh if the
  // access token has already expired.
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(({ user }) => {
        if (!cancelled) {
          setUser(user);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { user } = await authApi.login(input);
    setUser(user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user } = await authApi.register(input);
    setUser(user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Even if the network call fails, drop local auth state so the
      // user isn't stuck looking logged-in.
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
