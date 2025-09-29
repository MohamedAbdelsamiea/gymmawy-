import apiClient from './apiClient';

class TransformationService {
  async getTransformations(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/cms/transformations${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Transformations fetch error: ${error.message}`);
    }
  }

  async getTransformation(id) {
    try {
      return await apiClient.get(`/cms/transformations/${id}`);
    } catch (error) {
      throw new Error(`Transformation fetch error: ${error.message}`);
    }
  }

  // Admin methods
  async createTransformation(transformationData) {
    try {
      return await apiClient.post('/cms/transformations', transformationData);
    } catch (error) {
      throw new Error(`Transformation creation error: ${error.message}`);
    }
  }

  async updateTransformation(id, transformationData) {
    try {
      return await apiClient.patch(`/cms/transformations/${id}`, transformationData);
    } catch (error) {
      throw new Error(`Transformation update error: ${error.message}`);
    }
  }

  async deleteTransformation(id) {
    try {
      await apiClient.delete(`/cms/transformations/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Transformation deletion error: ${error.message}`);
    }
  }
}

export default new TransformationService();
