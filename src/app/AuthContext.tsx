"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "./lib/types";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("hs-user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { window.localStorage.removeItem("hs-user"); }
    }
  }, []);

  const signIn = (u: User) => {
    setUser(u);
    if (typeof window !== "undefined") window.localStorage.setItem("hs-user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("hs-user");
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
