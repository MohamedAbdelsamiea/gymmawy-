import React from 'react';

const ChartCard = ({ 
  title, 
  subtitle, 
  children, 
  className = '',
  actions, 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        {/* Actions on top for mobile, right side for desktop */}
        {actions && (
          <div className="flex items-center justify-center sm:justify-end mb-4 sm:mb-0">
            {actions}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
