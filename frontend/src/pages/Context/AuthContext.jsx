import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";

const AuthContext = createContext();
const AUTH_CHANNEL = "auth_broadcast_channel";
const EMPLOYEE_AUTH_CHANNEL = "employee_auth_channel";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      // Check for admin auth first
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("userData"));

      // Then check for employee auth
      const employeeToken = localStorage.getItem("employeeToken");
      const employeeData = JSON.parse(localStorage.getItem("employeeData"));

      if (token && userData) {
        // Validate admin token
        api
          .get("/api/auth/validate")
          .then(() => {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setUser(userData);
          })
          .catch((error) => {
            console.error("Admin token validation failed:", error);
            clearAuth();
          })
          .finally(() => setLoading(false));
      } else if (employeeToken && employeeData) {
        // Validate employee token
        api
          .get("/api/employee/validate")
          .then(() => {
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${employeeToken}`;
            setUser(employeeData);
          })
          .catch((error) => {
            console.error("Employee token validation failed:", error);
            clearEmployeeAuth();
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    };

    // Set up broadcast channels
    const authChannel = new BroadcastChannel(AUTH_CHANNEL);
    const employeeAuthChannel = new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL);

    const handleMessage = (event) => {
      if (event.data.type === "LOGOUT") {
        clearAuth();
      }
      if (event.data.type === "EMPLOYEE_LOGOUT") {
        clearEmployeeAuth();
      }
      if (event.data.type === "LOGIN" || event.data.type === "EMPLOYEE_LOGIN") {
        initializeAuth();
      }
    };

    const handleStorage = (event) => {
      if (
        (event.key === "token" || event.key === "employeeToken") &&
        !event.newValue
      ) {
        if (event.key === "token") clearAuth();
        if (event.key === "employeeToken") clearEmployeeAuth();
      }
    };

    authChannel.addEventListener("message", handleMessage);
    employeeAuthChannel.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    initializeAuth();

    return () => {
      authChannel.removeEventListener("message", handleMessage);
      employeeAuthChannel.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      authChannel.close();
      employeeAuthChannel.close();
    };
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/login");
  };

  const clearEmployeeAuth = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/employee/login");
  };

  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);

      if (response.data?.token) {
        if (response.data.role !== "ADMIN") {
          return { success: false, error: "Unauthorized role" };
        }

        // Clear any existing employee auth
        clearEmployeeAuth();

        const { token, username, role, name, restaurantId } = response.data;

        const userData = {
          name,
          role,
          email: username,
          token,
          restaurantId,
        };

        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);

        // Notify other tabs
        new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "LOGIN" });

        return { success: true, user: userData, error: null };
      }

      return {
        success: false,
        user: null,
        error: response.data?.message || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error: error.response?.data?.message || "Network error",
      };
    }
  };

  const employeeLogin = async (credentials) => {
    try {
      const response = await api.post("/api/employee/login", credentials);

      if (response.data?.token) {
        // Clear any existing admin auth
        clearAuth();

        const { token, username, role, name, restaurantId } = response.data;

        const userData = {
          name,
          role,
          email: username,
          token,
          restaurantId,
        };

        localStorage.setItem("employeeToken", token);
        localStorage.setItem("employeeData", JSON.stringify(userData));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);

        // Notify other tabs
        new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL).postMessage({
          type: "EMPLOYEE_LOGIN",
        });

        return { success: true, user: userData, error: null };
      }

      return {
        success: false,
        user: null,
        error: response.data?.message || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error: error.response?.data?.message || "Network error",
      };
    }
  };

  const logout = async () => {
    try {
      const isEmployee = user?.role === "WAITER" || user?.role === "KITCHEN";
      await api.post(isEmployee ? "/api/employee/logout" : "/logout");
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      if (user?.role === "ADMIN") {
        clearAuth();
      } else {
        clearEmployeeAuth();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, employeeLogin, logout, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
