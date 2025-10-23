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
  const [currency, setCurrency] = useState('USD'); // Default to USD for international users
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCurrencies] = useState(['EGP', 'AED', 'SAR', 'USD']);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [isDetectedCurrency, setIsDetectedCurrency] = useState(false);

  // Initialize currency detection
  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Always detect currency from location (no stored preferences)
        console.log('🔄 Starting currency auto-detection...');
            const detectedCountry = await countryDetectionService.detectCountry();
            setDetectedCountry(detectedCountry);
            
            // Map country codes to currencies
            const countryCurrencyMap = {
              'EG': 'EGP',
              'SA': 'SAR', 
              'AE': 'AED',
              'US': 'USD'
            };
            
            const detectedCurrency = countryCurrencyMap[detectedCountry?.countryCode] || 'USD';
            
            if (availableCurrencies.includes(detectedCurrency)) {
              setCurrency(detectedCurrency);
              setIsDetectedCurrency(true);
            } else {
              // Fallback to API detection
              try {
                console.log('🔄 Falling back to API currency detection...');
                const detectionResult = await currencyService.detectCurrency();
                
                if (detectionResult.success && availableCurrencies.includes(detectionResult.currency)) {
                  setCurrency(detectionResult.currency);
                  setIsDetectedCurrency(true);
                } else {
                  throw new Error('Invalid currency detected');
                }
              } catch (apiError) {
                console.warn('❌ API currency detection failed:', apiError.message);
                
                // Final fallback to USD
                setCurrency('USD');
                setIsDetectedCurrency(false);
                console.log('⚠️ Using fallback currency: USD');
              }
        }
      } catch (err) {
        console.error('Currency initialization error:', err);
        setError(err.message);
        setCurrency('USD'); // Final fallback
        setIsDetectedCurrency(false);
      } finally {
        setIsLoading(false);
      }
    };

        initializeCurrency();
  }, []);


  // Change currency - DISABLED: Only auto-detection is allowed
  const changeCurrency = async (newCurrency) => {
    console.warn('Manual currency change is disabled. Currency is auto-detected based on user location.');
    return false;
  };

  // Get currency info
  const getCurrencyInfo = (curr = currency) => {
    const currencyInfo = {
      'EGP': { code: 'EGP', symbol: 'EGP', symbolAr: 'ج.م', name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬' },
      'AED': { code: 'AED', symbol: 'AED', symbolAr: 'د.إ', name: 'UAE Dirham', country: 'UAE', flag: '🇦🇪' },
      'SAR': { 
        code: 'SAR', 
        symbol: '﷼', 
        symbolAr: '﷼', 
        symbolFallback: 'SAR',
        name: 'Saudi Riyal', 
        country: 'Saudi Arabia', 
        flag: '🇸🇦',
        useUnicode: true
      },
      'USD': { code: 'USD', symbol: '$', symbolAr: '$', name: 'US Dollar', country: 'United States', flag: '🇺🇸' }
    };
    
    return currencyInfo[curr] || currencyInfo['USD'];
  };

  // Format price with current currency
  const formatPrice = (amount, curr = currency, showSymbol = true) => {
    if (amount === 0 || amount === 'FREE' || amount === 'مجاني') {
      return i18n.language === 'ar' ? 'مجاني' : 'FREE';
    }

    const currencyInfo = getCurrencyInfo(curr);
    
    // Handle SAR symbol with fallback
    let symbol;
    if (curr === 'SAR') {
      // Use Unicode Rial Sign with CSS fallback support
      symbol = i18n.language === 'ar' ? currencyInfo.symbolAr : currencyInfo.symbol;
    } else if (curr === 'EGP' || curr === 'AED') {
      // Use language-specific symbols for EGP and AED
      symbol = i18n.language === 'ar' ? currencyInfo.symbolAr : currencyInfo.symbol;
    } else {
      // Default for USD and others
      symbol = currencyInfo.symbol;
    }
    
    const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
    
    return showSymbol ? `${formattedAmount} ${symbol}` : formattedAmount;
  };

  // Get SAR symbol component props for rendering
  const getSARSymbolProps = () => {
    return {
      symbol: '&#xFDFC;',
      fallback: 'SAR',
      className: 'sar-symbol'
    };
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
    
    // Actions
    changeCurrency,
    
    // Utilities
    getCurrencyInfo,
    formatPrice,
    convertPrice,
    getTabbyCurrency,
    getTabbyPrice,
    getSARSymbolProps,
    
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