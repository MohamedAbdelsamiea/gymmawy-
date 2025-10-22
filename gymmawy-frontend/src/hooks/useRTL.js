import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const updateDirection = () => {
      const newIsRTL = i18n.language === 'ar';
      setIsRTL(newIsRTL);
      
      // Update document direction immediately
      document.documentElement.dir = newIsRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = i18n.language;
      
      // Force a re-render by updating the counter
      setForceUpdate(prev => prev + 1);
      
      // Also trigger a small delay to ensure all components re-render
      setTimeout(() => {
        setForceUpdate(prev => prev + 1);
      }, 50);
    };

    // Update immediately
    updateDirection();

    // Listen for language changes
    const handleLanguageChange = (lng) => {
      updateDirection();
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return { isRTL, forceUpdate };
};
