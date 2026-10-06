// src/utils/axiosInstance.js
import axios from "axios";

const rawBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api/v1";
const baseURL = rawBaseUrl.endsWith("/api/v1")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, "")}/api/v1`;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Add request interceptor to normalize /api/v1 paths and prevent duplication
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith("/api/v1/")) {
      config.url = config.url.replace(/^\/api\/v1/, "");
    }
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and session handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `API Response [${
        response.status
      }]: ${response.config.method.toUpperCase()} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `API Error [${
          error.response.status
        }]: ${error.config.method.toUpperCase()} ${error.config.url}`,
        error.response.data
      );

      // Gracefully handle 401 unauthorized / expired sessions on protected endpoints
      if (error.response.status === 401 && typeof window !== "undefined") {
        const url = error.config?.url || "";
        const isAuthAttempt =
          url.includes("/auth/login") ||
          url.includes("/auth/verify") ||
          url.includes("/auth/register");

        if (!isAuthAttempt) {
          console.warn(
            "Session token expired or unauthorized (401). Clearing stale auth state..."
          );
          // Invalidate client cookies
          document.cookie =
            "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie =
            "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie =
            "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          localStorage.removeItem("zelosify_user");

          // Only redirect if on a protected page
          const pathname = window.location.pathname;
          if (
            pathname !== "/login" &&
            pathname !== "/register" &&
            pathname !== "/setup-totp" &&
            pathname !== "/"
          ) {
            window.location.href = "/login";
          }
        }
      }
    } else {
      console.error(`API Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
