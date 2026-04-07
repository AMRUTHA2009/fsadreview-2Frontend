import axios from "axios";

const envBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const baseURL = envBase.endsWith("/api") ? envBase : `${envBase}/api`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let getToken = () => null;
let onUnauthorized = () => {};
let onApiError = () => {};

export function setApiAuthHandlers(handlers) {
  getToken = handlers.getToken;
  onUnauthorized = handlers.onUnauthorized;
  onApiError = handlers.onApiError;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

api.interceptors.request.use((config) => {
  const token = getToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      onUnauthorized?.();
    }
    if (!error?.config?.skipGlobalErrorHandler) {
      onApiError?.(getErrorMessage(error));
    }
    return Promise.reject(error);
  }
);

export default api;
