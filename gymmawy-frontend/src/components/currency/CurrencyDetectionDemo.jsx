import React, { useState, useEffect } from 'react';
import { useCurrencyContext } from '../../contexts/CurrencyContext';

const CurrencyDetectionDemo = () => {
  const { 
    currency, 
    detectedCountry, 
    isDetectedCurrency, 
    userPreference,
    changeCurrency 
  } = useCurrencyContext();
  
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Show demo if we have detected country info
    if (detectedCountry && isDetectedCurrency) {
      setShowDemo(true);
    }
  }, [detectedCountry, isDetectedCurrency]);

  if (!showDemo) {
    return null;
  }

  const handleClearPreference = () => {
    localStorage.removeItem('userCurrencyPreference');
    localStorage.removeItem('currencyBannerDismissed');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          🧪 Currency Detection Demo
        </h4>
        
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <strong>Current Currency:</strong> {currency}
          </div>
          <div>
            <strong>Detected Country:</strong> {detectedCountry?.name || detectedCountry?.code || 'Unknown'}
          </div>
          <div>
            <strong>Is Detected:</strong> {isDetectedCurrency ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>User Preference:</strong> {userPreference || 'None'}
          </div>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => changeCurrency('SAR')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Set SAR
          </button>
          <button
            onClick={() => changeCurrency('AED')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Set AED
          </button>
          <button
            onClick={handleClearPreference}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear
          </button>
        </div>
        
        <button
          onClick={() => setShowDemo(false)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600"
        >
          Hide Demo
        </button>
      </div>
    </div>
  );
};

export default CurrencyDetectionDemo;
