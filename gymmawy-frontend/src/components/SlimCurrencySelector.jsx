import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useCurrencyContext } from '../contexts/CurrencyContext.jsx';
import { ChevronUp } from 'lucide-react';

/**
 * Slim currency selector component - positioned in bottom corner like Shopify
 */
const SlimCurrencySelector = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { 
    currency, 
    availableCurrencies, 
    changeCurrency, 
    isLoading, 
    error,
    getCurrencyInfo
  } = useCurrencyContext();
  
  const [isOpen, setIsOpen] = useState(false);

  // Don't show on dashboard pages
  const isDashboard = location.pathname.startsWith('/dashboard');

  const handleCurrencyChange = async (newCurrency) => {
    try {
      await changeCurrency(newCurrency);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change currency:', error);
    }
  };

  const currentCurrencyInfo = getCurrencyInfo(currency);

  if (isLoading || error || isDashboard) {
    return null;
  }

  return (
    <>
      {/* Desktop version */}
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in duration-500 hidden sm:block">
        <div className="relative">
        {/* Main selector button */}
        <button
          className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900 hover:scale-105"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-lg">{currentCurrencyInfo.flag}</span>
          <span className="font-semibold">{currentCurrencyInfo.symbol}</span>
          <ChevronUp 
            className={`h-3 w-3 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'
            }`} 
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute bottom-full right-0 mb-3 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200">
              <div className="py-2">
                <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  {t('selectCurrency', 'Select Currency')}
                </div>
                {availableCurrencies.map((curr) => {
                  const currencyInfo = getCurrencyInfo(curr);
                  const isSelected = curr === currency;
                  
                  return (
                    <button
                      key={curr}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-all duration-200 ${
                        isSelected ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700'
                      }`}
                      onClick={() => handleCurrencyChange(curr)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="text-lg">{currencyInfo.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{currencyInfo.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{curr}</div>
                      </div>
                      <span className="font-semibold text-gray-600">
                        {currencyInfo.symbol}
                      </span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Mobile version */}
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in duration-500 block sm:hidden">
        <div className="relative">
          {/* Main selector button */}
          <button
            className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className="text-base">{currentCurrencyInfo.flag}</span>
            <span className="font-semibold">{currentCurrencyInfo.symbol}</span>
            <ChevronUp 
              className={`h-3 w-3 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'
              }`} 
            />
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute bottom-full right-0 mb-3 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200">
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    {t('currency', 'Currency')}
                  </div>
                  {availableCurrencies.map((curr) => {
                    const currencyInfo = getCurrencyInfo(curr);
                    const isSelected = curr === currency;
                    
                    return (
                      <button
                        key={curr}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-all duration-200 ${
                          isSelected ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700'
                        }`}
                        onClick={() => handleCurrencyChange(curr)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="text-base">{currencyInfo.flag}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-xs">{currencyInfo.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{curr}</div>
                        </div>
                        <span className="font-semibold text-gray-600 text-xs">
                          {currencyInfo.symbol}
                        </span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SlimCurrencySelector;
