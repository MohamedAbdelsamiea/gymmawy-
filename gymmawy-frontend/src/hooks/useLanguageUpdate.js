import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import languageEventService from '../services/languageEventService';

/**
 * Hook that forces re-render when language changes
 * Use this in components that have inline styles or need to update immediately
 */
export const useLanguageUpdate = () => {
  const { i18n } = useTranslation();
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = (newLanguage) => {
      // Force re-render by updating the key
      setUpdateKey(prev => prev + 1);
    };

    // Subscribe to language changes
    const unsubscribe = languageEventService.subscribe(handleLanguageChange);

    // Also listen to i18n language changes as backup
    const handleI18nChange = (lng) => {
      setUpdateKey(prev => prev + 1);
    };

    i18n.on('languageChanged', handleI18nChange);

    return () => {
      unsubscribe();
      i18n.off('languageChanged', handleI18nChange);
    };
  }, [i18n]);

  return updateKey;
};

/**
 * Hook that provides reactive language state
 * Returns current language and RTL status that updates immediately
 */
export const useReactiveLanguage = () => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');

  useEffect(() => {
    const handleLanguageChange = (newLanguage) => {
      setLanguage(newLanguage);
      setIsRTL(newLanguage === 'ar');
    };

    // Subscribe to language changes
    const unsubscribe = languageEventService.subscribe(handleLanguageChange);

    // Also listen to i18n language changes as backup
    const handleI18nChange = (lng) => {
      setLanguage(lng);
      setIsRTL(lng === 'ar');
    };

    i18n.on('languageChanged', handleI18nChange);

    return () => {
      unsubscribe();
      i18n.off('languageChanged', handleI18nChange);
    };
  }, [i18n]);

  return { language, isRTL };
};
