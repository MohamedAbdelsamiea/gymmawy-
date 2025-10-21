/**
 * Utility functions for order item calculations
 */

/**
 * Calculate the total price for an order item
 * @param {Object} item - Order item object with price, quantity, and discountPercentage
 * @param {Object} order - Optional order object to check currency
 * @returns {number} - Calculated total price
 */
function calculateOrderItemTotalPrice(item, order = null) {
  if (!item) return 0;
  
  const price = parseFloat(item.price) || 0;
  const quantity = item.quantity || 1;
  const discountPercentage = item.discountPercentage || 0;
  
  // For GYMMAWY_COINS currency, no discounts apply (already set to 0 in rewards)
  if (order && order.currency === 'GYMMAWY_COINS') {
    return price * quantity;
  }
  
  // Calculate total price: price * quantity * (1 - discountPercentage / 100)
  const totalPrice = price * quantity * (1 - discountPercentage / 100);
  
  // Ensure total price is not negative
  return Math.max(0, totalPrice);
}

/**
 * Get order item with calculated total price
 * @param {Object} item - Order item object
 * @param {Object} order - Optional order object to check currency
 * @returns {Object} - Order item object with calculated totalPrice property
 */
function getOrderItemWithCalculatedTotal(item, order = null) {
  if (!item) return null;
  
  return {
    ...item,
    totalPrice: calculateOrderItemTotalPrice(item, order)
  };
}

/**
 * Get order items with calculated total prices
 * @param {Array} items - Array of order item objects
 * @param {Object} order - Optional order object to check currency
 * @returns {Array} - Array of order item objects with calculated totalPrice properties
 */
function getOrderItemsWithCalculatedTotals(items, order = null) {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => getOrderItemWithCalculatedTotal(item, order));
}

/**
 * Calculate total price for multiple order items
 * @param {Array} items - Array of order item objects
 * @returns {number} - Sum of all calculated total prices
 */
function calculateTotalPriceForOrderItems(items) {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => {
    return sum + calculateOrderItemTotalPrice(item);
  }, 0);
}

module.exports = {
  calculateOrderItemTotalPrice,
  getOrderItemWithCalculatedTotal,
  getOrderItemsWithCalculatedTotals,
  calculateTotalPriceForOrderItems
};
