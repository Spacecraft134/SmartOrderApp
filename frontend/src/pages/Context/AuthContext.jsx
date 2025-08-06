import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";

const AuthContext = createContext();
const AUTH_CHANNEL = "auth_broadcast_channel";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("userData"));

      if (token && userData) {
        try {
          await api.get("/api/auth/validate");
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setUser(userData);
        } catch (error) {
          console.error("Token validation failed:", error);
          clearAuth();
        }
      }
      setLoading(false);
    };

    // Set up broadcast channel for cross-tab communication
    const authChannel = new BroadcastChannel(AUTH_CHANNEL);

    // Handle messages from other tabs
    const handleMessage = (event) => {
      if (event.data.type === "LOGOUT") {
        clearAuth();
      }
      if (event.data.type === "LOGIN") {
        initializeAuth();
      }
    };

    // Handle storage events (fallback for older browsers)
    const handleStorage = (event) => {
      if (event.key === "token" && !event.newValue) {
        clearAuth();
      }
    };

    authChannel.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    initializeAuth();

    return () => {
      authChannel.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      authChannel.close();
    };
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);
      const { token, name, role, username } = response.data;

      const userData = {
        name,
        role,
        email: username,
        token,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(userData);

      // Broadcast login to other tabs
      new BroadcastChannel(AUTH_CHANNEL).postMessage({
        type: "LOGIN",
        token,
      });

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    // Broadcast logout to other tabs
    new BroadcastChannel(AUTH_CHANNEL).postMessage({
      type: "LOGOUT",
    });

    // Fallback for browsers without BroadcastChannel
    localStorage.setItem("logout_event", Date.now());

    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
