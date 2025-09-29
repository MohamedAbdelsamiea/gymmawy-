import apiClient from './apiClient';

class CartService {
  async getCart() {
    try {
      return await apiClient.get('/cart');
    } catch (error) {
      throw new Error(`Cart fetch error: ${error.message}`);
    }
  }

  async addToCart(productId, quantity = 1, variantId = null) {
    try {
      const data = { 
        productId, 
        quantity,
        ...(variantId && { variantId }),
      };
      return await apiClient.post('/cart/add', data);
    } catch (error) {
      throw new Error(`Add to cart error: ${error.message}`);
    }
  }

  async updateCartItem(itemId, quantity) {
    try {
      return await apiClient.patch('/cart/update', { itemId, quantity });
    } catch (error) {
      throw new Error(`Update cart item error: ${error.message}`);
    }
  }

  async removeFromCart(itemId) {
    try {
      await apiClient.delete(`/cart/remove/${itemId}`);
      return true;
    } catch (error) {
      throw new Error(`Remove from cart error: ${error.message}`);
    }
  }

  async clearCart() {
    try {
      await apiClient.delete('/cart');
      return true;
    } catch (error) {
      throw new Error(`Clear cart error: ${error.message}`);
    }
  }

  async applyCoupon(code) {
    try {
      return await apiClient.post('/cart/coupon', { code });
    } catch (error) {
      throw new Error(`Apply coupon error: ${error.message}`);
    }
  }

  async removeCoupon() {
    try {
      await apiClient.delete('/cart/coupon');
      return true;
    } catch (error) {
      throw new Error(`Remove coupon error: ${error.message}`);
    }
  }
}

export default new CartService();
