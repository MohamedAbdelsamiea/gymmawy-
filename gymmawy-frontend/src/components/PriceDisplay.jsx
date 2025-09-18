import React from 'react';
import { useCurrencyContext } from '../contexts/CurrencyContext.jsx';
import './PriceDisplay.css';

/**
 * Price display component with currency formatting
 */
const PriceDisplay = ({ 
  amount, 
  currency, 
  showSymbol = true, 
  showCode = false,
  className = '',
  size = 'medium',
  originalAmount,
  originalCurrency,
  showDiscount = false,
  discountPercentage
}) => {
  const { formatPrice, convertPrice, getCurrencyInfo } = useCurrencyContext();
  
  // Use provided currency or current context currency
  const displayCurrency = currency || getCurrencyInfo().code;
  const displayAmount = amount || 0;
  
  // Convert price if different currency
  const convertedAmount = currency && currency !== getCurrencyInfo().code 
    ? convertPrice(displayAmount, currency, getCurrencyInfo().code)
    : displayAmount;

  const currencyInfo = getCurrencyInfo(displayCurrency);
  
  const formatAmount = (amt) => {
    if (showSymbol) {
      return `${currencyInfo.symbol}${parseFloat(amt).toFixed(2)}`;
    }
    return parseFloat(amt).toFixed(2);
  };

  const formatWithCode = (amt) => {
    const formatted = formatAmount(amt);
    return showCode ? `${formatted} ${displayCurrency}` : formatted;
  };

  return (
    <div className={`price-display ${className} ${size}`}>
      {showDiscount && originalAmount && originalCurrency && (
        <div className="price-original">
          {formatWithCode(originalAmount)}
        </div>
      )}
      
      <div className="price-current">
        {formatWithCode(convertedAmount)}
        {showCode && !showSymbol && (
          <span className="price-currency-code">{displayCurrency}</span>
        )}
      </div>
      
      {showDiscount && discountPercentage && (
        <div className="price-discount">
          -{discountPercentage}%
        </div>
      )}
      
      {currency && currency !== getCurrencyInfo().code && (
        <div className="price-conversion-note">
          Converted from {currencyInfo.symbol}{displayAmount.toFixed(2)}
        </div>
      )}
    </div>
  );
};

/**
 * Price range component for showing min-max prices
 */
export const PriceRange = ({ 
  minAmount, 
  maxAmount, 
  currency,
  className = '',
  size = 'medium'
}) => {
  const { formatPrice, getCurrencyInfo } = useCurrencyContext();
  
  const displayCurrency = currency || getCurrencyInfo().code;
  const currencyInfo = getCurrencyInfo(displayCurrency);
  
  if (minAmount === maxAmount) {
    return (
      <PriceDisplay 
        amount={minAmount} 
        currency={currency}
        className={className}
        size={size}
      />
    );
  }
  
  return (
    <div className={`price-range ${className} ${size}`}>
      <span className="price-min">
        {currencyInfo.symbol}{parseFloat(minAmount).toFixed(2)}
      </span>
      <span className="price-separator">-</span>
      <span className="price-max">
        {currencyInfo.symbol}{parseFloat(maxAmount).toFixed(2)}
      </span>
      {currency && (
        <span className="price-currency-code">{displayCurrency}</span>
      )}
    </div>
  );
};

/**
 * Subscription price component with period
 */
export const SubscriptionPrice = ({ 
  amount, 
  currency,
  period = 'month',
  className = '',
  size = 'medium'
}) => {
  const { formatPrice, getCurrencyInfo } = useCurrencyContext();
  
  const displayCurrency = currency || getCurrencyInfo().code;
  const currencyInfo = getCurrencyInfo(displayCurrency);
  
  return (
    <div className={`subscription-price ${className} ${size}`}>
      <span className="price-amount">
        {currencyInfo.symbol}{parseFloat(amount).toFixed(2)}
      </span>
      <span className="price-period">/{period}</span>
      {currency && (
        <span className="price-currency-code">{displayCurrency}</span>
      )}
    </div>
  );
};

export default PriceDisplay;
