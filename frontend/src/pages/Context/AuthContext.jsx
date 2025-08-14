import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";

const AuthContext = createContext();
const AUTH_CHANNEL = "auth_broadcast_channel";
const EMPLOYEE_AUTH_CHANNEL = "employee_auth_channel";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const clearEmployeeAuth = () => {
    localStorage.removeItem("employeeAccessToken");
    localStorage.removeItem("employeeRefreshToken");
    localStorage.removeItem("employeeData");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const logout = useCallback(async () => {
    try {
      const endpoint =
        user?.role === "ADMIN" ? "/logout" : "/api/employee/logout";
      await api.post(endpoint);
    } catch (error) {
      // Silent error handling
    }

    clearAuth();
    clearEmployeeAuth();

    try {
      new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "LOGOUT" });
      new BroadcastChannel(EMPLOYEE_AUTH_CHANNEL).postMessage({
        type: "EMPLOYEE_LOGOUT",
      });
    } catch (broadcastError) {
      // Silent error handling
    }

    navigate("/employee/login");
  }, [user?.role, navigate]);

  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken =
        localStorage.getItem("refreshToken") ||
        localStorage.getItem("employeeRefreshToken");

      if (!storedRefreshToken) {
        return null;
      }

      const response = await api.post("/api/auth/refresh", {
        refreshToken: storedRefreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      const isEmployee =
        localStorage.getItem("employeeAccessToken") ||
        localStorage.getItem("employeeData");

      if (isEmployee) {
        localStorage.setItem("employeeAccessToken", accessToken);
        localStorage.setItem("employeeRefreshToken", newRefreshToken);
      } else {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      return accessToken;
    } catch (error) {
      throw error;
    }
  }, []);

  // Setup API interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("employeeAccessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (originalRequest.url?.includes("/api/auth/refresh")) {
            logout();
            return Promise.reject(error);
          }

          try {
            const newToken = await refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken, logout]);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("userData");
        const employeeToken = localStorage.getItem("employeeAccessToken");
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

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);

      if (response.data?.accessToken) {
        if (response.data.user?.role !== "ADMIN") {
          return { success: false, error: "Unauthorized role" };
        }

        localStorage.removeItem("employeeAccessToken");
        localStorage.removeItem("employeeRefreshToken");
        localStorage.removeItem("employeeData");

        const { accessToken, refreshToken, user: userData } = response.data;
        const userInfo = {
          name: userData.name,
          role: userData.role,
          email: userData.username,
          token: accessToken,
          restaurantId: userData.restaurantId,
        };

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userData", JSON.stringify(userInfo));
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        setUser(userInfo);

        return { success: true, user: userInfo, error: null };
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

      if (response.data?.accessToken && response.data?.user) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");

        const { accessToken, refreshToken, user: userData } = response.data;
        const employeeData = {
          name: userData.name,
          role: userData.role,
          email: userData.username,
          username: userData.username,
          token: accessToken,
          restaurantId: userData.restaurantId,
        };

        localStorage.setItem("employeeAccessToken", accessToken);
        localStorage.setItem("employeeRefreshToken", refreshToken);
        localStorage.setItem("employeeData", JSON.stringify(employeeData));
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        setUser(employeeData);

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

  const contextValue = {
    user,
    login,
    employeeLogin,
    logout,
    loading,
    refreshToken,
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
