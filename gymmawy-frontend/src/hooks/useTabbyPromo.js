import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import countryDetectionService from '../services/countryDetectionService';

// Tabby supported countries
const TABBY_SUPPORTED_COUNTRIES = ['AE', 'SA', 'KW', 'BH', 'EG'];

// Country configurations for Tabby
const TABBY_COUNTRY_CONFIGS = {
  'AE': { currency: 'AED', language: 'ar', name: 'UAE' },
  'SA': { currency: 'SAR', language: 'ar', name: 'Saudi Arabia' },
  'KW': { currency: 'KWD', language: 'ar', name: 'Kuwait' },
  'BH': { currency: 'BHD', language: 'ar', name: 'Bahrain' },
  'EG': { currency: 'EGP', language: 'ar', name: 'Egypt' }
};

/**
 * Hook for managing Tabby promo functionality
 */
export const useTabbyPromo = () => {
  const { i18n } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [supportedCountries, setSupportedCountries] = useState(TABBY_SUPPORTED_COUNTRIES);
  const [currentCountry, setCurrentCountry] = useState(null);

  // Detect user's country using the service
  const detectCountry = useCallback(async () => {
    try {
      const result = await countryDetectionService.detectCountry();
      return result;
    } catch (error) {
      console.error('Error detecting country:', error);
      return { country: 'Egypt', countryCode: 'EG', phoneCode: '+20' };
    }
  }, []);

  // Check if Tabby is supported for current country
  const checkSupport = useCallback((countryCode) => {
    const supported = TABBY_SUPPORTED_COUNTRIES.includes(countryCode);
    setIsSupported(supported);
    return supported;
  }, []);

  // Get Tabby configuration for current country
  const getTabbyConfig = useCallback((countryCode = currentCountry?.countryCode) => {
    if (!countryCode) return null;
    return TABBY_COUNTRY_CONFIGS[countryCode] || null;
  }, [currentCountry]);

  // Convert price to Tabby-supported currency (simplified version)
  const convertPriceForTabby = useCallback((price, fromCurrency, toCurrency) => {
    // For now, just return the price as-is
    // In a real implementation, you would use an exchange rate service
    return price;
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
  const updateCountry = useCallback((countryCode) => {
    const countryInfo = TABBY_COUNTRY_CONFIGS[countryCode];
    if (countryInfo) {
      setCurrentCountry({ countryCode, ...countryInfo });
      checkSupport(countryCode);
      return true;
    }
    return false;
  }, [checkSupport]);

  // Initialize on mount
  useEffect(() => {
    const initializeCountry = async () => {
      try {
        const detectedCountry = await detectCountry();
        setCurrentCountry(detectedCountry);
        if (detectedCountry?.countryCode) {
          checkSupport(detectedCountry.countryCode);
        }
      } catch (error) {
        console.error('Error initializing country:', error);
        // Set default to Egypt if detection fails
        setCurrentCountry({ country: 'Egypt', countryCode: 'EG', phoneCode: '+20' });
        checkSupport('EG');
      }
    };

    initializeCountry();
  }, [detectCountry, checkSupport]);

  // Check support when country changes
  useEffect(() => {
    if (currentCountry?.countryCode) {
      checkSupport(currentCountry.countryCode);
    }
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
