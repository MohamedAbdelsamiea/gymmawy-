import { useState, useEffect } from 'react';
import { detectCountry } from '../services/countryDetectionService';

/**
 * Custom hook for detecting user's country based on IP address
 * @param {boolean} autoDetect - Whether to automatically detect on mount
 * @returns {Object} Country detection state and methods
 */
export const useCountryDetection = (autoDetect = true) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [error, setError] = useState(null);
  const [hasDetected, setHasDetected] = useState(false);

  const detect = async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      const result = await detectCountry();
      setDetectedCountry(result);
      setHasDetected(true);
      console.log('✅ Country detection completed:', result);
    } catch (err) {
      console.error('❌ Country detection failed:', err);
      setError(err.message);
      // Set default values on error
      setDetectedCountry({
        country: 'Egypt',
        countryCode: 'EG',
        phoneCode: '+20',
        city: '',
        region: ''
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const reset = () => {
    setDetectedCountry(null);
    setError(null);
    setHasDetected(false);
  };

  useEffect(() => {
    if (autoDetect && !hasDetected) {
      detect();
    }
  }, [autoDetect, hasDetected]);

  return {
    isDetecting,
    detectedCountry,
    error,
    hasDetected,
    detect,
    reset
  };
};

export default useCountryDetection;
