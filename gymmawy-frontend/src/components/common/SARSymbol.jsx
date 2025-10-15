import React from 'react';

const SARSymbol = ({ className = '', fallback = 'SAR' }) => {
  return (
    <span className={`sar-symbol ${className}`}>
      {/* Primary: Unicode Rial Sign */}
      <span style={{ fontFamily: 'Arial Unicode MS, Lucida Grande, Tahoma, sans-serif' }}>
        ﷼
      </span>
      {/* Fallback: Text fallback for unsupported devices */}
      <span 
        style={{ 
          fontSize: '0.8em', 
          fontWeight: 'bold',
          marginLeft: '2px',
          display: 'none' // Hidden by default, shown via CSS if needed
        }}
        className="sar-fallback"
      >
        {fallback}
      </span>
    </span>
  );
};

export default SARSymbol;
