import React, { useState } from 'react';
import TabbyPromo from '../payment/TabbyPromo';
import TabbyCartPromo from '../payment/TabbyCartPromo';
import useTabbyPromo from '../../hooks/useTabbyPromo';

/**
 * Test component for Tabby Promo integration
 * This component can be used to test the Tabby promo snippets
 */
const TabbyPromoTest = () => {
  const [testPrice, setTestPrice] = useState(1000);
  const [testCurrency, setTestCurrency] = useState('EGP');
  const [testCountry, setTestCountry] = useState('EG');
  
  const { 
    isSupported, 
    currentCountry, 
    supportedCountries,
    updateCountry,
    tabbyConfig 
  } = useTabbyPromo();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-[#190143] mb-8">
        Tabby Promo Integration Test
      </h1>

      {/* Test Controls */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold text-[#190143]">Test Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              value={testPrice}
              onChange={(e) => setTestPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#190143]"
              min="50"
              max="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={testCurrency}
              onChange={(e) => setTestCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#190143]"
            >
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="KWD">KWD - Kuwaiti Dinar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={testCountry}
              onChange={(e) => {
                setTestCountry(e.target.value);
                updateCountry(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#190143]"
            >
              {supportedCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Current Country:</strong> {currentCountry}</p>
          <p><strong>Tabby Supported:</strong> {isSupported ? 'Yes' : 'No'}</p>
          <p><strong>Tabby Config:</strong> {JSON.stringify(tabbyConfig)}</p>
        </div>
      </div>

      {/* Product Page Test */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[#190143] mb-4">
          Product Page Snippet Test
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Product Price: {testPrice} {testCurrency}</h3>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tabby Promo Snippet:</h4>
            <TabbyPromo
              price={testPrice}
              currency={testCurrency}
              source="product"
              selector="#TabbyTestProductPromo"
              country={testCountry}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Cart Page Test */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[#190143] mb-4">
          Cart Page Snippet Test
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Cart Total: {testPrice} {testCurrency}</h3>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tabby Cart Promo Snippet:</h4>
            <TabbyCartPromo
              total={testPrice}
              currency={testCurrency}
              country={testCountry}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">
          Testing Instructions
        </h2>
        <div className="text-blue-700 space-y-2">
          <p>• Change the price to test different amounts (50-50000)</p>
          <p>• Switch currencies to test conversion</p>
          <p>• Change countries to test support</p>
          <p>• Check that snippets update dynamically</p>
          <p>• Verify responsive behavior on mobile/desktop</p>
          <p>• Test with Arabic language (change browser language)</p>
        </div>
      </div>
    </div>
  );
};

export default TabbyPromoTest;
