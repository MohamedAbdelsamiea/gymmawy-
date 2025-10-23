// src/utils/languageUtils.js

/**
 * Extract the primary language code from a full locale string
 * @param {string} locale - Full locale string (e.g., 'en-US', 'ar-SA', 'en')
 * @returns {string} - Primary language code (e.g., 'en', 'ar')
 */
export function getPrimaryLanguage(locale) {
  if (!locale) return 'ar';
  return locale.split('-')[0];
}

/**
 * Check if the current language is Arabic
 * @param {string} locale - Full locale string from i18n.language
 * @returns {boolean} - True if the language is Arabic
 */
export function isArabic(locale) {
  return getPrimaryLanguage(locale) === 'ar';
}

/**
 * Check if the current language is English
 * @param {string} locale - Full locale string from i18n.language
 * @returns {boolean} - True if the language is English
 */
export function isEnglish(locale) {
  return getPrimaryLanguage(locale) === 'en';
}

/**
 * Get the language-specific asset path
 * @param {string} path - Asset path
 * @param {string} source - Source type ('lang' or 'common')
 * @param {string} locale - Full locale string from i18n.language
 * @returns {string} - Complete asset path
 */
export function getAssetPath(path, source = 'lang', locale) {
  const lang = getPrimaryLanguage(locale);
  
  if (source === 'common') {
    return `/assets/common/${path}`;
  } else {
    // Default is language-specific
    return `/assets/${lang}/${path}`;
  }
}
