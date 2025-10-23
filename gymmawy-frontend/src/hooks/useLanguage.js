// src/hooks/useLanguage.js
import { useTranslation } from 'react-i18next';
import { isArabic, isEnglish, getPrimaryLanguage } from '../utils/languageUtils';

/**
 * Custom hook that provides language utilities
 * Handles full locale codes (like 'en-US') by extracting the primary language
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language || 'ar';
  const primaryLanguage = getPrimaryLanguage(currentLanguage);
  
  return {
    // Full locale (e.g., 'en-US')
    currentLanguage,
    // Primary language code (e.g., 'en')
    primaryLanguage,
    // Boolean checks
    isArabic: isArabic(currentLanguage),
    isEnglish: isEnglish(currentLanguage),
    // Direct comparison functions
    isLang: (lang) => getPrimaryLanguage(currentLanguage) === lang,
  };
}
