import React from 'react';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'md',
  showLabel = false,
  label = '',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-7',
    md: 'h-6 w-11',
    lg: 'h-8 w-14'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const thumbPositionClasses = {
    sm: checked ? 'translate-x-3' : 'translate-x-0.5',
    md: checked ? 'translate-x-6' : 'translate-x-1',
    lg: checked ? 'translate-x-7' : 'translate-x-1'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(e);
        }}
        disabled={disabled}
        className={`relative inline-flex items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:ring-offset-2 ${
          sizeClasses[size]
        } ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        {...props}
      >
        <span
          className={`inline-block transform rounded-full bg-white transition-transform duration-300 ease-in-out ${
            thumbSizeClasses[size]
          } ${
            thumbPositionClasses[size]
          }`}
        />
      </button>
      {showLabel && label && (
        <span className="ml-3 text-sm font-medium text-gray-900">
          {label}
        </span>
      )}
    </div>
  );
};

export default ToggleSwitch;
