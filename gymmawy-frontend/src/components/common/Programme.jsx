// src/components/Programme.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import { Award, Gift, Info } from 'lucide-react';
import AuthRequiredModal from '../modals/AuthRequiredModal';
import useAuthRequired from '../../hooks/useAuthRequired';
import { config } from '../../config';

export default function Programme({ image, name, price, programme }) {
    const { t, i18n } = useTranslation('programmes');
    const { user, isAuthenticated } = useAuth();
    const { formatPrice, getCurrencyInfo } = useCurrencyContext();
    const navigate = useNavigate();
    const { requireAuth, showAuthModal, closeAuthModal } = useAuthRequired();
    const [loading, setLoading] = useState(false);
    const [showLoyaltyCard, setShowLoyaltyCard] = useState(false);
    const loyaltyCardRef = useRef(null);
    
    // Debug: Log programme data to check Gymmawy Points
    console.log('Programme data:', {
      name,
      loyaltyPointsAwarded: programme?.loyaltyPointsAwarded,
      loyaltyPointsRequired: programme?.loyaltyPointsRequired,
      discountPercentage: programme?.discountPercentage
    });

    // Close loyalty card when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (loyaltyCardRef.current && !loyaltyCardRef.current.contains(event.target)) {
          setShowLoyaltyCard(false);
        }
      };

      if (showLoyaltyCard) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [showLoyaltyCard]);

    // Helper function to calculate discounted price
    const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
        if (discountPercentage > 0) {
            return originalPrice * (1 - discountPercentage / 100);
        }
        return originalPrice;
    };

    // Helper function to get bilingual text
    const getBilingualText = (text, fallback = '') => {
        if (!text) {
return fallback;
}
        if (typeof text === 'object') {
            return i18n.language === 'ar' && text.ar 
                ? text.ar 
                : text.en || text.ar || fallback;
        }
        return text || fallback;
    };


    // Construct full image URL if it's a relative path
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
return '';
}
        // Convert full URLs to API routes
        if (imagePath.startsWith('https://gym.omarelnemr.xyz/uploads/')) {
            // Convert to API route
            const pathPart = imagePath.replace('https://gym.omarelnemr.xyz/uploads/', 'uploads/');
            return `${config.API_BASE_URL}/${pathPart}`;
        }
        if (imagePath.startsWith('http')) {
return imagePath;
} // Other full URLs
        if (imagePath.startsWith('/uploads/')) {
            // Use API route for uploads
            const cleanPath = imagePath.substring(1);
            return `${config.API_BASE_URL}/${cleanPath}`;
        }
        return imagePath; // Return as-is for other cases
    };

    const handlePurchase = () => {
      requireAuth(() => {
        // User is authenticated, proceed with purchase
        if (!programme?.id) {
          alert('Programme information is not available');
          return;
        }

        // Navigate to checkout with programme data
        navigate('/checkout', {
          state: {
            plan: {
              id: programme.id,
              name: programme.name,
              price: programme.price,
              priceEGP: programme.priceEGP,
              priceSAR: programme.priceSAR,
              priceAED: programme.priceAED,
              priceUSD: programme.priceUSD,
              discountPercentage: programme.discountPercentage || 0,
              benefits: programme.benefits || [],
              image: programme.image || programme.imageUrl,
              imageUrl: programme.imageUrl,
              description: programme.description,
            },
            type: 'programme',
          },
        });
      });
    };

    return (
      <div className="bg-[#190143] overflow-hidden flex flex-col relative" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <img 
          src={getImageUrl(image)} 
          alt={getBilingualText(name, 'Programme')} 
          className="w-full h-auto object-cover"
          loading="lazy"
        />
         <div className="p-3 sm:p-4 flex flex-col flex-grow text-start" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Gymmawy Points Badge - above name on mobile, hidden on desktop */}
          {((programme?.loyaltyPointsAwarded > 0 || programme?.loyaltyPointsRequired > 0)) && (
            <div className="block sm:hidden mb-2">
              <div className="group relative" ref={loyaltyCardRef}>
                {/* Info Icon Trigger */}
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200 w-fit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLoyaltyCard(!showLoyaltyCard);
                  }}
                >
                  <Award className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">
                    {i18n.language === 'ar' ? 'نقاط' : 'Points'}
                  </span>
                </div>
                
                {/* Hover Card */}
                <div className={`absolute ${i18n.language === 'ar' ? 'left-1/2 -translate-x-1/2' : 'right-1/2 translate-x-1/2'} top-full mt-2 w-48 sm:w-48 max-w-[calc(100vw-2rem)] p-2 bg-white rounded-lg shadow-xl border-2 border-purple-200 transition-all duration-300 z-[99999] ${showLoyaltyCard ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                  {/* Arrow */}
                  <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-1/2 -translate-x-1/2' : 'right-1/2 translate-x-1/2'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                  
                  {/* Content */}
                  <div className="relative">
                    <div className="text-center mb-1">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {i18n.language === 'ar' 
                          ? 'نقاط جيماوي المتضمنة'
                          : 'Gymmawy Points included'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                      {programme.loyaltyPointsAwarded > 0 && (
                        <div className="flex items-center gap-1 flex-1 justify-center">
                          <div className="p-1 bg-green-100 rounded-full">
                            <Gift className="h-3 w-3 text-green-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكسب' : 'Earn'}</span>
                            <span className="text-xs font-bold text-green-700">
                              {programme.loyaltyPointsAwarded}
                            </span>
                          </div>
                        </div>
                      )}
                      {programme.loyaltyPointsRequired > 0 && (
                        <div className="flex items-center gap-1 flex-1 justify-center">
                          <div className="p-1 bg-orange-100 rounded-full">
                            <Award className="h-3 w-3 text-orange-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكلف' : 'Cost'}</span>
                            <span className="text-xs font-bold text-orange-700">
                              {programme.loyaltyPointsRequired}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <h3 className="text-lg sm:text-2xl font-bold mb-2">{getBilingualText(name, 'Programme')}</h3>
          
          {/* Price display with discount handling */}
          <div className="mb-3 sm:mb-4 relative">
            {price === 'FREE' || price === 'مجاني' ? (
              <p className="text-xl sm:text-2xl text-orange-500 font-bold">{price}</p>
            ) : programme?.discountPercentage > 0 ? (
              // Display discounted price similar to packages section
              <div className="flex flex-col items-start">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    {/* Original Price - first in both languages */}
                    <span className={`text-sm sm:text-lg text-gray-400 line-through order-1`}>
                      {(() => {
                        // Get the original price from programme data
                        const originalPrice = programme.priceEGP?.originalAmount || 
                                           programme.priceSAR?.originalAmount || 
                                           programme.priceAED?.originalAmount || 
                                           programme.priceUSD?.originalAmount;
                        
                        if (originalPrice) {
                          // Use CurrencyContext to format the original price properly
                          return formatPrice(originalPrice);
                        }
                        return price;
                      })()}
                    </span>
                    
                    {/* Discount Badge - second in both languages */}
                    <span className={`bg-orange-100 text-orange-800 text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded order-2`} dir="ltr">
                      -{programme.discountPercentage}%
                    </span>
                  </div>
                  
                  {/* Gymmawy Points Badge - on the opposite side (desktop only) */}
                  {((programme.loyaltyPointsAwarded > 0 || programme.loyaltyPointsRequired > 0)) && (
                    <div className="hidden sm:block self-start sm:ml-auto">
                    <div className="group relative">
                      {/* Info Icon Trigger */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200">
                        <Award className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700">
                          {i18n.language === 'ar' ? 'نقاط' : 'Points'}
                        </span>
                      </div>
                      
                      {/* Hover Card */}
                      <div className={`absolute ${i18n.language === 'ar' ? 'left-1/2 -translate-x-1/2' : 'right-1/2 translate-x-1/2'} top-full mt-2 w-48 max-w-[calc(100vw-2rem)] p-2 bg-white rounded-lg shadow-xl border-2 border-purple-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-active:opacity-100 group-active:visible transition-all duration-300 z-[99999]`}>
                        {/* Arrow */}
                        <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-1/2 -translate-x-1/2' : 'right-1/2 translate-x-1/2'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                        
                        {/* Content */}
                        <div className="relative">
                          <div className="text-center mb-1">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {i18n.language === 'ar' 
                                ? 'نقاط جيماوي المتضمنة'
                                : 'Gymmawy Points included'}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                            {programme.loyaltyPointsAwarded > 0 && (
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                <div className="p-1 bg-green-100 rounded-full">
                                  <Gift className="h-3 w-3 text-green-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكسب' : 'Earn'}</span>
                                  <span className="text-xs font-bold text-green-700">
                                    {programme.loyaltyPointsAwarded}
                                  </span>
                                </div>
                              </div>
                            )}
                            {programme.loyaltyPointsRequired > 0 && (
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                <div className="p-1 bg-orange-100 rounded-full">
                                  <Award className="h-3 w-3 text-orange-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكلف' : 'Cost'}</span>
                                  <span className="text-xs font-bold text-orange-700">
                                    {programme.loyaltyPointsRequired}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-bold text-orange-400 mt-1">
                  {price}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-start">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-xl sm:text-2xl">
                    {price}
                  </p>
                  
                  {/* Gymmawy Points Badge - for non-discounted programmes (desktop only) */}
                  {((programme?.loyaltyPointsAwarded > 0 || programme?.loyaltyPointsRequired > 0)) && (
                    <div className="hidden sm:block self-start sm:ml-auto">
                    <div className="group relative">
                      {/* Info Icon Trigger */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200">
                        <Award className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700">
                          {i18n.language === 'ar' ? 'نقاط' : 'Points'}
                        </span>
                      </div>
                      
                      {/* Hover Card */}
                      <div className={`absolute ${i18n.language === 'ar' ? 'left-1/2 -translate-x-1/2' : 'right-1/2 translate-x-1/2'} top-full mt-2 w-48 max-w-[calc(100vw-2rem)] p-2 bg-white rounded-lg shadow-xl border-2 border-purple-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-active:opacity-100 group-active:visible transition-all duration-300 z-[99999]`}>
                        {/* Arrow */}
                        <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-1/2 -translate-x-1/2' : 'right-1/2 translate-x-1/2'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                        
                        {/* Content */}
                        <div className="relative">
                          <div className="text-center mb-1">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {i18n.language === 'ar' 
                                ? 'نقاط جيماوي المتضمنة'
                                : 'Gymmawy Points included'}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                            {programme.loyaltyPointsAwarded > 0 && (
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                <div className="p-1 bg-green-100 rounded-full">
                                  <Gift className="h-3 w-3 text-green-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكسب' : 'Earn'}</span>
                                  <span className="text-xs font-bold text-green-700">
                                    {programme.loyaltyPointsAwarded}
                                  </span>
                                </div>
                              </div>
                            )}
                            {programme.loyaltyPointsRequired > 0 && (
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                <div className="p-1 bg-orange-100 rounded-full">
                                  <Award className="h-3 w-3 text-orange-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكلف' : 'Cost'}</span>
                                  <span className="text-xs font-bold text-orange-700">
                                    {programme.loyaltyPointsRequired}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handlePurchase}
            disabled={loading}
            className="mt-auto w-full bg-[#281159] text-white py-2 px-3 sm:px-4 rounded-lg font-semibold hover:bg-[#3f0071] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? t("purchasing") : t("button")}
          </button>
        </div>

        {/* Auth Required Modal */}
        <AuthRequiredModal
          isOpen={showAuthModal}
          onClose={closeAuthModal}
        />
      </div>
    );
  }
  