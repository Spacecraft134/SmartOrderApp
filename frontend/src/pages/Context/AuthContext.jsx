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
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("userData");
        const employeeToken = localStorage.getItem("employeeToken");
        const employeeData = localStorage.getItem("employeeData");

        if (token && userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const currentTime = Math.floor(Date.now() / 1000);

              if (payload.exp && payload.exp > currentTime) {
                api.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${token}`;
                setUser(parsedUserData);
              } else {
                clearAuth();
              }
            } else {
              clearAuth();
            }
          } catch (error) {
            clearAuth();
          }
        } else if (employeeToken && employeeData) {
          try {
            const parsedEmployeeData = JSON.parse(employeeData);
            const tokenParts = employeeToken.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const currentTime = Math.floor(Date.now() / 1000);

              if (payload.exp && payload.exp > currentTime) {
                api.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${employeeToken}`;
                setUser(parsedEmployeeData);
              } else {
                clearEmployeeAuth();
              }
            } else {
              clearEmployeeAuth();
            }
          } catch (error) {
            clearEmployeeAuth();
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    const authChannel = new BroadcastChannel(AUTH_CHANNEL);
    const employeeAuthChannel = new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL);

    const handleMessage = (event) => {
      switch (event.data.type) {
        case "LOGOUT":
          clearAuth();
          break;
        case "EMPLOYEE_LOGOUT":
          clearEmployeeAuth();
          break;
        case "LOGIN":
        case "EMPLOYEE_LOGIN":
          setTimeout(initializeAuth, 100);
          break;
        default:
          break;
      }
    };

    const handleStorage = (event) => {
      if (event.key === "token" && !event.newValue) {
        clearAuth();
      }
      if (event.key === "employeeToken" && !event.newValue) {
        clearEmployeeAuth();
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
  };

  const clearEmployeeAuth = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);

      if (response.data?.token) {
        if (response.data.role !== "ADMIN") {
          return { success: false, error: "Unauthorized role" };
        }

        localStorage.removeItem("employeeToken");
        localStorage.removeItem("employeeData");

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

        try {
          new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "LOGIN" });
        } catch (broadcastError) {
          // Silent error handling
        }

        return { success: true, user: userData, error: null };
      }

      return {
        success: false,
        user: null,
        error: response.data?.message || "Login failed - no token received",
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error:
          error.response?.data?.message || error.message || "Network error",
      };
    }
  };

  const employeeLogin = async (credentials) => {
    try {
      const response = await api.post("/api/employee/login", credentials);

      if (response.data?.token && response.data?.user) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");

        const { token, user: userData } = response.data;
        const employeeData = {
          name: userData.name,
          role: userData.role,
          email: userData.username,
          username: userData.username,
          token,
          restaurantId: userData.restaurantId,
        };

        localStorage.setItem("employeeToken", token);
        localStorage.setItem("employeeData", JSON.stringify(employeeData));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(employeeData);

        try {
          new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL).postMessage({
            type: "EMPLOYEE_LOGIN",
          });
        } catch (broadcastError) {
          // Silent error handling
        }

        return { success: true, user: employeeData, error: null };
      }

      return {
        success: false,
        error: response.data?.message || "Login failed - invalid response",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message || error.message || "Network error",
      };
    }
  };

  const logout = async () => {
    try {
      const endpoint =
        user?.role === "ADMIN" ? "/logout" : "/api/employee/logout";
      await api.post(endpoint);
    } catch (error) {
      // Silent error handling
    }

    clearAuth();
    clearEmployeeAuth();
    delete api.defaults.headers.common["Authorization"];

    try {
      new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "LOGOUT" });
      new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL).postMessage({
        type: "EMPLOYEE_LOGOUT",
      });
    } catch (broadcastError) {
      // Silent error handling
    }

    navigate("/employee/login");
  };

  const contextValue = {
    user,
    login,
    employeeLogin,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
