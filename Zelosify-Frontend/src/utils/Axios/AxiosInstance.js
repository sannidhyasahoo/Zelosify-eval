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

// Add response interceptor for logging
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
    } else {
      console.error(`API Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
