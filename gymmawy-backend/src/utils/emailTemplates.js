import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Load email template and replace placeholders
 * @param {string} templateName - Name of the template file (without .html)
 * @param {Object} variables - Variables to replace in template
 * @param {string} language - Language code ('en' or 'ar')
 * @returns {string} Rendered HTML template
 */
export function renderEmailTemplate(templateName, variables = {}, language = 'en') {
  try {
    // Determine template file based on language
    const templateFile = language === 'ar' 
      ? `${templateName}-ar.html` 
      : `${templateName}.html`;
    
    const templatePath = path.join(TEMPLATES_DIR, templateFile);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templateFile}`);
    }
    
    // Read template file
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = variables[key] || '';
      template = template.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return template;
  } catch (error) {
    console.error('Error rendering email template:', error);
    throw error;
  }
}

/**
 * Get email verification template
 * @param {Object} data - User data and verification link
 * @param {string} language - Language code
 * @returns {string} Rendered HTML
 */
export function getEmailVerificationTemplate(data, language = 'en') {
  const {
    firstName = 'User',
    email = '',
    verificationLink = '#'
  } = data;
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  return renderEmailTemplate('email-verification', {
    firstName,
    email,
    verificationLink,
    frontendUrl
  }, language);
}

/**
 * Get password reset template
 * @param {Object} data - User data and reset link
 * @param {string} language - Language code
 * @returns {string} Rendered HTML
 */
export function getPasswordResetTemplate(data, language = 'en') {
  const {
    firstName = 'User',
    email = '',
    resetLink = '#'
  } = data;
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  return renderEmailTemplate('password-reset', {
    firstName,
    email,
    resetLink,
    frontendUrl
  }, language);
}

/**
 * Get email change verification template
 * @param {Object} data - User data and verification link
 * @param {string} language - Language code
 * @returns {string} Rendered HTML
 */
export function getEmailChangeVerificationTemplate(data, language = 'en') {
  const {
    firstName = 'User',
    email = '',
    newEmail = '',
    verificationLink = '#'
  } = data;
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Use the email change verification template
  const template = renderEmailTemplate('email-change-verification', {
    firstName,
    email,
    newEmail,
    verificationLink,
    frontendUrl
  }, language);
  
  return template;
}

/**
 * Get available email templates
 * @returns {Array} List of available templates
 */
export function getAvailableTemplates() {
  try {
    const files = fs.readdirSync(TEMPLATES_DIR);
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
  } catch (error) {
    console.error('Error reading templates directory:', error);
    return [];
  }
}

/**
 * Validate template variables
 * @param {string} templateName - Template name
 * @param {Object} variables - Variables to validate
 * @returns {Object} Validation result
 */
export function validateTemplateVariables(templateName, variables) {
  const requiredVars = {
    'email-verification': ['firstName', 'email', 'verificationLink'],
    'password-reset': ['firstName', 'email', 'resetLink'],
    'email-change-verification': ['firstName', 'email', 'newEmail', 'verificationLink']
  };
  
  const required = requiredVars[templateName] || [];
  const missing = required.filter(key => !variables[key]);
  
  return {
    isValid: missing.length === 0,
    missing,
    required
  };
}
