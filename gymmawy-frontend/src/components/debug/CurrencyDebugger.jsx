import React from 'react';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';

const CurrencyDebugger = () => {
  const { 
    currency, 
    isLoading, 
    error, 
    availableCurrencies, 
    currencyInfo, 
    tabbyCurrency, 
    isTabbySupported,
    formatPrice 
  } = useCurrencyContext();
  
  const { i18n } = useTranslation();

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 z-50 max-w-sm">
        <h3 className="font-bold text-blue-800 mb-2">Currency Debug (Loading...)</h3>
        <p className="text-sm text-blue-600">Detecting currency...</p>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-300 rounded-lg p-4 z-50 max-w-sm">
      <h3 className="font-bold text-green-800 mb-2">Currency Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Current Currency:</span> 
          <span className="ml-2 bg-white px-2 py-1 rounded text-green-800 font-bold">
            {currency}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Currency Symbol:</span> 
          <span className="ml-2 bg-white px-2 py-1 rounded text-green-800 font-bold">
            {currencyInfo.symbol}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Tabby Currency:</span> 
          <span className="ml-2 bg-white px-2 py-1 rounded text-green-800 font-bold">
            {tabbyCurrency}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Tabby Supported:</span> 
          <span className={`ml-2 px-2 py-1 rounded font-bold ${
            isTabbySupported ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}>
            {isTabbySupported ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Language:</span> 
          <span className="ml-2 bg-white px-2 py-1 rounded text-green-800 font-bold">
            {i18n.language}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Sample Price:</span> 
          <span className="ml-2 bg-white px-2 py-1 rounded text-green-800 font-bold">
            {formatPrice(1000)}
          </span>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-300 rounded p-2">
            <span className="text-red-800 font-medium">Error:</span>
            <p className="text-red-700 text-xs mt-1">{error}</p>
          </div>
        )}
        
        <div className="text-xs text-gray-600 mt-2">
          <p>Available: {availableCurrencies.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyDebugger;
