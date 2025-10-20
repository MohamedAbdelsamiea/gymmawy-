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
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        // Return null for 500 errors instead of throwing to prevent UI crashes
        if (response.status >= 500) {
          console.warn('Server error fetching homepage popup, returning null');
          return { popup: null };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch response:', data);
      return data;
    } catch (error) {
      // Handle timeout and network errors gracefully
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.warn('Timeout or abort error fetching homepage popup, returning null');
        return { popup: null };
      }
      
      console.error('Error fetching homepage popup:', error);
      // Return null instead of throwing to prevent UI crashes
      return { popup: null };
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
