/**
 * Utility functions for handling API errors and validation messages
 */

/**
 * Extract validation errors from API response
 * @param {Object} errorResponse - The error response from API
 * @returns {Array} Array of validation error objects
 */
export function getValidationErrors(errorResponse) {
  // Try different possible structures
  if (errorResponse?.error?.validationErrors) {
    return errorResponse.error.validationErrors;
  }
  
  if (errorResponse?.validationErrors) {
    return errorResponse.validationErrors;
  }
  
  if (errorResponse?.response?.data?.error?.validationErrors) {
    return errorResponse.response.data.error.validationErrors;
  }
  
  return [];
}

/**
 * Format validation errors for display
 * @param {Array} validationErrors - Array of validation error objects
 * @returns {Array} Array of formatted error messages
 */
export function formatValidationErrors(validationErrors) {
  return validationErrors.map(error => ({
    field: error.field,
    message: error.message,
    code: error.code,
  }));
}

/**
 * Get field-specific error message
 * @param {Array} validationErrors - Array of validation error objects
 * @param {string} fieldName - The field name to get error for
 * @returns {string|null} Error message for the field or null
 */
export function getFieldError(validationErrors, fieldName) {
  const fieldError = validationErrors.find(error => error.field === fieldName);
  return fieldError ? fieldError.message : null;
}

/**
 * Check if there are any validation errors
 * @param {Object} errorResponse - The error response from API
 * @returns {boolean} True if there are validation errors
 */
export function hasValidationErrors(errorResponse) {
  return getValidationErrors(errorResponse).length > 0;
}

/**
 * Get general error message from API response
 * @param {Object} errorResponse - The error response from API
 * @returns {string} General error message
 */
export function getGeneralErrorMessage(errorResponse) {
  if (errorResponse?.error?.message) {
    return errorResponse.error.message;
  }
  return 'An unexpected error occurred';
}
