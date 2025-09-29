import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class StoreService {
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/products?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Products fetch error: ${error.message}`);
    }
  }

  async getNewArrivals(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/products/new-arrivals?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch new arrivals');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`New arrivals fetch error: ${error.message}`);
    }
  }

  async getAllProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/products/all?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch all products');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`All products fetch error: ${error.message}`);
    }
  }

  async getProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Product fetch error: ${error.message}`);
    }
  }

  async getRelatedProducts(productId, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/products/${productId}/related?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch related products');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Related products fetch error: ${error.message}`);
    }
  }

  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Categories fetch error: ${error.message}`);
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Order creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order creation error: ${error.message}`);
    }
  }

  async getOrder(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order fetch error: ${error.message}`);
    }
  }

  async updateOrder(id, orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Order update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order update error: ${error.message}`);
    }
  }

  async cancelOrder(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Order cancellation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order cancellation error: ${error.message}`);
    }
  }

  async getCart() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
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

  async addToCart(productId, quantity = 1, size = "M") {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity, size }),
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

  async removeFromCart(itemId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${itemId}`, {
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

  async updateCartItem(productId, quantity, size = "M") {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity, size }),
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

  async clearCart() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Clear cart error: ${error.message}`);
    }
  }
}

export default new StoreService();
