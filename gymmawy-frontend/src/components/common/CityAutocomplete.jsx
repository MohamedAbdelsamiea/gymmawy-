import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';

const CityAutocomplete = ({ 
  value, 
  onChange, 
  onError,
  placeholder,
  required = false,
  className = "",
  disabled = false
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search function
  const searchCities = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/shipping/search-cities?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.data.success) {
        setSuggestions(response.data.cities || []);
        setError(null);
      } else {
        setError('Failed to search cities');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('City search error:', error);
      setError('Failed to search cities');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate city when user stops typing
  const validateCity = async (cityName) => {
    if (!cityName || cityName.length < 2) {
      setError(null);
      return;
    }

    try {
      setIsValidating(true);
      const response = await apiClient.get(`/api/shipping/validate-city?city=${encodeURIComponent(cityName)}`);
      
      if (response.data.success) {
        if (response.data.isValid) {
          setError(null);
          onError && onError(null);
        } else {
          const errorMessage = response.data.message;
          setError(errorMessage);
          onError && onError({
            message: errorMessage,
            suggestions: response.data.suggestions || []
          });
        }
      }
    } catch (error) {
      console.error('City validation error:', error);
      setError('Failed to validate city');
      onError && onError({ message: 'Failed to validate city' });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);

    // Clear error when user starts typing
    if (error) {
      setError(null);
      onError && onError(null);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (city) => {
    onChange(city.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);
    onError && onError(null);
    
    // Validate the selected city
    validateCity(city.name);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value && value.length >= 2) {
      setShowSuggestions(true);
      searchCities(value);
    }
  };

  // Validate on blur if there's a value
  const handleBlur = () => {
    if (value && value.trim()) {
      validateCity(value.trim());
    }
    setShowSuggestions(false);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          } ${className}`}
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {(isLoading || isValidating) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gymmawy-primary"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(city)}
            >
              {city.name}
            </div>
          ))}
        </div>
      )}

      {/* No suggestions message */}
      {showSuggestions && !isLoading && suggestions.length === 0 && value && value.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">
            {t('checkout.noCitiesFound')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
