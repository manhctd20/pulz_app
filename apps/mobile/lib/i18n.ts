import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import vi from '../locales/vi.json';

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const deviceLang = getLocales()[0]?.languageCode ?? 'vi';
const initialLang: SupportedLanguage = (SUPPORTED_LANGUAGES as readonly string[]).includes(
  deviceLang,
)
  ? (deviceLang as SupportedLanguage)
  : 'vi';

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'vi',
  // Hermes (iOS engine) chưa support đầy đủ Intl.PluralRules → dùng compat v3 format
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
