// This file sets up axios to make API calls to the backend
import axios from 'axios';
import { getToken, logout } from './auth';

// Base URL for your API - Live production server (override via VITE_API_BASE_URL for local dev)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://leadcrm.peoplenex.online/api';

// Origin (no trailing /api) — used to build URLs for uploaded files served from /storage
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// ── camelCase ↔ snake_case transformers ──
// Backend (Laravel) expects snake_case, frontend uses camelCase
const camelToSnake = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

function transformKeysDeep(obj, keyFn) {
  if (Array.isArray(obj)) return obj.map((item) => transformKeysDeep(item, keyFn));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof File) && !(obj instanceof Blob) && !(obj instanceof FormData)) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[keyFn(key)] = transformKeysDeep(obj[key], keyFn);
      return acc;
    }, {});
  }
  return obj;
}

// Create an axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token + transform request payload keys to snake_case
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Transform request body keys: camelCase → snake_case
    if (config.data && !(config.data instanceof FormData)) {
      config.data = transformKeysDeep(config.data, camelToSnake);
    }
    // Transform query params keys: camelCase → snake_case
    if (config.params) {
      config.params = transformKeysDeep(config.params, camelToSnake);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally (auto-logout on 401)
// Accounting endpoints silently fall back to empty data — never auto-logout for these
const SILENT_401_PATHS = [
  '/accounting/',
];

// Track whether a token refresh is in progress to prevent multiple refresh calls
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

api.interceptors.response.use(
  (response) => {
    // Transform response data keys: snake_case → camelCase
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeysDeep(response.data, snakeToCamel);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Transform error response data keys too (snake_case → camelCase)
    // So field-level errors like password_confirmation → passwordConfirmation
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data = transformKeysDeep(error.response.data, snakeToCamel);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const requestUrl = originalRequest?.url || '';
      const isSilentPath = SILENT_401_PATHS.some((path) => requestUrl.includes(path));

      // Don't try to refresh if the failing request is the refresh-token call itself
      const isRefreshCall = requestUrl.includes('/refresh-token') || requestUrl.includes('/login');

      if (!isSilentPath && !isRefreshCall) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const { refreshAuthToken } = await import('./auth');
            const newToken = await refreshAuthToken();
            isRefreshing = false;

            if (newToken) {
              // Retry all queued requests with the new token
              onRefreshed(newToken);
              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            } else {
              // Refresh failed — logout
              logout();
              window.location.href = '/login';
            }
          } catch (err) {
            console.warn('Token refresh failed during retry:', err);
            isRefreshing = false;
            logout();
            window.location.href = '/login';
          }
        } else {
          // Another refresh is in progress — queue this request
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            });
          });
        }
      } else if (!isSilentPath) {
        // Token expired or invalid on login/refresh endpoints — logout and redirect
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
