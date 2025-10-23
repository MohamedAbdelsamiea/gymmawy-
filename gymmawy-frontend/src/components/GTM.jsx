import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GTM = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];
    
    // Push page view event to dataLayer
    window.dataLayer.push({
      event: 'page_view',
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search,
    });
  }, [location]);

  // Initialize GTM on component mount
  useEffect(() => {
    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];
    
    // Push initial page view
    window.dataLayer.push({
      event: 'gtm.js',
      gtm: 'new'
    });
  }, []);

  return null; // This component doesn't render anything
};

// Utility functions for custom event tracking
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters
    });
  }
};

// Common tracking functions
export const trackPurchase = (transactionData) => {
  trackEvent('purchase', {
    transaction_id: transactionData.transactionId,
    value: transactionData.value,
    currency: transactionData.currency || 'EGP',
    items: transactionData.items
  });
};

export const trackAddToCart = (itemData) => {
  trackEvent('add_to_cart', {
    currency: itemData.currency || 'EGP',
    value: itemData.value,
    items: [itemData]
  });
};

export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method
  });
};

export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', {
    method: method
  });
};

export default GTM;
