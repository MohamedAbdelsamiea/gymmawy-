// src/utils/imageUtils.js
import { config } from '../config';

/**
 * Convert a relative image URL to a full URL
 * Handles the difference between API endpoints (/api/*) and direct file serving (/uploads/*)
 * @param {string} imageUrl - The relative or absolute image URL
 * @param {string} baseUrl - The base URL (defaults to current backend URL)
 * @returns {string} - The full image URL
 */
export function getFullImageUrl(imageUrl, baseUrl = config.API_BASE_URL.replace('/api', '')) {
  if (!imageUrl) return '';
  
  // If already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // For uploads, serve directly from backend (not through /api)
  if (imageUrl.startsWith('/uploads/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // For other relative URLs, use the base URL
  return `${baseUrl}${imageUrl}`;
}
