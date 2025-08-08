import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Using "token" as key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only process API errors
    if (error.config?.url.startsWith("/api")) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("Auth error detected at:", error.config.url);

        // Return special error object instead of clearing storage
        return Promise.reject({
          ...error,
          isAuthError: true, // Custom flag
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
