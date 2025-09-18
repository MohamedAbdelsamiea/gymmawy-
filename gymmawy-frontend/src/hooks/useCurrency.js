import { useState, useEffect, useCallback } from 'react';
import currencyService from '../services/currencyService.js';

/**
 * Custom hook for currency management
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [rates, setRates] = useState({});

  /**
   * Initialize currency detection
   */
  const initializeCurrency = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Detect currency
      const detectionResult = await currencyService.detectCurrency();
      
      if (detectionResult.success) {
        setCurrency(detectionResult.currency);
      } else {
        console.warn('Currency detection failed:', detectionResult.error);
      }

      // Load available currencies
      try {
        const currenciesResult = await currencyService.getAvailableCurrencies();
        if (currenciesResult.success) {
          setAvailableCurrencies(currenciesResult.data);
        }
      } catch (err) {
        console.warn('Failed to load available currencies:', err);
      }

      // Load currency rates
      try {
        const ratesResult = await currencyService.getCurrencyRates(currency);
        if (ratesResult.rates) {
          setRates(ratesResult.rates);
        }
      } catch (err) {
        console.warn('Failed to load currency rates:', err);
      }

    } catch (err) {
      setError(err.message);
      console.error('Currency initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  /**
   * Change currency
   */
  const changeCurrency = useCallback(async (newCurrency) => {
    try {
      setError(null);
      
      // Update currency service
      currencyService.setCurrentCurrency(newCurrency);
      setCurrency(newCurrency);

      // Load new rates
      try {
        const ratesResult = await currencyService.getCurrencyRates(newCurrency);
        if (ratesResult.rates) {
          setRates(ratesResult.rates);
        }
      } catch (err) {
        console.warn('Failed to load new currency rates:', err);
      }

      // Update user preference if authenticated
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await currencyService.updatePreferredCurrency(newCurrency, token);
        } catch (err) {
          console.warn('Failed to update preferred currency:', err);
        }
      }

    } catch (err) {
      setError(err.message);
      console.error('Currency change error:', err);
    }
  }, []);

  /**
   * Format price with current currency
   */
  const formatPrice = useCallback((amount) => {
    return currencyService.formatPrice(amount, currency);
  }, [currency]);

  /**
   * Convert price between currencies
   */
  const convertPrice = useCallback((amount, fromCurrency, toCurrency) => {
    return currencyService.convertPrice(amount, fromCurrency, toCurrency);
  }, []);

  /**
   * Get currency info
   */
  const getCurrencyInfo = useCallback((curr = currency) => {
    return currencyService.getCurrencyInfo(curr);
  }, [currency]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeCurrency();
  }, [initializeCurrency]);

  return {
    currency,
    isLoading,
    error,
    availableCurrencies,
    rates,
    changeCurrency,
    formatPrice,
    convertPrice,
    getCurrencyInfo,
    initializeCurrency
  };
};

/**
 * Hook for currency detection only (without state management)
 */
export const useCurrencyDetection = () => {
  const [detectionResult, setDetectionResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectCurrency = useCallback(async () => {
    try {
      setIsDetecting(true);
      const result = await currencyService.detectCurrency();
      setDetectionResult(result);
      return result;
    } catch (error) {
      console.error('Currency detection error:', error);
      setDetectionResult({ success: false, error: error.message });
      return { success: false, error: error.message };
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return {
    detectionResult,
    isDetecting,
    detectCurrency
  };
};

export default useCurrency;
