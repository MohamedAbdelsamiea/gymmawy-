/**
 * Form Data Persistence Utility
 * Provides functions to save and restore form data to/from localStorage
 */

/**
 * Save form data to localStorage
 * @param {string} formKey - Unique key for the form (e.g., 'signup', 'checkout')
 * @param {Object} formData - Form data to save
 * @param {Object} options - Additional options
 * @param {number} options.expiryHours - Hours after which data expires (default: 24)
 * @param {Array} options.excludeFields - Fields to exclude from saving (e.g., ['password'])
 */
export const saveFormData = (formKey, formData, options = {}) => {
  try {
    const {
      expiryHours = 24,
      excludeFields = []
    } = options;

    // Filter out sensitive fields
    const filteredData = { ...formData };
    excludeFields.forEach(field => {
      delete filteredData[field];
    });

    // Create data object with timestamp
    const dataToSave = {
      data: filteredData,
      timestamp: new Date().toISOString(),
      expiryHours
    };

    localStorage.setItem(`form_${formKey}`, JSON.stringify(dataToSave));
    console.log(`Form data saved for ${formKey}:`, filteredData);
    return true;
  } catch (error) {
    console.error(`Failed to save form data for ${formKey}:`, error);
    return false;
  }
};

/**
 * Load form data from localStorage
 * @param {string} formKey - Unique key for the form
 * @param {Object} options - Additional options
 * @param {boolean} options.clearOnLoad - Whether to clear data after loading (default: false)
 * @returns {Object|null} Form data or null if not found/expired
 */
export const loadFormData = (formKey, options = {}) => {
  try {
    const { clearOnLoad = false } = options;
    const stored = localStorage.getItem(`form_${formKey}`);
    
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    const { data, timestamp, expiryHours } = parsed;

    // Check if data has expired
    const savedTime = new Date(timestamp);
    const now = new Date();
    const hoursSinceSaved = (now - savedTime) / (1000 * 60 * 60);

    if (hoursSinceSaved > expiryHours) {
      console.log(`Form data for ${formKey} has expired, removing...`);
      clearFormData(formKey);
      return null;
    }

    // Clear data if requested
    if (clearOnLoad) {
      clearFormData(formKey);
    }

    console.log(`Form data loaded for ${formKey}:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to load form data for ${formKey}:`, error);
    clearFormData(formKey); // Clear corrupted data
    return null;
  }
};

/**
 * Clear form data from localStorage
 * @param {string} formKey - Unique key for the form
 */
export const clearFormData = (formKey) => {
  try {
    localStorage.removeItem(`form_${formKey}`);
    console.log(`Form data cleared for ${formKey}`);
    return true;
  } catch (error) {
    console.error(`Failed to clear form data for ${formKey}:`, error);
    return false;
  }
};

/**
 * Check if form data exists and is not expired
 * @param {string} formKey - Unique key for the form
 * @returns {boolean} True if valid data exists
 */
export const hasValidFormData = (formKey) => {
  try {
    const stored = localStorage.getItem(`form_${formKey}`);
    if (!stored) return false;

    const parsed = JSON.parse(stored);
    const { timestamp, expiryHours } = parsed;

    const savedTime = new Date(timestamp);
    const now = new Date();
    const hoursSinceSaved = (now - savedTime) / (1000 * 60 * 60);

    return hoursSinceSaved <= expiryHours;
  } catch (error) {
    console.error(`Failed to check form data for ${formKey}:`, error);
    return false;
  }
};

/**
 * Get form data info (timestamp, expiry status)
 * @param {string} formKey - Unique key for the form
 * @returns {Object|null} Form data info or null if not found
 */
export const getFormDataInfo = (formKey) => {
  try {
    const stored = localStorage.getItem(`form_${formKey}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const { timestamp, expiryHours } = parsed;

    const savedTime = new Date(timestamp);
    const now = new Date();
    const hoursSinceSaved = (now - savedTime) / (1000 * 60 * 60);
    const isExpired = hoursSinceSaved > expiryHours;

    return {
      timestamp: savedTime,
      expiryHours,
      hoursSinceSaved: Math.round(hoursSinceSaved * 100) / 100,
      isExpired,
      timeRemaining: Math.max(0, expiryHours - hoursSinceSaved)
    };
  } catch (error) {
    console.error(`Failed to get form data info for ${formKey}:`, error);
    return null;
  }
};

/**
 * Hook for React components to use form persistence
 * @param {string} formKey - Unique key for the form
 * @param {Object} options - Options for the hook
 * @returns {Object} Hook utilities
 */
export const useFormPersistence = (formKey, options = {}) => {
  const {
    autoSave = true,
    autoSaveDelay = 1000, // milliseconds
    excludeFields = [],
    clearOnSubmit = true
  } = options;

  const saveData = (formData) => {
    return saveFormData(formKey, formData, { excludeFields });
  };

  const loadData = (clearOnLoad = false) => {
    return loadFormData(formKey, { clearOnLoad });
  };

  const clearData = () => {
    return clearFormData(formKey);
  };

  const hasData = () => {
    return hasValidFormData(formKey);
  };

  const getInfo = () => {
    return getFormDataInfo(formKey);
  };

  return {
    saveData,
    loadData,
    clearData,
    hasData,
    getInfo,
    autoSave,
    autoSaveDelay,
    clearOnSubmit
  };
};

export default {
  saveFormData,
  loadFormData,
  clearFormData,
  hasValidFormData,
  getFormDataInfo,
  useFormPersistence
};
