import React from 'react';
import { Link } from 'react-router-dom';

const AuthLink = ({ 
  to, 
  children, 
  className = "",
  variant = "default", 
}) => {
  const baseClasses = `
    inline-flex items-center text-sm font-medium
    transition-colors duration-200
    hover:underline focus:outline-none focus:underline
  `;

  const variantClasses = {
    default: "text-gymmawy-primary hover:text-gymmawy-secondary",
    muted: "text-gray-600 hover:text-gray-800",
    danger: "text-red-600 hover:text-red-800",
  };

  return (
    <Link
      to={to}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
};

export default AuthLink;
