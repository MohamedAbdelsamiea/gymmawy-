import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import languageEventService from '../services/languageEventService';

/**
 * Hook that listens to language change events from the global service
 * This provides more reliable language change detection for Tabby components
 */
export const useLanguageEvents = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const lang = i18n.language || i18n.resolvedLanguage;
    return languageEventService.getTabbyLanguage(lang);
  });
  const [changeCounter, setChangeCounter] = useState(0);

  useEffect(() => {
    // Subscribe to language change events
    const unsubscribe = languageEventService.subscribe((newLanguage) => {
      const tabbyLang = languageEventService.getTabbyLanguage(newLanguage);
      console.log('useLanguageEvents: Received language change event:', newLanguage, '-> Tabby:', tabbyLang);
      
      setCurrentLanguage(tabbyLang);
      setChangeCounter(prev => prev + 1);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Also listen to i18n changes as backup
  useEffect(() => {
    const currentI18nLang = i18n.language || i18n.resolvedLanguage;
    const tabbyLang = languageEventService.getTabbyLanguage(currentI18nLang);
    
    // Only update if it's different from what we have
    if (tabbyLang !== currentLanguage) {
      console.log('useLanguageEvents: i18n fallback detected change:', currentI18nLang, '-> Tabby:', tabbyLang);
      setCurrentLanguage(tabbyLang);
      setChangeCounter(prev => prev + 1);
    }
  }, [i18n.language, i18n.resolvedLanguage, currentLanguage]);

  return {
    currentLanguage,
    changeCounter,
    isLanguageChanging: changeCounter > 0,
    rawLanguage: i18n.language || i18n.resolvedLanguage
  };
};

export default useLanguageEvents;
