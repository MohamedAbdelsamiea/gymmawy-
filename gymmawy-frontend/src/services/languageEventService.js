/**
 * Language Event Service
 * Provides a global event system for language changes
 * This helps Tabby components detect language changes more reliably
 */

class LanguageEventService {
  constructor() {
    this.listeners = new Set();
    this.currentLanguage = 'en';
  }

  /**
   * Subscribe to language change events
   * @param {Function} callback - Function to call when language changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of language change
   * @param {string} newLanguage - The new language code
   */
  notifyLanguageChange(newLanguage) {
    console.log('LanguageEventService: Language changed to', newLanguage);
    this.currentLanguage = newLanguage;
    
    // Force immediate DOM updates
    const isRTL = newLanguage === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
    
    // Update body classes for immediate styling
    if (isRTL) {
      document.body.classList.add('rtl-active');
      document.body.classList.remove('ltr-active');
    } else {
      document.body.classList.add('ltr-active');
      document.body.classList.remove('rtl-active');
    }
    
    // Trigger a custom event for additional components that might need it
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: newLanguage, isRTL }
    }));
    
    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(newLanguage);
      } catch (error) {
        console.error('Language change callback error:', error);
      }
    });
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Convert language code to Tabby format
   * @param {string} language - Language code
   * @returns {string} Tabby language code ('ar' or 'en')
   */
  getTabbyLanguage(language = this.currentLanguage) {
    return language === 'ar' || language?.startsWith('ar-') ? 'ar' : 'en';
  }
}

// Create singleton instance
const languageEventService = new LanguageEventService();

export default languageEventService;
