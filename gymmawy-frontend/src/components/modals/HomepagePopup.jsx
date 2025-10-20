import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getFullImageUrl } from '../../utils/imageUtils';

const HomepagePopup = ({ popup, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate popup appearance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render if no popup data or popup is not active
  if (!popup || !popup.isActive) {
    return null;
  }

  const handleButtonClick = () => {
    if (popup.buttonLink) {
      if (popup.buttonLink.startsWith('http')) {
        // External link
        window.open(popup.buttonLink, '_blank');
      } else {
        // Internal link
        navigate(popup.buttonLink);
      }
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    return textObj[i18n.language] || textObj.en || textObj.ar || '';
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-[32rem] max-w-[calc(100vw-2rem)] max-h-[90vh] mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        } ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Content */}
        <div className="p-4 pb-12 lg:pb-4">
          {/* Close Button - Mobile: Full row, Desktop: Absolute positioned */}
          <div className="flex justify-end mb-2 lg:hidden">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Desktop Close Button */}
          <button
            onClick={onClose}
            className={`hidden lg:block absolute top-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors ${
              isRTL ? 'left-4' : 'right-4'
            }`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4 items-center">
            {/* Image Column */}
            <div className="lg:order-1">
              {popup.imageUrl && (
                <div className="w-full flex justify-center mb-4 lg:mb-0">
                  <img
                    src={getFullImageUrl(popup.imageUrl)}
                    alt="Popup"
                    className="w-full h-auto max-h-[40vh] object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Text Column */}
            <div className={`lg:order-2 flex flex-col justify-center lg:items-start ${
              isRTL ? 'lg:text-right' : 'lg:text-left'
            } items-center text-center`}>
              {/* Header */}
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 lg:mb-5">
                {getLocalizedText(popup.header)}
              </h2>

              {/* Subheader */}
              <div className={`mb-6 lg:mb-6 text-gray-600 leading-relaxed text-lg flex ${
                isRTL ? 'justify-start' : 'justify-start'
              }`}>
                <span>{getLocalizedText(popup.subheader)}</span>
              </div>

              {/* Button */}
              <button
                onClick={handleButtonClick}
                className={`bg-gymmawy-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-gymmawy-primary/90 transition-colors flex items-center justify-center gap-2 w-fit text-lg ${
                  isRTL ? 'lg:ml-auto' : 'lg:mr-auto'
                }`}
              >
                {getLocalizedText(popup.buttonText)}
                {popup.buttonLink && popup.buttonLink.startsWith('http') && (
                  <ExternalLink className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepagePopup;
