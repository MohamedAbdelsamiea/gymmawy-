import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useTabbyPromo from '../../hooks/useTabbyPromo';
import useLanguageEvents from '../../hooks/useLanguageEvents';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import './TabbyPromo.css';

const TabbyCartPromo = ({ 
  total, 
  currency = 'EGP', 
  className = '',
  country,
  onLoad = null,
  onError = null
}) => {
  const { i18n } = useTranslation();
  const { 
    isSupported, 
    currentCountry, 
    convertPriceForTabby, 
    formatPriceForTabby,
    getTabbyLanguage,
    getTabbyConfig
  } = useTabbyPromo();
  
  const { currency: appCurrency, getTabbyCurrency, getTabbyPrice, isTabbySupported } = useCurrencyContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(total);
  const scriptRef = useRef(null);
  const promoInstanceRef = useRef(null);

  // Simple language detection
  const getCurrentLanguage = () => {
    const lang = i18n.language || i18n.resolvedLanguage;
    return lang === 'ar' || lang?.startsWith('ar-') ? 'ar' : 'en';
  };

  // Tabby configuration
  const tabbyConfig = {
    publicKey: import.meta.env.VITE_TABBY_PUBLIC_KEY || 'pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361',
    merchantCode: import.meta.env.VITE_TABBY_MERCHANT_CODE || 'AE',
    merchantCodes: {
      'EG': 'EG',
      'AE': 'AE', 
      'SA': 'SA',
      'KW': 'KW',
    }
  };

  // Get the appropriate merchant code based on country
  const getMerchantCode = () => {
    const targetCountry = country || currentCountry;
    return tabbyConfig.merchantCodes[targetCountry] || tabbyConfig.merchantCode;
  };

  // Check if Tabby is supported for the given currency
  const isCurrencySupported = () => {
    return ['SAR', 'AED'].includes(currency);
  };

  // Check if price is within Tabby's supported range
  const isPriceSupported = (price) => {
    if (!price || price <= 0) return false;
    const minPrice = 50;
    const maxPrice = 50000;
    return price >= minPrice && price <= maxPrice;
  };

  // Get the display currency and price for Tabby
  const getTabbyCurrencyAndPrice = (price, fromCurrency) => {
    const supportedCurrencies = ['AED', 'SAR'];
    const targetCountry = country || currentCountry;
    const isActuallySupported = supportedCurrencies.includes(fromCurrency) || 
      (targetCountry && ['AE', 'SA'].includes(targetCountry));
    
    console.log('🔍 TabbyCartPromo - Currency Debug:', {
      fromCurrency: fromCurrency,
      targetCountry: targetCountry,
      isActuallySupported: isActuallySupported,
      isCurrencySupported: isCurrencySupported(),
      supportedCurrencies: supportedCurrencies
    });
    
    if (isActuallySupported && supportedCurrencies.includes(fromCurrency)) {
      return { currency: fromCurrency, price };
    }
    
    // Default to AED for other currencies
    const convertedPrice = convertPriceForTabby(price, fromCurrency, 'AED');
    return { currency: 'AED', price: convertedPrice };
  };

  // Initialize Tabby promo
  const initializeTabbyPromo = (price) => {
    if (!window.TabbyPromo) {
      const errorMsg = 'TabbyPromo not available';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate requirements - always show, but handle gracefully
    const targetCountry = country || currentCountry;
    const isActuallySupported = isSupported && ['AE', 'SA'].includes(targetCountry);
    if (!isActuallySupported) {
      console.log(`Tabby not natively supported for country: ${targetCountry}, using fallback`);
    }

    if (!isPriceSupported(price)) {
      const errorMsg = `Price ${price} not supported for Tabby`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      const { currency: displayCurrency, price: displayPrice } = getTabbyCurrencyAndPrice(price, currency);
      const formattedPrice = formatPriceForTabby(displayPrice, displayCurrency);
      
      const currentLang = getCurrentLanguage();
      console.log('TabbyCartPromo: Initializing with language:', currentLang);

      // Clear existing content
      const element = document.querySelector('#TabbyCartPromo');
      if (element) {
        element.innerHTML = '';
      }

      // Initialize Tabby promo
      promoInstanceRef.current = new window.TabbyPromo({
        selector: '#TabbyCartPromo',
        currency: displayCurrency,
        price: formattedPrice,
        lang: currentLang,
        source: 'cart',
        publicKey: tabbyConfig.publicKey,
        merchantCode: isActuallySupported ? getMerchantCode() : 'AE', // Use AE as fallback
        shouldInheritBg: false
      });

      setIsLoaded(true);
      setCurrentPrice(price);
      onLoad?.();
    } catch (error) {
      console.error('Tabby promo initialization error:', error);
      const errorMsg = `Failed to initialize Tabby promo: ${error.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // Load Tabby promo script
  useEffect(() => {
    const loadTabbyScript = () => {
      // Check if script is already loaded
      if (window.TabbyPromo) {
        initializeTabbyPromo(total);
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="tabby-promo.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => initializeTabbyPromo(total));
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://checkout.tabby.ai/tabby-promo.js';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeTabbyPromo(total);
      script.onerror = () => {
        const errorMsg = 'Failed to load Tabby promo script';
        setError(errorMsg);
        onError?.(errorMsg);
      };
      
      scriptRef.current = script;
      document.head.appendChild(script);
    };

    // Only load if we have valid data
    if (total && total > 0) {
      loadTabbyScript();
    }

    // Cleanup
    return () => {
      if (scriptRef.current) {
        scriptRef.current.removeEventListener('load', initializeTabbyPromo);
      }
    };
  }, []);

  // Update promo when total changes
  useEffect(() => {
    if (isLoaded && total !== currentPrice && window.TabbyPromo) {
      initializeTabbyPromo(total);
    }
  }, [total, isLoaded, currentPrice]);

  // Component will re-render completely when language changes due to key prop
  // No need for complex language change detection

  // Don't render if currency is not supported or price is not supported
  if (!isCurrencySupported() || !isPriceSupported(total)) {
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
      className={`tabby-promo-container ${className}`}
      style={{
        width: '100%',
        maxWidth: '100%',
        minHeight: '40px'
      }}
    >
      <div id="TabbyCartPromo" />
    </div>
  );
};

export default TabbyCartPromo;
