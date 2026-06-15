import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import i18n, { SUPPORTED_LANGUAGES, SupportedLanguage } from '../lib/i18n';

export type ThemePreference = 'dark' | 'light' | 'system';

type SettingsState = {
  language: SupportedLanguage;
  userName: string;
  hasSeenOnboarding: boolean;
  theme: ThemePreference;
  setLanguage: (lang: SupportedLanguage) => void;
  setUserName: (name: string) => void;
  markOnboarded: () => void;
  setTheme: (theme: ThemePreference) => void;
  cycleTheme: () => void;
};

const THEME_CYCLE: ThemePreference[] = ['dark', 'light', 'system'];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: (i18n.language as SupportedLanguage) ?? 'vi',
      userName: 'Minh',
      hasSeenOnboarding: false,
      theme: 'dark',
      setLanguage: (lang) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;
        void i18n.changeLanguage(lang);
        set({ language: lang });
      },
      setUserName: (name) => set({ userName: name }),
      markOnboarded: () => set({ hasSeenOnboarding: true }),
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => {
        const current = get().theme;
        const idx = THEME_CYCLE.indexOf(current);
        set({ theme: THEME_CYCLE[(idx + 1) % THEME_CYCLE.length] });
      },
    }),
    {
      name: 'pulzapp-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language && state.language !== i18n.language) {
          void i18n.changeLanguage(state.language);
        }
      },
    },
  ),
);
