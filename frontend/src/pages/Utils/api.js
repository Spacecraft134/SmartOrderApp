import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
  withCredentials: true,
  params: {
    t: Date.now(),
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
    if (error.config?.url.startsWith("/api")) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return Promise.reject({
          ...error,
          isAuthError: true,
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
