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
        console.log("Initializing auth...");

        // Check for admin auth first
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("userData");

        // Then check for employee auth
        const employeeToken = localStorage.getItem("employeeToken");
        const employeeData = localStorage.getItem("employeeData");

        if (token && userData) {
          try {
            const parsedUserData = JSON.parse(userData);

            // Basic token validation - check if it's a valid JWT format
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              // Decode payload to check expiration
              const payload = JSON.parse(atob(tokenParts[1]));

              // Check if token is not expired
              const currentTime = Math.floor(Date.now() / 1000);

              if (payload.exp && payload.exp > currentTime) {
                api.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${token}`;
                setUser(parsedUserData);
                console.log(
                  "Admin auth restored successfully:",
                  parsedUserData.name
                );
              } else {
                console.log("Admin token expired, clearing...");
                clearAuth();
              }
            } else {
              console.log("Invalid admin token format, clearing...");
              clearAuth();
            }
          } catch (error) {
            console.error("Admin auth parsing failed:", error);
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
                console.log(
                  "Employee auth restored successfully:",
                  parsedEmployeeData.name
                );
              } else {
                console.log("Employee token expired, clearing...");
                clearEmployeeAuth();
              }
            } else {
              console.log("Invalid employee token format, clearing...");
              clearEmployeeAuth();
            }
          } catch (error) {
            console.error("Employee auth parsing failed:", error);
            clearEmployeeAuth();
          }
        } else {
          console.log("No stored authentication found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    // Set up broadcast channels for cross-tab communication
    const authChannel = new BroadcastChannel(AUTH_CHANNEL);
    const employeeAuthChannel = new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL);

    const handleMessage = (event) => {
      console.log("Broadcast message received:", event.data);

      switch (event.data.type) {
        case "LOGOUT":
          clearAuth();
          break;
        case "EMPLOYEE_LOGOUT":
          clearEmployeeAuth();
          break;
        case "LOGIN":
        case "EMPLOYEE_LOGIN":
          // Reinitialize auth when login happens in another tab
          setTimeout(initializeAuth, 100);
          break;
        default:
          break;
      }
    };

    const handleStorage = (event) => {
      // Handle direct localStorage changes (like from dev tools)
      if (event.key === "token" && !event.newValue) {
        console.log("Token removed from localStorage");
        clearAuth();
      }
      if (event.key === "employeeToken" && !event.newValue) {
        console.log("Employee token removed from localStorage");
        clearEmployeeAuth();
      }
    };

    // Set up event listeners
    authChannel.addEventListener("message", handleMessage);
    employeeAuthChannel.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    // Initialize authentication
    initializeAuth();

    // Cleanup function
    return () => {
      authChannel.removeEventListener("message", handleMessage);
      employeeAuthChannel.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      authChannel.close();
      employeeAuthChannel.close();
    };
  }, []);

  const clearAuth = () => {
    console.log("Clearing admin authentication");
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const clearEmployeeAuth = () => {
    console.log("Clearing employee authentication");
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      console.log("Attempting admin login for:", credentials.username);

      const response = await api.post("/login", credentials);
      console.log("Login response received:", response.status);

      if (response.data?.token) {
        if (response.data.role !== "ADMIN") {
          console.log("Invalid role for admin login:", response.data.role);
          return { success: false, error: "Unauthorized role" };
        }

        // Clear any existing employee auth
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

        console.log("Storing admin auth data...");

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(userData));

        // Set API header
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Update state
        setUser(userData);

        console.log("Admin login successful for:", name);

        // Notify other tabs
        try {
          new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "LOGIN" });
        } catch (broadcastError) {
          console.warn("Failed to broadcast login:", broadcastError);
        }

        return { success: true, user: userData, error: null };
      }

      console.log("Login failed - no token in response");
      return {
        success: false,
        user: null,
        error: response.data?.message || "Login failed - no token received",
      };
    } catch (error) {
      console.error("Admin login error:", error);
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
      console.log("Attempting employee login for:", credentials.username);

      const response = await api.post("/api/employee/login", credentials);
      console.log("Employee login response:", response.status);

      if (response.data?.token && response.data?.user) {
        // Clear any existing admin auth
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

        console.log("Storing employee auth data...");

        // Store in localStorage
        localStorage.setItem("employeeToken", token);
        localStorage.setItem("employeeData", JSON.stringify(employeeData));

        // Set API header
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Update state
        setUser(employeeData);

        console.log("Employee login successful for:", userData.name);

        // Notify other tabs
        try {
          new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL).postMessage({
            type: "EMPLOYEE_LOGIN",
          });
        } catch (broadcastError) {
          console.warn("Failed to broadcast employee login:", broadcastError);
        }

        return { success: true, user: employeeData, error: null };
      }

      console.log("Employee login failed - invalid response structure");
      return {
        success: false,
        error: response.data?.message || "Login failed - invalid response",
      };
    } catch (error) {
      console.error("Employee login error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || error.message || "Network error",
      };
    }
  };

  const logout = async () => {
    const isEmployee = user?.role === "WAITER" || user?.role === "KITCHEN";
    console.log("Logging out...", isEmployee ? "employee" : "admin");

    try {
      // Try to call backend logout
      const endpoint = isEmployee ? "/logout" : "/logout"; // Using same endpoint for now
      await api.post(endpoint);
      console.log("Backend logout successful");
    } catch (error) {
      console.warn(
        "Backend logout failed (continuing with frontend logout):",
        error.message
      );
      // Continue with frontend logout even if backend fails
    }

    // Clear auth based on user type
    if (user?.role === "ADMIN") {
      try {
        new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "LOGOUT" });
      } catch (broadcastError) {
        console.warn("Failed to broadcast logout:", broadcastError);
      }
      clearAuth();
    } else {
      try {
        new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL).postMessage({
          type: "EMPLOYEE_LOGOUT",
        });
      } catch (broadcastError) {
        console.warn("Failed to broadcast employee logout:", broadcastError);
      }
      clearEmployeeAuth();
    }

    console.log("Logout completed");
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
