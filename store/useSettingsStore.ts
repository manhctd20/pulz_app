import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import i18n, { SUPPORTED_LANGUAGES, SupportedLanguage } from '../lib/i18n';

type SettingsState = {
  language: SupportedLanguage;
  userName: string;
  setLanguage: (lang: SupportedLanguage) => void;
  setUserName: (name: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: (i18n.language as SupportedLanguage) ?? 'vi',
      userName: 'Minh',
      setLanguage: (lang) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;
        void i18n.changeLanguage(lang);
        set({ language: lang });
      },
      setUserName: (name) => set({ userName: name }),
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
