import React from 'react';
import { useTranslation } from 'react-i18next';

const AuthButton = ({ 
  children, 
  type = "button", 
  variant = "primary", 
  loading = false, 
  disabled = false,
  className = "",
  onClick,
  ...props 
}) => {
  const { t } = useTranslation("auth");

  const baseClasses = `
    w-full py-3 px-6 rounded-lg font-bold text-lg
    transition-all duration-300 transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${loading ? 'cursor-wait' : 'hover:scale-105 active:scale-95'}
  `;

  const variantClasses = {
    primary: `
      bg-gymmawy-primary hover:bg-gymmawy-secondary 
      text-white shadow-lg hover:shadow-xl
      focus:ring-gymmawy-primary
    `,
    secondary: `
      bg-white hover:bg-gray-50 
      text-gymmawy-primary border-2 border-gymmawy-primary
      focus:ring-gymmawy-primary
    `,
    outline: `
      bg-transparent hover:bg-gymmawy-primary 
      text-gymmawy-primary border-2 border-gymmawy-primary
      hover:text-white focus:ring-gymmawy-primary
    `,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          {t("common.loading")}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default AuthButton;
