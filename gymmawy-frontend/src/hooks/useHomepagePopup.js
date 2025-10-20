import { useState, useEffect } from 'react';
import popupService from '../services/popupService';

export const useHomepagePopup = () => {
  const [popup, setPopup] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching popup data...');
        const response = await popupService.getHomepagePopup();
        console.log('Raw response:', response);
        const popupData = response?.popup;
        console.log('Extracted popup data:', popupData);
        
        if (!popupData) {
          console.warn('No popup data received from service');
          setPopup(null);
          setShowPopup(false);
          return;
        }
        
        setPopup(popupData);
        
        // Check if popup should be shown
        if (popupData && popupData.isActive) {
          console.log('Popup data:', popupData);
          console.log('Popup is active:', popupData.isActive);
          console.log('Setting showPopup to true');
          setShowPopup(true);
        } else {
          console.log('Popup not active or no popup data');
          setShowPopup(false);
        }
      } catch (err) {
        console.error('Error fetching popup:', err);
        setError(err.message);
        setPopup(null);
        setShowPopup(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPopup();
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    popup,
    showPopup,
    loading,
    error,
    closePopup
  };
};
