import apiClient from './apiClient';

class ProductService {
  async getCategories() {
    try {
      return await apiClient.get('/categories');
    } catch (error) {
      throw new Error(`Categories fetch error: ${error.message}`);
    }
  }

  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/products${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Products fetch error: ${error.message}`);
    }
  }

  async getProduct(id) {
    try {
      return await apiClient.get(`/products/${id}`);
    } catch (error) {
      throw new Error(`Product fetch error: ${error.message}`);
    }
  }

  // Admin methods
  async createCategory(categoryData) {
    try {
      return await apiClient.post('/categories', categoryData);
    } catch (error) {
      throw new Error(`Category creation error: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      return await apiClient.post('/products', productData);
    } catch (error) {
      throw new Error(`Product creation error: ${error.message}`);
    }
  }

  async updateProduct(id, productData) {
    try {
      return await apiClient.patch(`/products/${id}`, productData);
    } catch (error) {
      throw new Error(`Product update error: ${error.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Product deletion error: ${error.message}`);
    }
  }
}

export default new ProductService();
