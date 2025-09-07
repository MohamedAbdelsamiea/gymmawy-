// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation - accepts international formats
export const isValidPhone = (phone) => {
  // Remove all spaces and special characters except + at the beginning
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Accept formats: +1234567890, 0123456789 (with leading zero)
  const phoneRegex = /^(\+[1-9]\d{1,14}|0[1-9]\d{8,14})$/;
  return phoneRegex.test(cleanPhone);
};

// Name validation
export const isValidName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// Required field validation
export const isRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim().length > 0;
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Number validation
export const isValidNumber = (value) => {
  return !isNaN(value) && isFinite(value);
};

// Date validation
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// File size validation (in bytes)
export const isValidFileSize = (file, maxSize) => {
  return file && file.size <= maxSize;
};

// File type validation
export const isValidFileType = (file, allowedTypes) => {
  return file && allowedTypes.includes(file.type);
};

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber) => {
  const digits = cardNumber.replace(/\s/g, '').split('').map(Number);
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(field => {
    const value = formData[field];
    const rules = validationRules[field];

    if (rules.required && !isRequired(value)) {
      errors[field] = `${field} is required`;
    } else if (value && rules.email && !isValidEmail(value)) {
      errors[field] = 'Invalid email format';
    } else if (value && rules.password && !isValidPassword(value)) {
      errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    } else if (value && rules.phone && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number';
    } else if (value && rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    } else if (value && rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} must be less than ${rules.maxLength} characters`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
