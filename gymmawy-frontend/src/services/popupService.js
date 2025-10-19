import apiClient from './apiClient';
import { config } from '../config';

const popupService = {
  // Get homepage popup settings
  getHomepagePopup: async () => {
    try {
      // Make a direct fetch request without authentication for public access
      const response = await fetch(`${config.API_BASE_URL}/api/cms/homepage-popup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching homepage popup:', error);
      throw error;
    }
  },

  // Update homepage popup settings (admin only)
  updateHomepagePopup: async (popupData) => {
    try {
      const response = await apiClient.patch('/cms/homepage-popup', popupData);
      return response.data || response;
    } catch (error) {
      console.error('Error updating homepage popup:', error);
      throw error;
    }
  }
};

export default popupService;
