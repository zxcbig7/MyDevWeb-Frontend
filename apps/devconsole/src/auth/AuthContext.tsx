import { createContext, useContext, type ReactNode } from "react";

type User = { id: string; name: string; avatar?: string };
type AuthValue = { user: User | null; logout: () => void };

const AuthCtx = createContext<AuthValue>({ user: null, logout: () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthCtx.Provider value={{ user: null, logout: () => {} }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = (): AuthValue => useContext(AuthCtx);
