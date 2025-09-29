import apiClient from './apiClient';

class StoreService {
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/products${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Products fetch error: ${error.message}`);
    }
  }

  async getNewArrivals(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/products/new-arrivals${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`New arrivals fetch error: ${error.message}`);
    }
  }

  async getAllProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/products/all${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`All products fetch error: ${error.message}`);
    }
  }

  async getProduct(id) {
    try {
      return await apiClient.get(`/products/${id}`);
    } catch (error) {
      throw new Error(`Product fetch error: ${error.message}`);
    }
  }

  async getRelatedProducts(productId, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/products/${productId}/related${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Related products fetch error: ${error.message}`);
    }
  }

  async getCategories() {
    try {
      return await apiClient.get('/categories');
    } catch (error) {
      throw new Error(`Categories fetch error: ${error.message}`);
    }
  }

  async createOrder(orderData) {
    try {
      return await apiClient.post('/orders', orderData);
    } catch (error) {
      throw new Error(`Order creation error: ${error.message}`);
    }
  }

  async getOrder(id) {
    try {
      return await apiClient.get(`/orders/${id}`);
    } catch (error) {
      throw new Error(`Order fetch error: ${error.message}`);
    }
  }

  async updateOrder(id, orderData) {
    try {
      return await apiClient.patch(`/orders/${id}`, orderData);
    } catch (error) {
      throw new Error(`Order update error: ${error.message}`);
    }
  }

  async cancelOrder(id) {
    try {
      return await apiClient.patch(`/orders/${id}/cancel`);
    } catch (error) {
      throw new Error(`Order cancellation error: ${error.message}`);
    }
  }

  async getCart() {
    try {
      return await apiClient.get('/cart');
    } catch (error) {
      throw new Error(`Cart fetch error: ${error.message}`);
    }
  }

  async addToCart(productId, quantity = 1, size = "M") {
    try {
      return await apiClient.post('/cart/add', { productId, quantity, size });
    } catch (error) {
      throw new Error(`Add to cart error: ${error.message}`);
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

  async updateCartItem(productId, quantity, size = "M") {
    try {
      return await apiClient.patch('/cart/update', { productId, quantity, size });
    } catch (error) {
      throw new Error(`Update cart item error: ${error.message}`);
    }
  }

  async clearCart() {
    try {
      return await apiClient.delete('/cart/clear');
    } catch (error) {
      throw new Error(`Clear cart error: ${error.message}`);
    }
  }
}

export default new StoreService();
