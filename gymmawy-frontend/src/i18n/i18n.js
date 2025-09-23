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
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      lookupCookie: 'i18next',
      cookieMinutes: 10080, // 7 days
      cookieDomain: process.env.NODE_ENV === 'production' ? 'gym.omarelnemr.xyz' : 'localhost',
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
  });

export default i18n;
