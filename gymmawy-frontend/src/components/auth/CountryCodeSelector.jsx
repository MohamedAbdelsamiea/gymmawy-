import React, { useState } from 'react';

const countryCodes = [
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
];

const CountryCodeSelector = ({ value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCountry = countryCodes.find(country => country.code === value) || countryCodes[0];

  const filteredCountries = countryCodes.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm)
  );

  const handleSelect = (country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-gymmawy-primary transition-colors"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden w-80 min-w-max">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-gymmawy-primary"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors whitespace-nowrap ${
                  country.code === value ? 'bg-gymmawy-primary bg-opacity-10' : ''
                }`}
              >
                <span className="text-lg flex-shrink-0">{country.flag}</span>
                <span className="text-sm font-medium text-gray-700 flex-shrink-0 w-12">{country.code}</span>
                <span className="text-sm text-gray-500 truncate">{country.country}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
