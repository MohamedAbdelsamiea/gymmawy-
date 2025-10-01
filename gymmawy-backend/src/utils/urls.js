/**
 * Get the frontend URL based on environment
 * @returns {string} The frontend URL
 */
export function getFrontendUrl() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL environment variable is required in production');
    }
    return process.env.FRONTEND_URL;
  }
  
  // Development environment
  return 'http://localhost:5173';
}

/**
 * Get the backend URL based on environment
 * @returns {string} The backend URL
 */
export function getBackendUrl() {
  const port = process.env.PORT || 3000;
  
  if (process.env.NODE_ENV === 'production') {
    // In production, use the backend URL from env or construct from FRONTEND_URL
    return process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace(/:\d+/, `:${port}`);
  }
  
  // Development environment
  return `http://localhost:${port}`;
}

