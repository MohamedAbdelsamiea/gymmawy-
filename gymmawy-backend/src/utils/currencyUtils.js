import { Currency } from '@prisma/client';

/**
 * Centralized currency detection utility
 * Maps country codes to appropriate currencies
 */
export function getCurrencyFromCountry(countryCode) {
  if (!countryCode) {
    return Currency.USD; // Default fallback
  }

  switch (countryCode.toUpperCase()) {
    case 'EG': return Currency.EGP;  // Egypt
    case 'SA': return Currency.SAR;  // Saudi Arabia
    case 'AE': return Currency.AED;  // UAE
    default: return Currency.USD;    // All other countries
  }
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency) {
  switch (currency) {
    case Currency.EGP: return 'ج.م';
    case Currency.SAR: return 'ر.س';
    case Currency.AED: return 'د.إ';
    case Currency.USD: return '$';
    case Currency.GYMMAWY_COINS: return '🪙';
    default: return '$';
  }
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode) {
  const countryMap = {
    'EG': 'Egypt',
    'SA': 'Saudi Arabia',
    'AE': 'UAE',
    'KW': 'Kuwait',
    'QA': 'Qatar',
    'BH': 'Bahrain',
    'OM': 'Oman',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'MA': 'Morocco',
    'TN': 'Tunisia',
    'DZ': 'Algeria',
    'LY': 'Libya',
    'SD': 'Sudan',
    'IQ': 'Iraq',
    'SY': 'Syria',
    'YE': 'Yemen',
    'PS': 'Palestine',
  };

  return countryMap[countryCode?.toUpperCase()] || 'Unknown';
}

/**
 * Validate if a currency is supported
 */
export function isValidCurrency(currency) {
  return Object.values(Currency).includes(currency);
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies() {
  return Object.values(Currency);
}

/**
 * Get currency info object with all details
 */
export function getCurrencyInfo(countryCode) {
  const currency = getCurrencyFromCountry(countryCode);
  const countryName = getCountryName(countryCode);
  
  return {
    countryCode: countryCode?.toUpperCase(),
    countryName,
    currency,
    currencySymbol: getCurrencySymbol(currency),
  };
}
