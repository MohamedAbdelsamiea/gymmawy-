import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from "i18next-http-backend";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(HttpBackend)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      lookupCookie: 'i18next',
      cookieMinutes: 10080, // 7 days
      cookieDomain: import.meta.env.PROD ? 'gymmawy.fit' : 'localhost',
      // Ensure proper language detection
      checkWhitelist: true,
      // Only detect languages we support
      convertDetectedLanguage: (lng) => {
        // Convert detected language to our supported languages
        if (lng.startsWith('ar')) return 'ar';
        if (lng.startsWith('en')) return 'en';
        return 'en'; // Default fallback
      }
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    returnObjects: true,
    react: {
      useSuspense: true,
    },
    load: 'languageOnly',
    preload: ['en', 'ar'],
    ns: ['translation', 'common', 'header', 'footer', 'checkout', 'payment', 'currency', 'rewards', 'terms', 'privacy'],
    defaultNS: 'translation',
  });

export default i18n;
