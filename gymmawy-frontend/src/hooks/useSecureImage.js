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
          setLoading(false);
          return;
        }

        // Check if it's a payment proof path - use secure endpoint
        if (imagePath.includes('/payment-proofs/')) {
          const filename = imagePath.split('/').pop();
          // Use the base URL without /api for file serving
          const baseUrl = config.API_BASE_URL.replace('/api', '');
          const secureUrl = `${baseUrl}/files/payment-proofs/${filename}`;
          
          console.log('🔍 Loading payment proof:', {
            originalPath: imagePath,
            filename: filename,
            secureUrl: secureUrl,
            apiBaseUrl: config.API_BASE_URL,
            baseUrl: baseUrl
          });
          
          // Fetch the image through the secure endpoint
          const response = await fetch(secureUrl, {
            headers: {
              'Authorization': `Bearer ${authService.getToken()}`,
            },
          });

          if (!response.ok) {
            console.error('❌ Failed to load payment proof:', {
              status: response.status,
              statusText: response.statusText,
              url: secureUrl
            });
            throw new Error(`Failed to load payment proof: ${response.status} ${response.statusText}`);
          }

          // Convert to blob and then to data URL
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => setDataUrl(reader.result);
          reader.readAsDataURL(blob);
          setLoading(false);
          return;
        }

        // Check if it's other uploads path (non-payment-proofs)
        if (imagePath.startsWith('/uploads/')) {
          const baseUrl = config.API_BASE_URL.replace('/api', '');
          setDataUrl(`${baseUrl}${imagePath}`);
          setLoading(false);
          return;
        }

        // For local files, get the secure data URL
        // Remove leading slash if present to avoid double slashes
        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        const encodedPath = encodeURIComponent(cleanPath);
        const fullUrl = `${config.API_BASE_URL}/images/data/${encodedPath}`;
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
