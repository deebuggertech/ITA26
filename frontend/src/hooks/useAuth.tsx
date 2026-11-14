import { createContext, useContext, useState, type ReactNode } from "react";
import { getStoredSession, storeSession } from "../api/client";
import * as endpoints from "../api/endpoints";
import type { Session } from "../api/types";

interface AuthValue {
  session: Session | null;
  login: (username: string, password: string) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = getStoredSession();
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username: string, password: string) => {
    const next = await endpoints.login(username, password);
    storeSession(JSON.stringify(next));
    setSession(next);
    return next;
  };
  const logout = () => {
    storeSession(null);
    setSession(null);
  };

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
