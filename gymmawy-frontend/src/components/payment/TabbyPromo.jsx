import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import countryDetectionService from '../../services/countryDetectionService';
import useLanguageEvents from '../../hooks/useLanguageEvents';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import './TabbyPromo.css';

const TabbyPromo = ({ 
  price, 
  currency = 'EGP', 
  source = 'product', // 'product' or 'cart'
  selector = '#TabbyPromo',
  className = '',
  shouldInheritBg = false,
  country = 'EG',
  onLoad = null,
  onError = null
}) => {
  const { i18n } = useTranslation();
  const { currency: appCurrency, getTabbyCurrency, getTabbyPrice, isTabbySupported } = useCurrencyContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const scriptRef = useRef(null);
  const containerRef = useRef(null);

  // Simple language detection
  const getCurrentLanguage = () => {
    const lang = i18n.language || i18n.resolvedLanguage;
    return lang === 'ar' || lang?.startsWith('ar-') ? 'ar' : 'en';
  };

  // Tabby configuration based on environment
  const tabbyConfig = {
    // These should be moved to environment variables in production
    publicKey: import.meta.env.VITE_TABBY_PUBLIC_KEY || 'pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361',
    merchantCode: import.meta.env.VITE_TABBY_MERCHANT_CODE || 'AE', // Default to UAE
    // Country-specific merchant codes
    merchantCodes: {
      'EG': 'EG', // Egypt
      'AE': 'AE', // UAE
      'SA': 'SA', // Saudi Arabia
      'KW': 'KW', // Kuwait
    }
  };

  // Get the appropriate merchant code based on country
  const getMerchantCode = () => {
    return countryDetectionService.getTabbyMerchantCode(country);
  };

  // Check if Tabby is supported for the given currency
  const isCurrencySupported = () => {
    const currentCurrency = currency || appCurrency;
    const isSupported = ['SAR', 'AED'].includes(currentCurrency);
    
    console.log('🔍 TabbyPromo - isCurrencySupported Debug:', {
      currency: currency,
      appCurrency: appCurrency,
      currentCurrency: currentCurrency,
      isSupported: isSupported,
      supportedCurrencies: ['SAR', 'AED']
    });
    
    return isSupported;
  };

  // Check if price is within Tabby's supported range
  const isPriceSupported = () => {
    if (!price || price <= 0) return false;
    
    const currentCurrency = currency || appCurrency;
    
    // Tabby minimum prices vary by currency
    // SAR: 50 SAR minimum, AED: 50 AED minimum
    const minPrice = 50;
    const maxPrice = 50000;
    
    const isSupported = price >= minPrice && price <= maxPrice;
    
    console.log('🔍 TabbyPromo - Price Support Debug:', {
      price: price,
      currency: currentCurrency,
      minPrice: minPrice,
      maxPrice: maxPrice,
      isSupported: isSupported
    });
    
    return isSupported;
  };

  // Format price for Tabby (2 decimals for EGP/SAR/AED, 3 for KWD)
  const formatPriceForTabby = (price, currency) => {
    if (currency === 'KWD') {
      return price.toFixed(3);
    }
    return price.toFixed(2);
  };

  // Convert EGP to supported Tabby currencies if needed
  const convertCurrencyForTabby = (price, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return price;
    
    // Simple conversion rates (in production, these should come from a currency service)
    const rates = {
      'EGP': { 'AED': 0.16, 'SAR': 0.15, 'KWD': 0.01 },
      'AED': { 'EGP': 6.25, 'SAR': 0.94, 'KWD': 0.06 },
      'SAR': { 'EGP': 6.67, 'AED': 1.06, 'KWD': 0.06 },
      'KWD': { 'EGP': 111.11, 'AED': 17.78, 'SAR': 16.67 }
    };
    
    const rate = rates[fromCurrency]?.[toCurrency] || 1;
    return price * rate;
  };

  // Get the display currency and price for Tabby
  const getTabbyCurrencyAndPrice = () => {
    // Use the passed currency prop directly
    const currentCurrency = currency || appCurrency;
    const isActuallySupported = isTabbySupported;
    
    console.log('🔍 TabbyPromo - Currency Debug:', {
      passedCurrency: currency,
      appCurrency: appCurrency,
      currentCurrency: currentCurrency,
      isActuallySupported: isActuallySupported,
      isCurrencySupported: isCurrencySupported(),
      country: country
    });
    
    // If currency is supported (SAR or AED), use it directly regardless of country
    if (isCurrencySupported()) {
      return { currency: currentCurrency, price: price };
    } else {
      // This should not happen since we check isCurrencySupported() before rendering
      console.warn('TabbyPromo: Currency not supported but component is rendering');
      return { currency: 'AED', price: price };
    }
  };

  // Load Tabby promo script
  useEffect(() => {
    const loadTabbyScript = () => {
      // Check if script is already loaded
      if (window.TabbyPromo) {
        initializeTabbyPromo();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="tabby-promo.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', initializeTabbyPromo);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://checkout.tabby.ai/tabby-promo.js';
      script.async = true;
      script.defer = true;
      script.onload = initializeTabbyPromo;
      script.onerror = () => {
        const errorMsg = 'Failed to load Tabby promo script';
        setError(errorMsg);
        onError?.(errorMsg);
      };
      
      scriptRef.current = script;
      document.head.appendChild(script);
    };

    const initializeTabbyPromo = () => {
      if (!window.TabbyPromo) {
        const errorMsg = 'TabbyPromo not available';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Validate requirements - always show, but handle gracefully
      const isActuallySupported = isTabbySupported;
      if (!isActuallySupported) {
        console.log(`Tabby not natively supported for country: ${country}, using fallback`);
      }

      if (!isPriceSupported()) {
        const errorMsg = `Price ${price} not supported for Tabby`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      try {
        const { currency: displayCurrency, price: displayPrice } = getTabbyCurrencyAndPrice();
        const formattedPrice = formatPriceForTabby(displayPrice, displayCurrency);
        
        const currentLang = getCurrentLanguage();
        console.log('TabbyPromo: Initializing with language:', currentLang);

        // Initialize Tabby promo
        new window.TabbyPromo({
          selector: selector,
          currency: displayCurrency,
          price: formattedPrice,
          lang: currentLang,
          source: source,
          publicKey: tabbyConfig.publicKey,
          merchantCode: isActuallySupported ? getMerchantCode() : 'AE', // Use AE as fallback
          ...(shouldInheritBg && { shouldInheritBg: true })
        });

        setIsLoaded(true);
        onLoad?.();
      } catch (error) {
        console.error('Tabby promo initialization error:', error);
        const errorMsg = `Failed to initialize Tabby promo: ${error.message}`;
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    // Only load if we have valid data
    if (price && price > 0) {
      loadTabbyScript();
    }

    // Cleanup
    return () => {
      if (scriptRef.current) {
        scriptRef.current.removeEventListener('load', initializeTabbyPromo);
      }
    };
  }, [price, currency, source, selector, shouldInheritBg, country, i18n.language]);

  // Component will re-render completely when language changes due to key prop
  // No need for complex language change detection

  // Don't render if currency is not supported or price is not supported
  const currencySupported = isCurrencySupported();
  const priceSupported = isPriceSupported();
  
  console.log('🔍 TabbyPromo - Rendering Decision:', {
    currencySupported: currencySupported,
    priceSupported: priceSupported,
    willRender: currencySupported && priceSupported,
    currency: currency,
    price: price
  });
  
  if (!currencySupported || !priceSupported) {
    return null;
  }

  // Render error state
  if (error) {
    return (
      <div className={`tabby-promo-error ${className}`}>
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Tabby promo unavailable
        </div>
      </div>
    );
  }

  // Render loading state
  if (!isLoaded) {
    return (
      <div className={`tabby-promo-loading ${className}`}>
        <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded animate-pulse">
          Loading payment options...
        </div>
      </div>
    );
  }

  // Render the container div
  return (
    <div 
      ref={containerRef}
      className={`tabby-promo-container ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        minHeight: '40px'
      }}
    >
      <div id={selector.replace('#', '')} />
    </div>
  );
};

export default TabbyPromo;
