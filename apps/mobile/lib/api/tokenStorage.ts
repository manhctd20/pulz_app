import { Platform } from 'react-native';

const ACCESS_KEY = 'pulz_access_token';
const REFRESH_KEY = 'pulz_refresh_token';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

type Backend = {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  deleteItem: (k: string) => Promise<void>;
};

let backend: Backend;

if (Platform.OS === 'web') {
  backend = {
    getItem: async (k) => {
      try {
        return globalThis.localStorage?.getItem(k) ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (k, v) => {
      try {
        globalThis.localStorage?.setItem(k, v);
      } catch {
        /* noop */
      }
    },
    deleteItem: async (k) => {
      try {
        globalThis.localStorage?.removeItem(k);
      } catch {
        /* noop */
      }
    },
  };
} else {
  // Lazy require để tránh load expo-secure-store trên web (module native-only)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store');
  backend = {
    getItem: (k) => SecureStore.getItemAsync(k),
    setItem: (k, v) => SecureStore.setItemAsync(k, v),
    deleteItem: (k) => SecureStore.deleteItemAsync(k),
  };
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    backend.getItem(ACCESS_KEY),
    backend.getItem(REFRESH_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function setStoredTokens(tokens: StoredTokens | null): Promise<void> {
  if (!tokens) {
    await Promise.all([backend.deleteItem(ACCESS_KEY), backend.deleteItem(REFRESH_KEY)]);
    return;
  }
  await Promise.all([
    backend.setItem(ACCESS_KEY, tokens.accessToken),
    backend.setItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}
