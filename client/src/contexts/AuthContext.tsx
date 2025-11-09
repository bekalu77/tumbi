import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type User } from "../../../shared/schema";

type AuthUser = User | null;

type AuthContextValue = {
  user: AuthUser;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );
  const [loading, setLoading] = useState(true);

  const refetchUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          logout();
        }
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || "Login failed");
    }
    const data = (await res.json()) as {
      token: string;
      user: { id: string; username: string };
    };
    setToken(data.token);
    localStorage.setItem("auth_token", data.token);
    await refetchUser();
  };

  const register = async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'profilePicture') {
        if (data[key][0]) {
          formData.append(key, data[key][0]);
        }
      } else {
        formData.append(key, data[key]);
      }
    });

    const res = await fetch("/api/register", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const resData = await res.json().catch(() => ({}));
      throw new Error(resData?.message || "Registration failed");
    }
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: !loading && !!token && !!user,
    login,
    register,
    logout,
    refetchUser,
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
