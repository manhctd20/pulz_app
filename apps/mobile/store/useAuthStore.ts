import type { User } from '@pulz/shared';
import { create } from 'zustand';

import * as authApi from '../lib/api/auth';
import { getStoredTokens, setStoredTokens } from '../lib/api/tokenStorage';

type Status = 'loading' | 'unauthenticated' | 'authenticated';

type AuthState = {
  status: Status;
  user: User | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    const tokens = await getStoredTokens();
    if (!tokens) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const user = await authApi.me();
      set({ status: 'authenticated', user });
    } catch {
      await setStoredTokens(null);
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    await setStoredTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    set({ status: 'authenticated', user: res.user });
  },

  register: async (email, password, displayName) => {
    const res = await authApi.register({ email, password, displayName });
    await setStoredTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    set({ status: 'authenticated', user: res.user });
  },

  logout: async () => {
    await setStoredTokens(null);
    set({ status: 'unauthenticated', user: null });
  },
}));
