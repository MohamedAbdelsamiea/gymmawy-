import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting user's location
 * Uses browser's geolocation API and IP-based detection as fallback
 */
export function useLocation() {
  const [location, setLocation] = useState({
    country: 'EG', // Default to Egypt
    countryName: 'Egypt',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    loading: true,
    error: null,
  });

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async() => {
    try {
      // Try IP-based detection first (faster and more reliable)
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      if (ipData.country_code) {
        const countryCode = ipData.country_code;
        const countryInfo = getCountryInfo(countryCode);
        
        setLocation({
          country: countryCode,
          countryName: ipData.country_name || countryInfo.countryName,
          currency: countryInfo.currency,
          currencySymbol: countryInfo.currencySymbol,
          loading: false,
          error: null,
        });
        
        // Store in localStorage for future use
        localStorage.setItem('userLocation', JSON.stringify({
          country: countryCode,
          countryName: ipData.country_name || countryInfo.countryName,
          currency: countryInfo.currency,
          currencySymbol: countryInfo.currencySymbol,
          detectedAt: new Date().toISOString(),
        }));
        
        return;
      }
    } catch (error) {
      console.warn('IP-based location detection failed:', error);
    }

    // Fallback to browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async(position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            );
            const data = await response.json();
            
            if (data.countryCode) {
              const countryInfo = getCountryInfo(data.countryCode);
              setLocation({
                country: data.countryCode,
                countryName: data.countryName || countryInfo.countryName,
                currency: countryInfo.currency,
                currencySymbol: countryInfo.currencySymbol,
                loading: false,
                error: null,
              });
            } else {
              setDefaultLocation();
            }
          } catch (error) {
            console.warn('Geolocation API failed:', error);
            setDefaultLocation();
          }
        },
        (error) => {
          console.warn('Geolocation permission denied or failed:', error);
          setDefaultLocation();
        },
        {
          timeout: 10000,
          enableHighAccuracy: false,
        },
      );
    } else {
      setDefaultLocation();
    }
  };

  const setDefaultLocation = () => {
    setLocation({
      country: 'EG',
      countryName: 'Egypt',
      currency: 'EGP',
      currencySymbol: 'ج.م',
      loading: false,
      error: 'Location detection failed, using default',
    });
  };

  const getCountryInfo = (countryCode) => {
    // Centralized currency mapping to match backend logic
    const getCurrencyFromCountry = (code) => {
      switch (code?.toUpperCase()) {
        case 'EG': return 'EGP';
        case 'SA': return 'SAR';
        case 'AE': return 'AED';
        default: return 'USD';
      }
    };

    const getCurrencySymbol = (currency) => {
      switch (currency) {
        case 'EGP': return 'ج.م';
        case 'SAR': return 'ر.س';
        case 'AED': return 'د.إ';
        case 'USD': return '$';
        default: return '$';
      }
    };

    const getCountryName = (code) => {
      const countryMap = {
        'EG': 'Egypt',
        'SA': 'Saudi Arabia',
        'AE': 'UAE',
        'KW': 'Kuwait',
        'QA': 'Qatar',
        'BH': 'Bahrain',
        'OM': 'Oman',
        'JO': 'Jordan',
        'LB': 'Lebanon',
        'MA': 'Morocco',
        'TN': 'Tunisia',
        'DZ': 'Algeria',
        'LY': 'Libya',
        'SD': 'Sudan',
        'IQ': 'Iraq',
        'SY': 'Syria',
        'YE': 'Yemen',
        'PS': 'Palestine',
      };
      return countryMap[code?.toUpperCase()] || 'Unknown';
    };

    const currency = getCurrencyFromCountry(countryCode);
    const countryName = getCountryName(countryCode);
    const currencySymbol = getCurrencySymbol(currency);

    return {
      countryName,
      currency,
      currencySymbol,
    };
  };

  const setLocationManually = (countryCode) => {
    const countryInfo = getCountryInfo(countryCode);
    setLocation({
      country: countryCode,
      countryName: countryInfo.countryName,
      currency: countryInfo.currency,
      currencySymbol: countryInfo.currencySymbol,
      loading: false,
      error: null,
    });
    
    // Store in localStorage
    localStorage.setItem('userLocation', JSON.stringify({
      country: countryCode,
      countryName: countryInfo.countryName,
      currency: countryInfo.currency,
      currencySymbol: countryInfo.currencySymbol,
      detectedAt: new Date().toISOString(),
    }));
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const storedDate = new Date(parsed.detectedAt);
        const now = new Date();
        const hoursDiff = (now - storedDate) / (1000 * 60 * 60);
        
        // Use stored location if it's less than 24 hours old
        if (hoursDiff < 24) {
          setLocation({
            ...parsed,
            loading: false,
            error: null,
          });
          return;
        }
      } catch (error) {
        console.warn('Failed to parse stored location:', error);
      }
    }
  }, []);

  return {
    ...location,
    setLocation: setLocationManually,
    refreshLocation: detectLocation,
  };
}
