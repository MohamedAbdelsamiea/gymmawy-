import apiClient from './apiClient';

class CMSService {
  constructor() {
    this.baseURL = '/cms';
  }

  // ==================== TRANSFORMATIONS ====================
  async getTransformations(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`${this.baseURL}/transformations?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching transformations:', error);
      throw error;
    }
  }

  async getTransformationById(id) {
    try {
      const response = await apiClient.get(`${this.baseURL}/transformations/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching transformation:', error);
      throw error;
    }
  }

  // ==================== VIDEOS ====================
  async getVideos(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`${this.baseURL}/videos?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  async getVideoById(id) {
    try {
      const response = await apiClient.get(`${this.baseURL}/videos/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  }

  // ==================== CONTENT DISPLAY ====================
  async getFeaturedTransformations(limit = 6) {
    try {
      const response = await apiClient.get(`${this.baseURL}/transformations?limit=${limit}&featured=true`);
      return response;
    } catch (error) {
      console.error('Error fetching featured transformations:', error);
      throw error;
    }
  }

  async getFeaturedVideos(limit = 6) {
    try {
      const response = await apiClient.get(`${this.baseURL}/videos?limit=${limit}&featured=true`);
      return response;
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      throw error;
    }
  }

  async searchContent(query, type = 'all') {
    try {
      const params = { q: query };
      if (type !== 'all') {
        params.type = type;
      }
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`${this.baseURL}/search?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }
}

export default new CMSService();
