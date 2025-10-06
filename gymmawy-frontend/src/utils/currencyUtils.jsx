import { DollarSign, Banknote, Coins } from 'lucide-react';

/**
 * Currency configuration with proper symbols and icons
 */
export const CURRENCY_CONFIG = {
  USD: {
    symbol: '$',
    symbolAr: '$',
    unicode: '\u0024', // $
    icon: DollarSign,
    position: 'prefix', // $ comes before number
    rtlPosition: 'suffix',
  },
  SAR: {
    symbol: 'SAR',
    symbolAr: 'ر.س',
    unicode: '\uFDFC', // ﷼ (proper SAR symbol)
    icon: Coins,
    position: 'suffix', // comes after number
    rtlPosition: 'prefix',
  },
  AED: {
    symbol: 'AED',
    symbolAr: 'د.إ',
    unicode: 'د.إ',
    icon: Coins,
    position: 'suffix',
    rtlPosition: 'prefix',
  },
  EGP: {
    symbol: 'LE',
    symbolAr: 'جم',
    unicode: 'LE',
    icon: Banknote,
    position: 'suffix',
    rtlPosition: 'prefix',
  },
};

/**
 * Get currency symbol based on language
 * @param {string} currency - Currency code (USD, SAR, AED, EGP)
 * @param {string} language - Language code ('ar' or 'en')
 * @param {boolean} useUnicode - Use unicode symbol instead of text (default: false)
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency, language = 'en', useUnicode = false) => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  
  if (useUnicode) {
    return config.unicode;
  }
  
  return language === 'ar' ? config.symbolAr : config.symbol;
};

/**
 * Get currency icon component
 * @param {string} currency - Currency code
 * @returns {Component} Lucide icon component
 */
export const getCurrencyIcon = (currency) => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  return config.icon;
};

/**
 * Format price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code
 * @param {string} language - Language code
 * @param {boolean} useUnicode - Use unicode symbol
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currency, language = 'en', useUnicode = false) => {
  const symbol = getCurrencySymbol(currency, language, useUnicode);
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  const formattedAmount = amount.toFixed(0);
  
  // Determine position based on language and currency
  const position = language === 'ar' ? config.rtlPosition : config.position;
  
  if (position === 'prefix') {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${symbol}`;
  }
};

/**
 * Currency symbol component with icon
 * @param {Object} props
 * @param {string} props.currency - Currency code
 * @param {string} props.className - Icon CSS classes
 * @param {number} props.size - Icon size (default: 16)
 * @returns {JSX.Element}
 */
export const CurrencyIcon = ({ currency, className = '', size = 16 }) => {
  const Icon = getCurrencyIcon(currency);
  return <Icon className={className} size={size} />;
};

export default {
  CURRENCY_CONFIG,
  getCurrencySymbol,
  getCurrencyIcon,
  formatPrice,
  CurrencyIcon,
};


