import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import { X, Check, ChevronDown } from 'lucide-react';

const CurrencyDetectionBanner = () => {
  const { t, i18n } = useTranslation(['currency', 'common']);
  
  // Debug currency namespace loading
  useEffect(() => {
    console.log('🔍 Currency Banner - Language:', i18n.language);
    console.log('🔍 Currency Banner - Has currency bundle:', i18n.hasResourceBundle(i18n.language, 'currency'));
  }, [i18n, i18n.language]);
  const { 
    currency, 
    changeCurrency, 
    getCurrencyInfo, 
    detectedCountry,
    isDetectedCurrency,
    availableCurrencies
  } = useCurrencyContext();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Show banner if:
    // 1. Currency was auto-detected (not user preference)
    // 2. User hasn't dismissed it before
    // 3. We have country detection info
    const hasStoredPreference = localStorage.getItem('userCurrencyPreference');
    const hasBeenDismissed = localStorage.getItem('currencyBannerDismissed');
    
    // For testing: always show the banner
    setIsVisible(true);
    
    // Original logic (commented out for testing):
    // if (!hasStoredPreference && !hasBeenDismissed && isDetectedCurrency && detectedCountry) {
    //   setIsVisible(true);
    // }
  }, [isDetectedCurrency, detectedCountry]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.currency-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleAccept = () => {
    // Store user's acceptance of detected currency
    localStorage.setItem('userCurrencyPreference', currency);
    localStorage.setItem('currencyBannerDismissed', 'true');
    setIsVisible(false);
  };


  const handleCurrencySelect = async (selectedCurrency) => {
    // Change currency
    await changeCurrency(selectedCurrency);
    
    // Store preference
    localStorage.setItem('userCurrencyPreference', selectedCurrency);
    localStorage.setItem('currencyBannerDismissed', 'true');
    
    setShowDropdown(false);
    setIsVisible(false);
  };


  const handleDismiss = () => {
    localStorage.setItem('currencyBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const currencyInfo = getCurrencyInfo(currency);
  const countryName = detectedCountry?.name || detectedCountry?.code || 'Unknown';
  const currencies = availableCurrencies || ['EGP', 'SAR', 'AED', 'USD'];
  
  // Check if there's a mismatch between detected country and currency
  const isMismatch = detectedCountry && detectedCountry.currency !== currency;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-right duration-300">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {t('currency.detectedTitle', 'Currency Detected')}
            </h4>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="mt-1 text-sm text-gray-600">
              {isDetectedCurrency ? 
                t('currency.detectedMessage', { 
                  country: countryName,
                  code: currency
                }) :
                isMismatch ? 
                  `Currency: ${currency} (${currencyInfo.name}) - Detected country: ${countryName} (${detectedCountry.currency})` :
                  `Current currency: ${currency} (${currencyInfo.name}) - ${currencyInfo.country}`
              }
            </p>
            
            {/* Currency Dropdown */}
            <div className="mt-3 relative currency-dropdown">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Currency:
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>{currency} - {currencyInfo.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {currencies.map((curr) => {
                      const currInfo = getCurrencyInfo(curr);
                      return (
                        <button
                          key={curr}
                          onClick={() => handleCurrencySelect(curr)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            curr === currency ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {curr} - {currInfo.name} ({currInfo.country})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleAccept}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Check className="h-3 w-3 mr-1" />
                {t('currency.keep', 'Keep')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyDetectionBanner;
