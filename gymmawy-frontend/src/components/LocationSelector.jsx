import React from 'react';
import { useLocation } from '../hooks/useLocation';

const LocationSelector = ({ onLocationChange }) => {
  const { country, countryName, currency, currencySymbol, loading, setLocation } = useLocation();

  const handleCountryChange = (newCountry) => {
    setLocation(newCountry);
    if (onLocationChange) {
      onLocationChange(newCountry);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Detecting location...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Location:</span>
      <select
        value={country}
        onChange={(e) => handleCountryChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="EG">🇪🇬 Egypt (EGP)</option>
        <option value="SA">🇸🇦 Saudi Arabia (SAR)</option>
        <option value="AE">🇦🇪 UAE (AED)</option>
        <option value="KW">🇰🇼 Kuwait (KWD)</option>
        <option value="QA">🇶🇦 Qatar (QAR)</option>
        <option value="BH">🇧🇭 Bahrain (BHD)</option>
        <option value="OM">🇴🇲 Oman (OMR)</option>
        <option value="JO">🇯🇴 Jordan (JOD)</option>
        <option value="LB">🇱🇧 Lebanon (LBP)</option>
        <option value="MA">🇲🇦 Morocco (MAD)</option>
        <option value="TN">🇹🇳 Tunisia (TND)</option>
        <option value="DZ">🇩🇿 Algeria (DZD)</option>
        <option value="LY">🇱🇾 Libya (LYD)</option>
        <option value="SD">🇸🇩 Sudan (SDG)</option>
        <option value="IQ">🇮🇶 Iraq (IQD)</option>
        <option value="SY">🇸🇾 Syria (SYP)</option>
        <option value="YE">🇾🇪 Yemen (YER)</option>
        <option value="PS">🇵🇸 Palestine (ILS)</option>
      </select>
      <span className="text-sm text-gray-500">
        {currencySymbol} {currency}
      </span>
    </div>
  );
};

export default LocationSelector;
