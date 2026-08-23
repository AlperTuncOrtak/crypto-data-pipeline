import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import trTranslation from './locales/tr/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  tr: {
    translation: trTranslation
  }
};

i18n
  // Detects user language from browser settings or localStorage
  .use(LanguageDetector)
  // Passes i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

// CSS `text-transform: uppercase` follows the document language. Without this
// Turkish text uppercased with English rules: "maliyet" became "MALIYET"
// instead of "MALİYET", because the dotted i only maps to İ under tr rules.
const applyDocumentLanguage = (lng: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng.split("-")[0];
  }
};

applyDocumentLanguage(i18n.language || "en");
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
