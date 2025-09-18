import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const FloatingInput = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder,
  className = "",
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation("auth");

  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <input
          type={inputType}
          value={value || ""}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || " "}
          required={required}
          className={`
            peer w-full border-b-2 bg-transparent pt-2 pb-4 text-lg md:text-xl 
            focus:outline-none transition-colors duration-200
            ltr:text-left rtl:text-right
            ${isPassword ? 'ltr:pr-12 rtl:pl-12' : ''}
            ${error 
              ? 'border-red-500 text-red-500' 
              : isFocused 
                ? 'border-gymmawy-primary text-gymmawy-primary' 
                : 'border-gray-300 text-gray-700'
            }
            ${error ? 'focus:border-red-500' : 'focus:border-gymmawy-primary'}
          `}
          {...props}
        />
        
        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute ltr:right-0 rtl:left-0 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gymmawy-primary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
        <label
          className={`
            absolute transition-all duration-200 pointer-events-none
            ltr:left-0 rtl:right-0
            ${isFloating 
              ? 'top-[-0.75rem] text-xs' 
              : 'top-2 text-lg md:text-xl'
            }
            ${error 
              ? 'text-red-500' 
              : isFloating 
                ? 'text-gymmawy-primary' 
                : 'text-gray-500'
            }
            uppercase font-medium
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-2 ltr:text-left rtl:text-right">
          {error}
        </p>
      )}
    </div>
  );
};

export default FloatingInput;
