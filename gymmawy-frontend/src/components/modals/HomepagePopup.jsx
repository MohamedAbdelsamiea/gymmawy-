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
    console.log('Popup button clicked, buttonLink:', popup.buttonLink);
    if (popup.buttonLink) {
      if (popup.buttonLink.startsWith('http')) {
        // External link
        console.log('Opening external link:', popup.buttonLink);
        window.open(popup.buttonLink, '_blank');
      } else if (popup.buttonLink.startsWith('#')) {
        // Anchor link - scroll to section
        console.log('Scrolling to anchor:', popup.buttonLink);
        const element = document.querySelector(popup.buttonLink);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.log('Anchor element not found:', popup.buttonLink);
        }
      } else if (popup.buttonLink.includes('#')) {
        // Page + anchor link (e.g., /programmes#programmes)
        const [path, anchor] = popup.buttonLink.split('#');
        console.log('Navigating to page with anchor:', path, anchor);
        navigate(popup.buttonLink);
        // The anchor scrolling will be handled by the browser after navigation
      } else {
        // Internal page link
        console.log('Navigating to internal page:', popup.buttonLink);
        navigate(popup.buttonLink);
      }
    } else {
      console.log('No buttonLink found');
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
        className={`bg-white rounded-2xl shadow-2xl w-auto lg:w-[32rem] max-w-[calc(100vw-2rem)] max-h-[90vh] mx-4 transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        } ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Content */}
        <div className="p-3 pb-4 lg:p-4 lg:pb-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-4 items-center">
            {/* Image Column */}
            <div className="lg:order-1">
              {popup.imageUrl && (
                <div className="w-full flex justify-center mb-3 lg:mb-0 relative">
                  <img
                    src={getFullImageUrl(popup.imageUrl)}
                    alt="Popup"
                    className="w-full h-auto max-h-[40vh] object-contain rounded-lg"
                    loading="lazy"
                  />
                  {/* Mobile Close Button - Over Image */}
                  <button
                    onClick={onClose}
                    className="lg:hidden absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Text Column */}
            <div className={`lg:order-2 flex flex-col justify-center lg:items-start ${
              isRTL ? 'lg:text-right' : 'lg:text-left'
            } items-center text-center`}>
              {/* Header */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 lg:mb-5">
                {getLocalizedText(popup.header)}
              </h2>

              {/* Subheader */}
              <div className={`mb-4 lg:mb-6 text-gray-600 leading-relaxed flex ${
                isRTL ? 'justify-start' : 'justify-start'
              }`}>
                <span>{getLocalizedText(popup.subheader)}</span>
              </div>

              {/* Button */}
              <button
                onClick={handleButtonClick}
                className={`bg-gymmawy-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-gymmawy-primary/90 transition-colors flex items-center justify-center gap-2 w-fit text-sm ${
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
