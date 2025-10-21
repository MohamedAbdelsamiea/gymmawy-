import { useState, useEffect, useCallback, useRef } from 'react';
import { saveFormData, loadFormData, clearFormData, hasValidFormData } from '../utils/formPersistence';

/**
 * React hook for form data persistence
 * @param {string} formKey - Unique key for the form
 * @param {Object} options - Configuration options
 * @returns {Object} Hook utilities and state
 */
export const useFormPersistence = (formKey, options = {}) => {
  const {
    autoSave = true,
    autoSaveDelay = 1000, // milliseconds
    excludeFields = ['password', 'confirmPassword', 'paymentProof'],
    clearOnSubmit = true,
    expiryHours = 24,
    restoreOnMount = true
  } = options;

  const [hasStoredData, setHasStoredData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);

  // Check if there's valid stored data on mount
  useEffect(() => {
    if (restoreOnMount) {
      setIsLoading(true);
      const hasData = hasValidFormData(formKey);
      setHasStoredData(hasData);
      setIsLoading(false);
    }
  }, [formKey, restoreOnMount]);

  // Auto-save function with debouncing
  const debouncedSave = useCallback((formData) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        const saved = saveFormData(formKey, formData, {
          excludeFields,
          expiryHours
        });
        if (saved) {
          setLastSaved(new Date());
          setHasStoredData(true);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveDelay);
  }, [formKey, excludeFields, expiryHours, autoSaveDelay]);

  // Manual save function
  const saveData = useCallback((formData) => {
    try {
      const saved = saveFormData(formKey, formData, {
        excludeFields,
        expiryHours
      });
      if (saved) {
        setLastSaved(new Date());
        setHasStoredData(true);
      }
      return saved;
    } catch (error) {
      console.error('Manual save failed:', error);
      return false;
    }
  }, [formKey, excludeFields, expiryHours]);

  // Load stored data
  const loadData = useCallback((clearAfterLoad = false) => {
    try {
      setIsLoading(true);
      const data = loadFormData(formKey, { clearOnLoad: clearAfterLoad });
      if (data) {
        setHasStoredData(!clearAfterLoad);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Load data failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [formKey]);

  // Clear stored data
  const clearData = useCallback(() => {
    try {
      const cleared = clearFormData(formKey);
      if (cleared) {
        setHasStoredData(false);
        setLastSaved(null);
      }
      return cleared;
    } catch (error) {
      console.error('Clear data failed:', error);
      return false;
    }
  }, [formKey]);

  // Handle form submission - optionally clear data
  const handleSubmit = useCallback((submitFunction) => {
    return async (...args) => {
      try {
        const result = await submitFunction(...args);
        
        // Clear data after successful submission if configured
        if (clearOnSubmit && result) {
          clearData();
        }
        
        return result;
      } catch (error) {
        // Don't clear data on submission error
        throw error;
      }
    };
  }, [clearOnSubmit, clearData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    hasStoredData,
    isLoading,
    lastSaved,
    
    // Actions
    saveData,
    loadData,
    clearData,
    debouncedSave,
    handleSubmit,
    
    // Configuration
    autoSave,
    autoSaveDelay,
    excludeFields,
    clearOnSubmit,
    expiryHours
  };
};

export default useFormPersistence;
