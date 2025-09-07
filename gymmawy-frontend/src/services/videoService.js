import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;

class VideoService {
  async getVideos(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/cms/videos?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Videos fetch error: ${error.message}`);
    }
  }

  async getVideo(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/cms/videos/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Video fetch error: ${error.message}`);
    }
  }

  async getFeaturedVideo() {
    try {
      // Get the first video as featured video
      const response = await this.getVideos({ pageSize: 1, sortBy: 'createdAt', sortOrder: 'desc' });
      return response.items && response.items.length > 0 ? response.items[0] : null;
    } catch (error) {
      console.error('Error fetching featured video:', error);
      return null;
    }
  }
}

export default new VideoService();
