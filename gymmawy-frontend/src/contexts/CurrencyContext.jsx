import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCurrency } from '../hooks/useCurrency.js';

const CurrencyContext = createContext();

/**
 * Currency context provider
 */
export const CurrencyProvider = ({ children }) => {
  const currencyData = useCurrency();

  return (
    <CurrencyContext.Provider value={currencyData}>
      {children}
    </CurrencyContext.Provider>
  );
};

/**
 * Hook to use currency context
 */
export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext);
  
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  
  return context;
};

/**
 * Higher-order component to provide currency context
 */
export const withCurrency = (WrappedComponent) => {
  return function WithCurrencyComponent(props) {
    return (
      <CurrencyProvider>
        <WrappedComponent {...props} />
      </CurrencyProvider>
    );
  };
};

export default CurrencyContext;
