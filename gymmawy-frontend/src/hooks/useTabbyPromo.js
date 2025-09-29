import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import countryDetectionService from '../services/countryDetectionService';

/**
 * Hook for managing Tabby promo functionality
 */
export const useTabbyPromo = () => {
  const { i18n } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [supportedCountries, setSupportedCountries] = useState(countryDetectionService.getSupportedCountries());
  const [currentCountry, setCurrentCountry] = useState(countryDetectionService.getUserCountry());

  // Detect user's country using the service
  const detectCountry = useCallback(() => {
    return countryDetectionService.detectCountry();
  }, []);

  // Check if Tabby is supported for current country
  const checkSupport = useCallback((country = currentCountry) => {
    const supported = countryDetectionService.isTabbySupported(country);
    setIsSupported(supported);
    return supported;
  }, [currentCountry]);

  // Get Tabby configuration for current country
  const getTabbyConfig = useCallback(() => {
    return countryDetectionService.getCountryConfig(currentCountry);
  }, [currentCountry]);

  // Convert price to Tabby-supported currency
  const convertPriceForTabby = useCallback((price, fromCurrency, toCurrency) => {
    return countryDetectionService.convertCurrencyForTabby(price, fromCurrency, toCurrency);
  }, []);

  // Validate price for Tabby
  const validatePrice = useCallback((price) => {
    if (!price || price <= 0) return false;
    
    // Tabby typically supports prices from 50 to 50000 in local currency
    const minPrice = 50;
    const maxPrice = 50000;
    
    return price >= minPrice && price <= maxPrice;
  }, []);

  // Format price for Tabby API
  const formatPriceForTabby = useCallback((price, currency) => {
    return price.toFixed(2);
  }, []);

  // Get display language for Tabby
  const getTabbyLanguage = useCallback(() => {
    // More robust language detection
    return i18n.language === 'ar' || i18n.language.startsWith('ar-') ? 'ar' : 'en';
  }, [i18n.language]);

  // Update country and check support
  const updateCountry = useCallback((country) => {
    const success = countryDetectionService.setUserCountry(country);
    if (success) {
      setCurrentCountry(country);
      checkSupport(country);
    }
    return success;
  }, [checkSupport]);

  // Initialize on mount
  useEffect(() => {
    const detectedCountry = detectCountry();
    setCurrentCountry(detectedCountry);
    checkSupport(detectedCountry);
  }, [detectCountry, checkSupport]);

  // Check support when country changes
  useEffect(() => {
    checkSupport();
  }, [currentCountry, checkSupport]);

  return {
    // State
    isSupported,
    currentCountry,
    supportedCountries,
    
    // Actions
    updateCountry,
    checkSupport,
    
    // Utilities
    getTabbyConfig,
    convertPriceForTabby,
    validatePrice,
    formatPriceForTabby,
    getTabbyLanguage,
    
    // Computed values
    tabbyConfig: getTabbyConfig(),
    tabbyLanguage: getTabbyLanguage()
  };
};

export default useTabbyPromo;
