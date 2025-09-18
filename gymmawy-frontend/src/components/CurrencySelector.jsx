import React, { useState } from 'react';
import { useCurrencyContext } from '../contexts/CurrencyContext.jsx';
import './CurrencySelector.css';

/**
 * Currency selector component
 */
const CurrencySelector = ({ className = '', showLabel = true, size = 'medium' }) => {
  const { 
    currency, 
    availableCurrencies, 
    changeCurrency, 
    isLoading, 
    error 
  } = useCurrencyContext();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = async (newCurrency) => {
    try {
      await changeCurrency(newCurrency);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change currency:', error);
    }
  };

  const currentCurrencyInfo = availableCurrencies.find(c => c.code === currency) || {
    code: currency,
    name: 'US Dollar',
    symbol: '$',
    country: 'United States',
    flag: '🇺🇸'
  };

  if (isLoading) {
    return (
      <div className={`currency-selector ${className} ${size}`}>
        {showLabel && <span className="currency-label">Currency:</span>}
        <div className="currency-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`currency-selector ${className} ${size}`}>
        {showLabel && <span className="currency-label">Currency:</span>}
        <div className="currency-error">Error loading currencies</div>
      </div>
    );
  }

  return (
    <div className={`currency-selector ${className} ${size}`}>
      {showLabel && <span className="currency-label">Currency:</span>}
      
      <div className="currency-dropdown">
        <button
          className="currency-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="currency-flag">{currentCurrencyInfo.flag}</span>
          <span className="currency-code">{currentCurrencyInfo.code}</span>
          <span className="currency-symbol">{currentCurrencyInfo.symbol}</span>
          <span className="currency-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="currency-menu" role="listbox">
            {availableCurrencies.map((curr) => (
              <button
                key={curr.code}
                className={`currency-option ${curr.code === currency ? 'selected' : ''}`}
                onClick={() => handleCurrencyChange(curr.code)}
                role="option"
                aria-selected={curr.code === currency}
              >
                <span className="currency-flag">{curr.flag}</span>
                <div className="currency-info">
                  <span className="currency-code">{curr.code}</span>
                  <span className="currency-name">{curr.name}</span>
                </div>
                <span className="currency-symbol">{curr.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencySelector;
