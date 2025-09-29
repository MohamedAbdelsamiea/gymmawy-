import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to synchronize language changes with external components
 * Provides a more reliable way to detect language changes
 */
export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const lang = i18n.language || i18n.resolvedLanguage;
    return lang === 'ar' || lang?.startsWith('ar-') ? 'ar' : 'en';
  });
  const [languageChangeCounter, setLanguageChangeCounter] = useState(0);
  const lastLanguageRef = useRef(i18n.language);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Skip initial render
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    const currentI18nLang = i18n.language || i18n.resolvedLanguage;
    
    // Only proceed if language actually changed
    if (lastLanguageRef.current !== currentI18nLang) {
      console.log('LanguageSync: Language change detected from', lastLanguageRef.current, 'to', currentI18nLang);
      
      lastLanguageRef.current = currentI18nLang;
      
      const newLang = currentI18nLang === 'ar' || currentI18nLang?.startsWith('ar-') ? 'ar' : 'en';
      
      // Update state
      setCurrentLanguage(newLang);
      
      // Increment counter to trigger re-renders
      setLanguageChangeCounter(prev => prev + 1);
    }
  }, [i18n.language, i18n.resolvedLanguage]);

  // Also listen to i18n events directly
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      console.log('LanguageSync: i18n languageChanged event:', lng);
      
      // Small delay to ensure i18n state is fully updated
      setTimeout(() => {
        const currentI18nLang = i18n.language || i18n.resolvedLanguage || lng;
        
        if (lastLanguageRef.current !== currentI18nLang) {
          console.log('LanguageSync: Confirming language change via event from', lastLanguageRef.current, 'to', currentI18nLang);
          
          lastLanguageRef.current = currentI18nLang;
          
          const newLang = currentI18nLang === 'ar' || currentI18nLang?.startsWith('ar-') ? 'ar' : 'en';
          
          setCurrentLanguage(newLang);
          setLanguageChangeCounter(prev => prev + 1);
        }
      }, 100);
    };

    // Listen to i18n language change events
    i18n.on('languageChanged', handleLanguageChanged);

    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return {
    currentLanguage,
    languageChangeCounter,
    isLanguageChanging: languageChangeCounter > 0,
    rawLanguage: i18n.language || i18n.resolvedLanguage
  };
};

export default useLanguageSync;
