import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class TransformationService {
  async getTransformations(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      // Use relative URL to go through Vite proxy
      const response = await fetch(`/api/cms/transformations?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transformations');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Transformations fetch error: ${error.message}`);
    }
  }

  async getTransformation(id) {
    try {
      const response = await fetch(`/api/cms/transformations/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transformation');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Transformation fetch error: ${error.message}`);
    }
  }

  // Admin methods
  async createTransformation(transformationData) {
    try {
      const response = await fetch(`/api/cms/transformations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformationData),
      });
      
      if (!response.ok) {
        throw new Error('Transformation creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Transformation creation error: ${error.message}`);
    }
  }

  async updateTransformation(id, transformationData) {
    try {
      const response = await fetch(`/api/cms/transformations/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformationData),
      });
      
      if (!response.ok) {
        throw new Error('Transformation update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Transformation update error: ${error.message}`);
    }
  }

  async deleteTransformation(id) {
    try {
      const response = await fetch(`/api/cms/transformations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Transformation deletion failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Transformation deletion error: ${error.message}`);
    }
  }
}

export default new TransformationService();
