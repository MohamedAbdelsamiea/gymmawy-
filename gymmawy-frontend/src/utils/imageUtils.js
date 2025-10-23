// src/utils/imageUtils.js
import { config } from '../config';

/**
 * Convert a relative image URL to a full URL
 * Handles the difference between API endpoints (/api/*) and direct file serving (/uploads/*)
 * @param {string} imageUrl - The relative or absolute image URL
 * @param {string} baseUrl - The base URL (defaults to current backend URL)
 * @returns {string} - The full image URL
 */
export function getFullImageUrl(imageUrl, baseUrl = config.API_BASE_URL) {
  if (!imageUrl) return '';
  
  // Convert full URLs to API routes
  if (imageUrl.startsWith('https://gymmawy.fit/uploads/')) {
    // Convert to API route
    const pathPart = imageUrl.replace('https://gymmawy.fit/uploads/', 'uploads/');
    return `${baseUrl}/${pathPart}`;
  }
  
  // If already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // For uploads, serve through API routes
  if (imageUrl.startsWith('/uploads/')) {
    // Remove the leading slash and add /api prefix
    const cleanPath = imageUrl.substring(1);
    return `${baseUrl}/${cleanPath}`;
  }
  
  // For other relative URLs, use the base URL
  return `${baseUrl}${imageUrl}`;
}
