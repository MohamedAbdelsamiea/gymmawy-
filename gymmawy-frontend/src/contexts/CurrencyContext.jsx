import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import currencyService from '../services/currencyService';
import countryDetectionService from '../services/countryDetectionService';

const CurrencyContext = createContext();

export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useState('EGP'); // Default to EGP for Egypt
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCurrencies] = useState(['EGP', 'AED', 'SAR', 'USD']);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [isDetectedCurrency, setIsDetectedCurrency] = useState(false);
  const [userPreference, setUserPreference] = useState(null);

  // Initialize currency detection
  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        setIsLoading(true);
        setError(null);

            // Check for stored user preference first
            const storedPreference = localStorage.getItem('userCurrencyPreference');
            console.log('🔍 Checking stored user preference:', storedPreference);
            if (storedPreference && availableCurrencies.includes(storedPreference)) {
              console.log('🔄 Setting currency to stored preference:', storedPreference);
              setCurrency(storedPreference);
              setUserPreference(storedPreference);
              setIsDetectedCurrency(false);
              console.log('✅ Using stored user preference:', storedPreference);
              console.log('⚠️ Skipping country detection due to stored preference');
              setIsLoading(false);
              return;
            }

            // No stored preference, detect from location
            console.log('🔄 No stored preference found, starting country detection...');
            const detectedCountry = countryDetectionService.detectCountry();
            const countryConfig = countryDetectionService.getCountryConfig(detectedCountry);
            setDetectedCountry(countryConfig);
            
            console.log('🌍 Country Detection Results:');
            console.log('  - Detected Country Code:', detectedCountry);
            console.log('  - Country Config:', countryConfig);
            console.log('  - Country Name:', countryConfig.name);
            console.log('  - Country Currency:', countryConfig.currency);
            
            if (availableCurrencies.includes(countryConfig.currency)) {
              setCurrency(countryConfig.currency);
              setIsDetectedCurrency(true);
              console.log('✅ Currency detected from country:', detectedCountry, '->', countryConfig.currency);
            } else {
              // Fallback to API detection
              try {
                console.log('🔄 Falling back to API currency detection...');
                const detectionResult = await currencyService.detectCurrency();
                console.log('🌐 API Detection Results:', detectionResult);
                
                if (detectionResult.success && availableCurrencies.includes(detectionResult.currency)) {
                  setCurrency(detectionResult.currency);
                  setIsDetectedCurrency(true);
                  console.log('✅ Currency detected from API:', detectionResult.currency);
                } else {
                  throw new Error('Invalid currency detected');
                }
              } catch (apiError) {
                console.warn('❌ API currency detection failed:', apiError.message);
                
                // Final fallback to EGP
                setCurrency('EGP');
                setIsDetectedCurrency(false);
                console.log('⚠️ Using fallback currency: EGP');
              }
        }
      } catch (err) {
        console.error('Currency initialization error:', err);
        setError(err.message);
        setCurrency('EGP'); // Final fallback
        setIsDetectedCurrency(false);
      } finally {
        setIsLoading(false);
      }
    };

        initializeCurrency();
  }, []);

  // Log final currency state after updates
  useEffect(() => {
    if (!isLoading) {
      console.log('🎯 Final Currency Selection:');
      console.log('  - Selected Currency:', currency);
      console.log('  - Is Detected Currency:', isDetectedCurrency);
      console.log('  - User Preference:', userPreference);
      console.log('  - Detected Country:', detectedCountry);
      console.log('  - Available Currencies:', availableCurrencies);
    }
  }, [currency, isLoading, isDetectedCurrency, userPreference, detectedCountry, availableCurrencies]);

  // Change currency
  const changeCurrency = async (newCurrency) => {
    if (!availableCurrencies.includes(newCurrency)) {
      console.error('Invalid currency:', newCurrency);
      return false;
    }

    try {
      setError(null);
      
      // Update currency service
      currencyService.setCurrentCurrency(newCurrency);
      setCurrency(newCurrency);
      setUserPreference(newCurrency);
      setIsDetectedCurrency(false);

      // Store user preference in localStorage
      localStorage.setItem('userCurrencyPreference', newCurrency);

      // Update user preference if authenticated
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await currencyService.updatePreferredCurrency(newCurrency, token);
        } catch (err) {
          console.warn('Failed to update preferred currency:', err);
        }
      }

      console.log('Currency changed to:', newCurrency, '(user preference)');
      return true;
    } catch (err) {
      console.error('Currency change error:', err);
      setError(err.message);
      return false;
    }
  };

  // Get currency info
  const getCurrencyInfo = (curr = currency) => {
    const currencyInfo = {
      'EGP': { code: 'EGP', symbol: 'EGP', symbolAr: 'ج.م', name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬' },
      'AED': { code: 'AED', symbol: 'AED', symbolAr: 'د.إ', name: 'UAE Dirham', country: 'UAE', flag: '🇦🇪' },
      'SAR': { code: 'SAR', symbol: '﷼', symbolAr: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦' },
      'USD': { code: 'USD', symbol: '$', symbolAr: '$', name: 'US Dollar', country: 'United States', flag: '🇺🇸' }
    };
    
    return currencyInfo[curr] || currencyInfo['EGP'];
  };

  // Format price with current currency
  const formatPrice = (amount, curr = currency, showSymbol = true) => {
    if (amount === 0 || amount === 'FREE' || amount === 'مجاني') {
      return i18n.language === 'ar' ? 'مجاني' : 'FREE';
    }

    const currencyInfo = getCurrencyInfo(curr);
    // Use language-specific symbols for EGP and AED, same symbol for SAR and USD
    const symbol = (curr === 'EGP' || curr === 'AED') 
      ? (i18n.language === 'ar' ? currencyInfo.symbolAr : currencyInfo.symbol)
      : currencyInfo.symbol;
    const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
    
    return showSymbol ? `${formattedAmount} ${symbol}` : formattedAmount;
  };

  // Convert price between currencies (simplified rates)
  const convertPrice = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Simple conversion rates (in production, use real-time rates)
    const rates = {
      'EGP': { 'AED': 0.16, 'SAR': 0.15, 'USD': 0.032 },
      'AED': { 'EGP': 6.25, 'SAR': 0.94, 'USD': 0.27 },
      'SAR': { 'EGP': 6.67, 'AED': 1.06, 'USD': 0.27 },
      'USD': { 'EGP': 31.25, 'AED': 3.70, 'SAR': 3.70 }
    };
    
    const rate = rates[fromCurrency]?.[toCurrency] || 1;
    return amount * rate;
  };

  // Get Tabby-compatible currency (Tabby supports ONLY AED, SAR)
  const getTabbyCurrency = () => {
    const tabbySupportedCurrencies = ['AED', 'SAR'];
    if (tabbySupportedCurrencies.includes(currency)) {
      return currency;
    }
    // Return null for unsupported currencies (don't convert)
    return null;
  };

  // Get Tabby-compatible price
  const getTabbyPrice = (price) => {
    const tabbyCurrency = getTabbyCurrency();
    if (!tabbyCurrency) {
      return null; // Return null for unsupported currencies
    }
    if (currency === tabbyCurrency) {
      return price;
    }
    return convertPrice(price, currency, tabbyCurrency);
  };

  const value = {
    // State
    currency,
    isLoading,
    error,
    availableCurrencies,
    detectedCountry,
    isDetectedCurrency,
    userPreference,
    
    // Actions
    changeCurrency,
    
    // Utilities
    getCurrencyInfo,
    formatPrice,
    convertPrice,
    getTabbyCurrency,
    getTabbyPrice,
    
    // Computed values
    currencyInfo: getCurrencyInfo(),
    tabbyCurrency: getTabbyCurrency(),
    // ONLY AED and SAR support Tabby - EGP and USD do NOT
    isTabbySupported: currency === 'AED' || currency === 'SAR'
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};