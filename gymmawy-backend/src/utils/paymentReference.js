import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

/**
 * Payment Reference Generator
 * 
 * This module handles payment-specific reference generation with unique requirements:
 * - Database uniqueness checking (unlike entity IDs which use retry logic)
 * - Timestamp-based format for support tracking
 * - Validation and extraction utilities for customer service
 * 
 * Note: Entity IDs (orders, subscriptions, programmes) are handled by idGenerator.js
 * which uses date-based format and retry-based uniqueness checking.
 */
export async function generateUserFriendlyPaymentReference() {
  let attempts = 0;
  const maxAttempts = 5;
  
  do {
    attempts++;
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9).toUpperCase();
    const paymentReference = `PAY-${timestamp}-${randomSuffix}`;
    
    // Check if this payment reference already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentReference }
    });
    
    if (!existingPayment) {
      return paymentReference;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique payment reference after multiple attempts");
    }
  } while (attempts < maxAttempts);
}

/**
 * Validate payment reference format
 * @param {string} reference - Payment reference to validate
 * @returns {boolean} - Whether the reference is in correct format
 */
export function isValidPaymentReference(reference) {
  const pattern = /^PAY-\d{13}-[A-Z0-9]{9}$/;
  return pattern.test(reference);
}

/**
 * Extract timestamp from payment reference
 * @param {string} reference - Payment reference
 * @returns {Date|null} - Creation timestamp or null if invalid
 */
export function getPaymentReferenceTimestamp(reference) {
  if (!isValidPaymentReference(reference)) {
    return null;
  }
  
  const timestampStr = reference.split('-')[1];
  const timestamp = parseInt(timestampStr);
  
  if (isNaN(timestamp)) {
    return null;
  }
  
  return new Date(timestamp);
}
