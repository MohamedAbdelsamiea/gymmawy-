/**
 * Country Detection Service
 * Handles country detection and validation for Tabby integration
 */

class CountryDetectionService {
  constructor() {
    this.supportedCountries = ['EG', 'AE', 'SA'];
    this.countryConfigs = {
      'EG': {
        name: 'Egypt',
        currency: 'EGP',
        tabbySupported: false,
        merchantCode: 'EG'
      },
      'AE': {
        name: 'United Arab Emirates',
        currency: 'AED',
        tabbySupported: true,
        merchantCode: 'AE'
      },
      'SA': {
        name: 'Saudi Arabia',
        currency: 'SAR',
        tabbySupported: true,
        merchantCode: 'SA'
      },
    };
  }

  /**
   * Detect user's country from various sources
   * @returns {string} Country code
   */
  detectCountry() {
    console.log('🔍 Country Detection Service - Starting detection...');
    
    // 1. Check localStorage first (user preference)
    const storedCountry = localStorage.getItem('user_country');
    console.log('  - Stored country preference:', storedCountry);
    if (storedCountry && this.isValidCountry(storedCountry)) {
      console.log('✅ Using stored country preference:', storedCountry);
      return storedCountry;
    }

    // 2. Check language preference
    const countryFromLang = this.getCountryFromLanguage();
    console.log('  - Country from language:', countryFromLang);
    if (countryFromLang) {
      console.log('✅ Using country from language:', countryFromLang);
      return countryFromLang;
    }

    // 3. Check timezone
    const countryFromTimezone = this.getCountryFromTimezone();
    console.log('  - Country from timezone:', countryFromTimezone);
    if (countryFromTimezone) {
      console.log('✅ Using country from timezone:', countryFromTimezone);
      return countryFromTimezone;
    }

    // 4. Default fallback
    console.log('⚠️ Using default country: EG (Egypt)');
    return 'EG'; // Default to Egypt
  }

  /**
   * Get country from browser language
   * @returns {string|null} Country code or null
   */
  getCountryFromLanguage() {
    const language = navigator.language || navigator.languages[0];
    
    // Arabic language typically indicates Middle East
    if (language.startsWith('ar')) {
      return 'EG'; // Default Arabic to Egypt
    }

    // English in specific locales
    const localeToCountry = {
      'en-AE': 'AE',
      'en-SA': 'SA',
      'en-KW': 'KW',
      'en-EG': 'EG'
    };

    return localeToCountry[language] || null;
  }

  /**
   * Get country from timezone
   * @returns {string|null} Country code or null
   */
  getCountryFromTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timezoneToCountry = {
      'Africa/Cairo': 'EG',
      'Asia/Dubai': 'AE',
      'Asia/Riyadh': 'SA'
    };

    return timezoneToCountry[timezone] || null;
  }

  /**
   * Validate if country code is valid
   * @param {string} countryCode - Country code to validate
   * @returns {boolean} Is valid country
   */
  isValidCountry(countryCode) {
    return this.supportedCountries.includes(countryCode?.toUpperCase());
  }

  /**
   * Check if Tabby is supported for the country
   * @param {string} countryCode - Country code
   * @returns {boolean} Is Tabby supported
   */
  isTabbySupported(countryCode) {
    const country = countryCode?.toUpperCase();
    return this.countryConfigs[country]?.tabbySupported || false;
  }

  /**
   * Get country configuration
   * @param {string} countryCode - Country code
   * @returns {object} Country configuration
   */
  getCountryConfig(countryCode) {
    const country = countryCode?.toUpperCase();
    return this.countryConfigs[country] || this.countryConfigs['EG'];
  }

  /**
   * Set user's preferred country
   * @param {string} countryCode - Country code
   * @returns {boolean} Success status
   */
  setUserCountry(countryCode) {
    if (this.isValidCountry(countryCode)) {
      localStorage.setItem('user_country', countryCode.toUpperCase());
      return true;
    }
    return false;
  }

  /**
   * Get user's preferred country
   * @returns {string} Country code
   */
  getUserCountry() {
    return localStorage.getItem('user_country') || this.detectCountry();
  }

  /**
   * Get all supported countries
   * @returns {Array} Array of country codes
   */
  getSupportedCountries() {
    return [...this.supportedCountries];
  }

  /**
   * Get countries where Tabby is supported
   * @returns {Array} Array of country codes where Tabby is supported
   */
  getTabbySupportedCountries() {
    return this.supportedCountries.filter(country => 
      this.countryConfigs[country]?.tabbySupported
    );
  }

  /**
   * Convert currency for Tabby display
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Converted amount
   */
  convertCurrencyForTabby(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Simple conversion rates (in production, use real-time rates)
    const rates = {
      'EGP': { 'AED': 0.16, 'SAR': 0.15 },
      'AED': { 'EGP': 6.25, 'SAR': 0.94 },
      'SAR': { 'EGP': 6.67, 'AED': 1.06 }
    };
    
    const rate = rates[fromCurrency]?.[toCurrency] || 1;
    return amount * rate;
  }

  /**
   * Get appropriate currency for Tabby display
   * @param {string} userCountry - User's country
   * @returns {string} Currency code for Tabby
   */
  getTabbyCurrency(userCountry) {
    const config = this.getCountryConfig(userCountry);
    return config.currency;
  }

  /**
   * Get merchant code for Tabby
   * @param {string} userCountry - User's country
   * @returns {string} Merchant code
   */
  getTabbyMerchantCode(userCountry) {
    const config = this.getCountryConfig(userCountry);
    return config.merchantCode;
  }
}

export default new CountryDetectionService();
