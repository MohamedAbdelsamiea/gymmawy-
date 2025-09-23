import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;

class VideoService {
  async getVideos(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/cms/videos?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎥 Videos API error response:', errorText);
        throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🎥 Videos fetch error:', error);
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
      // Get all videos and filter for active ones
      const response = await this.getVideos();
      
      // Handle different response structures
      let videos = [];
      if (Array.isArray(response)) {
        videos = response;
      } else if (response.items && Array.isArray(response.items)) {
        videos = response.items;
      } else if (response.videos && Array.isArray(response.videos)) {
        videos = response.videos;
      }
      
      // Filter for active videos only
      const activeVideos = videos.filter(video => video.isActive === true);
      
      if (activeVideos.length > 0) {
        // Return the first active video (most recently created)
        return activeVideos[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('🎥 Error fetching featured video:', error);
      return null;
    }
  }
}

export default new VideoService();
