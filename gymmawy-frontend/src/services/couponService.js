import apiClient from './apiClient';

class CouponService {
  constructor() {
    this.baseURL = '/coupons';
  }

  // Apply coupon to cart/order
  async applyCoupon(code) {
    try {
      const response = await apiClient.post(`${this.baseURL}/apply`, { code });
      return response;
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  // Redeem coupon
  async redeemCoupon(code) {
    try {
      const response = await apiClient.post(`${this.baseURL}/redeem/${code}`);
      return response;
    } catch (error) {
      console.error('Error redeeming coupon:', error);
      throw error;
    }
  }

  // Get user's redeemed coupons
  async getMyCoupons() {
    try {
      const response = await apiClient.get(`${this.baseURL}/my-coupons`);
      return response;
    } catch (error) {
      console.error('Error fetching user coupons:', error);
      throw error;
    }
  }

  // Admin: Create coupon
  async createCoupon(couponData) {
    try {
      const response = await apiClient.post(`${this.baseURL}`, couponData);
      return response;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }

  // Admin: Get all coupons
  async getCoupons(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`${this.baseURL}?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  // Admin: Get coupon by ID
  async getCouponById(id) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching coupon:', error);
      throw error;
    }
  }

  // Admin: Update coupon
  async updateCoupon(id, couponData) {
    try {
      const response = await apiClient.patch(`${this.baseURL}/${id}`, couponData);
      return response;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  }

  // Admin: Delete coupon
  async deleteCoupon(id) {
    try {
      const response = await apiClient.delete(`${this.baseURL}/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  }

  // Validate coupon code
  async validateCoupon(code) {
    try {
      const response = await apiClient.get(`${this.baseURL}/validate/${code}`);
      return response;
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }
}

export default new CouponService();
