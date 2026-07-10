import React, { createContext, useContext, useEffect, useState } from "react";
import client from "../lib/api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const token = localStorage.getItem("ikigai_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await client.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("ikigai_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshMe(); }, []);

  const login = async (a, b) => {
    const payload = typeof a === "object" ? a : { email: a, password: b };
    const { data } = await client.post("/auth/login", payload);
    localStorage.setItem("ikigai_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await client.post("/auth/signup", payload);
    localStorage.setItem("ikigai_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("ikigai_token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, signup, logout, loading, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
