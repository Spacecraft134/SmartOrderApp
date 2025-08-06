import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      verifyToken(token).then((isValid) => {
        if (isValid) {
          setUser({ token, role });
        } else {
          clearAuth();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      // The interceptor will now automatically add the header
      const response = await api.get("/api/auth/validate");
      return response.data.valid;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  };

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);
      const { token, role, name, username } = response.data;

      const userData = { token, role, name, email: username };

      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(userData));

      // Set the default Authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  // In your AuthContext.js
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  // Add setUser to the provided values
  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
