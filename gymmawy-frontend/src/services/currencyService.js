/**
 * Currency detection and management service for frontend
 */

class CurrencyService {
  constructor() {
    this.currentCurrency = 'USD';
    this.currencyRates = {};
    // Default API URL - can be overridden by environment variable
    this.baseUrl = 'http://localhost:3000/api';
  }

  /**
   * Detect user's currency based on location
   */
  async detectCurrency() {
    try {
      const response = await fetch(`${this.baseUrl}/currency/detect`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to detect currency');
      }

      const data = await response.json();
      
      if (data.success) {
        this.currentCurrency = data.currency;
        this.saveCurrencyToStorage(data.currency);
        return data;
      }

      throw new Error(data.error?.message || 'Currency detection failed');
    } catch (error) {
      console.error('Currency detection error:', error);
      // Fallback to USD
      this.currentCurrency = 'USD';
      this.saveCurrencyToStorage('USD');
      return {
        success: false,
        currency: 'USD',
        error: error.message
      };
    }
  }

  /**
   * Get available currencies
   */
  async getAvailableCurrencies() {
    try {
      const response = await fetch(`${this.baseUrl}/currency/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch currencies');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      throw error;
    }
  }

  /**
   * Get currency exchange rates
   */
  async getCurrencyRates(baseCurrency = 'USD') {
    try {
      const response = await fetch(`${this.baseUrl}/currency/rates?base=${baseCurrency}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch currency rates');
      }

      const data = await response.json();
      
      if (data.success) {
        this.currencyRates = data.data.rates;
        return data.data;
      }

      throw new Error(data.error?.message || 'Failed to fetch rates');
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      throw error;
    }
  }

  /**
   * Update user's preferred currency
   */
  async updatePreferredCurrency(currency, token) {
    try {
      const response = await fetch(`${this.baseUrl}/currency/preferred`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currency }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferred currency');
      }

      const data = await response.json();
      
      if (data.success) {
        this.currentCurrency = currency;
        this.saveCurrencyToStorage(currency);
        return data;
      }

      throw new Error(data.error?.message || 'Failed to update currency');
    } catch (error) {
      console.error('Error updating preferred currency:', error);
      throw error;
    }
  }

  /**
   * Get prices for a specific currency
   */
  async getPrices(currency, purchasableType, purchasableId) {
    try {
      const params = new URLSearchParams({
        currency,
        ...(purchasableType && { purchasableType }),
        ...(purchasableId && { purchasableId }),
      });

      const response = await fetch(`${this.baseUrl}/currency/prices?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }

  /**
   * Convert price from one currency to another
   */
  convertPrice(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Use cached rates if available
    if (this.currencyRates[toCurrency]) {
      return amount * this.currencyRates[toCurrency];
    }

    // Fallback to basic conversion (you might want to implement this)
    console.warn('Currency rates not available, using fallback conversion');
    return amount;
  }

  /**
   * Format price with currency symbol
   */
  formatPrice(amount, currency = this.currentCurrency) {
    const currencyInfo = this.getCurrencyInfo(currency);
    return `${currencyInfo.symbol}${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Get currency information
   */
  getCurrencyInfo(currency) {
    const currencyMap = {
      'EGP': { name: 'Egyptian Pound', symbol: '£', country: 'Egypt', flag: '🇪🇬' },
      'SAR': { name: 'Saudi Riyal', symbol: 'ر.س', country: 'Saudi Arabia', flag: '🇸🇦' },
      'AED': { name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
      'USD': { name: 'US Dollar', symbol: '$', country: 'United States', flag: '🇺🇸' }
    };

    return currencyMap[currency] || currencyMap['USD'];
  }

  /**
   * Save currency to localStorage
   */
  saveCurrencyToStorage(currency) {
    try {
      localStorage.setItem('preferred_currency', currency);
    } catch (error) {
      console.error('Error saving currency to storage:', error);
    }
  }

  /**
   * Load currency from localStorage
   */
  loadCurrencyFromStorage() {
    try {
      const saved = localStorage.getItem('preferred_currency');
      if (saved && ['EGP', 'SAR', 'AED', 'USD'].includes(saved)) {
        this.currentCurrency = saved;
        return saved;
      }
    } catch (error) {
      console.error('Error loading currency from storage:', error);
    }
    return null;
  }

  /**
   * Initialize currency service
   */
  async initialize() {
    // Try to load from storage first
    const savedCurrency = this.loadCurrencyFromStorage();
    
    if (savedCurrency) {
      this.currentCurrency = savedCurrency;
    } else {
      // Detect currency from location
      await this.detectCurrency();
    }

    // Load currency rates
    try {
      await this.getCurrencyRates(this.currentCurrency);
    } catch (error) {
      console.warn('Failed to load currency rates:', error);
    }

    return this.currentCurrency;
  }

  /**
   * Get current currency
   */
  getCurrentCurrency() {
    return this.currentCurrency;
  }

  /**
   * Set base URL for API calls
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Set current currency
   */
  setCurrentCurrency(currency) {
    if (['EGP', 'SAR', 'AED', 'USD'].includes(currency)) {
      this.currentCurrency = currency;
      this.saveCurrencyToStorage(currency);
    } else {
      throw new Error('Invalid currency');
    }
  }
}

// Create singleton instance
const currencyService = new CurrencyService();

export default currencyService;
