import { useState, useEffect } from 'react';
import { config } from '../config';
import authService from '../services/authService';

/**
 * Hook to securely load images that require authentication
 * Converts the image to a data URL to avoid CORS issues
 */
export const useSecureImage = (imagePath) => {
  const [dataUrl, setDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imagePath) {
      setDataUrl(null);
      return;
    }

    const loadSecureImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if it's already a data URL or external URL
        if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
          setDataUrl(imagePath);
          return;
        }

        // For local files, get the secure data URL
        // Remove leading slash if present to avoid double slashes
        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        const encodedPath = encodeURIComponent(cleanPath);
        const fullUrl = `${config.API_BASE_URL}/api/images/data/${encodedPath}`;
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        const data = await response.json();
        setDataUrl(data.dataUrl);
      } catch (err) {
        console.error('Error loading secure image:', err);
        setError(err.message);
        setDataUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadSecureImage();
  }, [imagePath]);

  return { dataUrl, loading, error };
};
