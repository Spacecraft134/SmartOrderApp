import { createContext, useContext, useEffect, useState } from "react";

import api from "../Utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("jwtToken");
    const role = localStorage.getItem("userRole");
    return token && role ? { token, role } : null;
  });

  const login = async (credentials) => {
    try {
      const { data } = await api.post("/login", credentials);
      // Store token and role
      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("userRole", data.role);
      setUser({ token: data.token, role: data.role });
      return { success: true, role: data.role };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userRole");
    setUser(null);
  };

  // Verify token on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (user?.token) {
        try {
          await api.get("/api/auth/verify");
        } catch (error) {
          logout();
        }
      }
    };
    verifyToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
