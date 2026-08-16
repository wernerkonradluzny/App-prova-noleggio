import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'rental-525/language';

function preferredLanguage(): Language {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGES.includes(saved as Language) ? (saved as Language) : 'en';
}

/** Arabic reads right to left, so the whole document flips with the language. */
function applyDirection(language: string): void {
  const rtl = language === 'ar';
  document.documentElement.lang = language;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('font-arabic', rtl);
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: preferredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

applyDirection(i18n.language);

i18n.on('languageChanged', (language) => {
  window.localStorage.setItem(STORAGE_KEY, language);
  applyDirection(language);
});

export default i18n;
