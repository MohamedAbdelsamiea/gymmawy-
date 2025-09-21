import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class ProductService {
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

  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/products?${queryParams}`;
      const response = await fetch(url, {
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

  // Admin methods
  async createCategory(categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        throw new Error('Category creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Category creation error: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Product creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Product creation error: ${error.message}`);
    }
  }

  async updateProduct(id, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Product update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Product update error: ${error.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Product deletion failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Product deletion error: ${error.message}`);
    }
  }
}

export default new ProductService();
