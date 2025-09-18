// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Enhanced email validation with detailed feedback
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'emailRequired' };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, error: 'emailFormat' };
  }
  
  return { isValid: true, error: null };
};

// Password validation
export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Enhanced password validation with detailed feedback
export const validatePassword = (password, firstName = '', lastName = '', email = '') => {
  if (!password) {
    return { isValid: false, error: 'passwordRequired' };
  }
  
  const errors = [];
  
  if (password.length < 8) {
    errors.push('passwordLength');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('passwordUppercase');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('passwordLowercase');
  }
  
  if (!/\d/.test(password)) {
    errors.push('passwordNumber');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('passwordSpecial');
  }
  
  // Check for common passwords
  const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('passwordCommon');
  }
  
  // Check for personal information
  const personalInfo = [firstName.toLowerCase(), lastName.toLowerCase(), email.split('@')[0].toLowerCase()].filter(Boolean);
  const containsPersonalInfo = personalInfo.some(info => 
    info.length > 2 && password.toLowerCase().includes(info),
  );
  
  if (containsPersonalInfo) {
    errors.push('passwordPersonalInfo');
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : null,
    allErrors: errors,
  };
};

// Phone number validation - accepts international formats
export const isValidPhone = (phone) => {
  // Remove all spaces and special characters except + at the beginning
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Accept formats: +1234567890, 0123456789 (with leading zero)
  const phoneRegex = /^(\+[1-9]\d{1,14}|0[1-9]\d{8,14})$/;
  return phoneRegex.test(cleanPhone);
};

// Enhanced phone validation with detailed feedback
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'phoneRequired' };
  }
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (!/^[\+]?[0-9]+$/.test(cleanPhone)) {
    return { isValid: false, error: 'phoneFormat' };
  }
  
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return { isValid: false, error: 'phoneLength' };
  }
  
  if (!isValidPhone(phone)) {
    return { isValid: false, error: 'phoneFormat' };
  }
  
  return { isValid: true, error: null };
};

// Name validation
export const isValidName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// Enhanced name validation with detailed feedback
export const validateName = (name, fieldName = 'name') => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: `${fieldName}Required` };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: `${fieldName}Length` };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName}Length` };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\u0600-\u06FF\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: `${fieldName}Invalid` };
  }
  
  return { isValid: true, error: null };
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

// Enhanced birth date validation with detailed feedback
export const validateBirthDate = (birthDate) => {
  if (!birthDate) {
    return { isValid: true, error: null }; // Birth date is optional
  }
  
  const date = new Date(birthDate);
  const today = new Date();
  
  if (!isValidDate(birthDate)) {
    return { isValid: false, error: 'birthDateInvalid' };
  }
  
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) 
    ? age - 1 
    : age;
  
  if (actualAge < 13) {
    return { isValid: false, error: 'birthDateTooYoung' };
  }
  
  if (actualAge > 120) {
    return { isValid: false, error: 'birthDateTooOld' };
  }
  
  return { isValid: true, error: null };
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
    errors,
  };
};
