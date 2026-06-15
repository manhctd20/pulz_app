import axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { getStoredTokens, setStoredTokens } from './tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use(async (config) => {
  const tokens = await getStoredTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const newAccess = await refreshAccessToken();
      if (!newAccess) return Promise.reject(error);
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
      return api.request(original);
    } catch (e) {
      return Promise.reject(e);
    }
  },
);

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const tokens = await getStoredTokens();
        if (!tokens?.refreshToken) return null;
        const res = await axios.post<{ accessToken: string }>(
          `${API_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken },
          { timeout: 10000 },
        );
        const next = { ...tokens, accessToken: res.data.accessToken };
        await setStoredTokens(next);
        return res.data.accessToken;
      } catch {
        await setStoredTokens(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}
