import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class CartService {
  async getCart() {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Cart fetch error: ${error.message}`);
    }
  }

  async addToCart(productId, quantity = 1, variantId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productId, 
          quantity,
          ...(variantId && { variantId }),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Add to cart error: ${error.message}`);
    }
  }

  async updateCartItem(itemId, quantity) {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Update cart item error: ${error.message}`);
    }
  }

  async removeFromCart(itemId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Remove from cart error: ${error.message}`);
    }
  }

  async clearCart() {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Clear cart error: ${error.message}`);
    }
  }

  async applyCoupon(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/coupon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply coupon');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Apply coupon error: ${error.message}`);
    }
  }

  async removeCoupon() {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/coupon`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove coupon');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Remove coupon error: ${error.message}`);
    }
  }
}

export default new CartService();
