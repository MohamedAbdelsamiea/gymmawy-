import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';

export const useLanguageInit = () => {
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async() => {
      try {
        // Check if language is already set in cookie
        const savedLanguage = Cookies.get('i18next');
        
        if (savedLanguage && ['en', 'ar'].includes(savedLanguage)) {
          // Language is already set, just ensure it's loaded
          if (!i18n.hasResourceBundle(savedLanguage, 'translation')) {
            await i18n.loadLanguages(savedLanguage);
          }
          setIsInitialized(true);
        } else {
          // No saved language, detect from browser or use default
          const detectedLanguage = i18n.language || 'en';
          await i18n.changeLanguage(detectedLanguage);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Language initialization error:', error);
        // Fallback to English
        await i18n.changeLanguage('en');
        setIsInitialized(true);
      }
    };

    if (i18n.isInitialized) {
      setIsInitialized(true);
    } else {
      initializeLanguage();
    }
  }, [i18n]);

  return isInitialized;
};
