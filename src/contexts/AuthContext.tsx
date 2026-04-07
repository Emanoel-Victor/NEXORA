import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage, User } from "../lib/storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const savedUser = storage.getUser();
      setUser(savedUser);
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (user: User) => {
    await storage.setUser(user);
    setUser(user);
  };

  const logout = async () => {
    await storage.setUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
