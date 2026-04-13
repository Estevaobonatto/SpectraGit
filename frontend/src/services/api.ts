import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single in-flight refresh promise — deduplicates concurrent 401 retries
// (e.g. React 18 StrictMode fires effects twice)
let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // Always attempt a silent refresh — the HttpOnly cookie or stored refresh token
      // will be used. The document.cookie check is unreliable because the cookie path
      // is restricted to /api/v1/auth and not visible from the page's JavaScript.
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshing) {
        refreshing = axios
          .post(`${API_BASE}/auth/refresh`, { refreshToken: refreshToken || undefined }, { withCredentials: true })
          .then(({ data }) => {
            useAuthStore
              .getState()
              .setTokens(data.data.accessToken, data.data.refreshToken ?? data.data.accessToken);
          })
          .catch(() => {
            useAuthStore.getState().logout();
          })
          .finally(() => {
            refreshing = null;
          });
      }
      try {
        await refreshing;
        const newToken = useAuthStore.getState().accessToken;
        if (!newToken) return Promise.reject(error);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
