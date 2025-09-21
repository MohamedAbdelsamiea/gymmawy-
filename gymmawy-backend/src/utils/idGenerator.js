/**
 * Utility functions for generating human-readable IDs
 * Consolidated from identifiers.js and idGenerator.js
 */

/**
 * Generate a human-readable order number
 * Format: ORD-YYYYMMDD-XXXXXX (e.g., ORD-20240907-123456)
 */
export function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Generate a human-readable payment number
 * Format: PAY-YYYYMMDD-XXXXXX (e.g., PAY-20240907-123456)
 */
export function generatePaymentNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `PAY-${year}${month}${day}-${random}`;
}

/**
 * Generate a human-readable subscription number
 * Format: SUB-YYYYMMDD-XXXXXX (e.g., SUB-20240907-123456)
 */
export function generateSubscriptionNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `SUB-${year}${month}${day}-${random}`;
}

/**
 * Generate a human-readable programme purchase number
 * Format: PROG-YYYYMMDD-XXXXXX (e.g., PROG-20240907-123456)
 */
export function generateProgrammePurchaseNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `PROG-${year}${month}${day}-${random}`;
}

/**
 * Generate a unique human-readable ID with retry logic
 * @param {Function} generator - The ID generation function
 * @param {Function} checkUnique - Function to check if ID is unique
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<string>} - Unique human-readable ID
 */
export async function generateUniqueId(generator, checkUnique, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const id = generator();
    const isUnique = await checkUnique(id);
    if (isUnique) {
      return id;
    }
  }
  throw new Error(`Failed to generate unique ID after ${maxRetries} attempts`);
}