import React from 'react';

const AuthCard = ({ children, title, subtitle, className = "" }) => {

  return (
    <div className={`flex items-center justify-center bg-[#ebebeb] py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-2xl md:text-3xl font-bold text-gymmawy-primary mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-600 text-sm md:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
