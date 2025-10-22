/**
 * Utility functions for order calculations
 */

/**
 * Calculate the total amount for an order
 * @param {Object} order - Order object with price, discountPercentage, and couponDiscount
 * @returns {number} - Calculated total amount
 */
function calculateTotalAmount(order) {
  if (!order) return 0;
  
  const price = parseFloat(order.price) || 0;
  const discountPercentage = order.discountPercentage || 0;
  const couponDiscount = parseFloat(order.couponDiscount) || 0;
  
  // Calculate percentage discount
  const percentageDiscount = (price * discountPercentage) / 100;
  
  // Calculate total amount: price - percentage discount - coupon discount
  const totalAmount = price - percentageDiscount - couponDiscount;
  
  // Ensure total amount is not negative
  return Math.max(0, totalAmount);
}

/**
 * Calculate total amount for multiple orders
 * @param {Array} orders - Array of order objects
 * @returns {number} - Sum of all calculated total amounts
 */
function calculateTotalAmountForOrders(orders) {
  if (!Array.isArray(orders)) return 0;
  
  return orders.reduce((sum, order) => {
    return sum + calculateTotalAmount(order);
  }, 0);
}

/**
 * Get order with calculated total amount
 * @param {Object} order - Order object
 * @returns {Object} - Order object with calculated totalAmount property
 */
function getOrderWithCalculatedTotal(order) {
  if (!order) return null;
  
  return {
    ...order,
    totalAmount: calculateTotalAmount(order)
  };
}

/**
 * Get orders with calculated total amounts
 * @param {Array} orders - Array of order objects
 * @returns {Array} - Array of order objects with calculated totalAmount properties
 */
function getOrdersWithCalculatedTotals(orders) {
  if (!Array.isArray(orders)) return [];
  
  return orders.map(order => getOrderWithCalculatedTotal(order));
}

export {
  calculateTotalAmount,
  calculateTotalAmountForOrders,
  getOrderWithCalculatedTotal,
  getOrdersWithCalculatedTotals
};
