// src/components/Programme.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import { Award, Gift, Info } from 'lucide-react';
import AuthRequiredModal from '../modals/AuthRequiredModal';
import useAuthRequired from '../../hooks/useAuthRequired';
import { config } from '../../config';
import { getGymmawyCoinIcon } from '../../utils/currencyUtils';
import programmeService from '../../services/programmeService';

export default function Programme({ image, name, price, programme }) {
    const { t, i18n } = useTranslation('programmes');
    const { user, isAuthenticated } = useAuth();
    const { formatPrice, getCurrencyInfo } = useCurrencyContext();
    const navigate = useNavigate();
    const { requireAuth, showAuthModal, closeAuthModal } = useAuthRequired();
    const [loading, setLoading] = useState(false);
    const [showLoyaltyCard, setShowLoyaltyCard] = useState(false);
    const loyaltyCardRef = useRef(null);
    
    // Debug: Log programme data to check Gymmawy Coins
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
        if (!imagePath || imagePath.trim() === '') {
            return '/assets/common/store/product1-1.png';
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

    // Helper function to check if programme is free
    const isFreeProgramme = () => {
      if (!programme) return false;
      
      // Check if any price is 0 or null/undefined
      const prices = [
        programme.priceEGP?.amount ?? programme.priceEGP,
        programme.priceSAR?.amount ?? programme.priceSAR,
        programme.priceAED?.amount ?? programme.priceAED,
        programme.priceUSD?.amount ?? programme.priceUSD
      ];
      
      
      // A programme is free if any price is 0, null, or undefined
      return prices.some(price => price === 0 || price === null || price === undefined);
    };

    const handleFreeProgrammePurchase = async () => {
      try {
        setLoading(true);
        const { currency } = getCurrencyInfo();
        const result = await programmeService.purchaseFreeProgramme(programme.id, currency);
        
        // Show success modal instead of alert
        const successMessage = result.message || 'Free programme purchased successfully! Check your email for the programme.';
        
        // Create a custom modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md mx-auto m-4 shadow-xl">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Success!</h3>
              <p class="text-sm text-gray-600 mb-4">${successMessage}</p>
              <button 
                onclick="this.closest('.fixed').remove(); window.location.reload();" 
                class="w-full bg-gymmawy-primary text-white px-4 py-2 rounded-lg hover:bg-gymmawy-primary-dark transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove modal after 5 seconds
        setTimeout(() => {
          if (modal.parentNode) {
            modal.remove();
            window.location.reload();
          }
        }, 5000);
        
      } catch (error) {
        console.error('Free programme purchase error:', error);
        
        // Show error modal
        const errorModal = document.createElement('div');
        errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        errorModal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md mx-auto m-4 shadow-xl">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p class="text-sm text-gray-600 mb-4">${error.message || 'Failed to purchase free programme. Please try again.'}</p>
              <button 
                onclick="this.closest('.fixed').remove();" 
                class="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(errorModal);
      } finally {
        setLoading(false);
      }
    };

    const handlePurchase = () => {
      requireAuth(() => {
        // User is authenticated, proceed with purchase
        if (!programme?.id) {
          alert('Programme information is not available');
          return;
        }

        // Check if this is a free programme
        if (isFreeProgramme()) {
          handleFreeProgrammePurchase();
          return;
        }

        // Navigate to checkout with programme data for paid programmes
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
        {/* Gymmawy Coins Badge - Top corner */}
        {((programme?.loyaltyPointsAwarded > 0 || programme?.loyaltyPointsRequired > 0)) && (
          <div className="absolute top-3 right-3 z-10">
            <div className="group relative" ref={loyaltyCardRef}>
              {/* Info Icon Trigger */}
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200 w-fit shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLoyaltyCard(!showLoyaltyCard);
                }}
              >
                <span className="text-sm font-bold text-purple-700">
                  {i18n.language === 'ar' ? 'عملات جيماوي' : 'Gymmawy Coins'}
                </span>
                <Info className="h-4 w-4 text-purple-500" />
              </div>
              
              {/* Hover Card */}
              <div className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-64 max-w-[calc(100vw-2rem)] p-3 bg-white rounded-lg shadow-xl border-2 border-purple-200 transition-all duration-300 z-[99999] ${showLoyaltyCard ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                {/* Arrow */}
                <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                
                {/* Content */}
                <div className="relative">
                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {i18n.language === 'ar' 
                        ? 'عملات جيماوي المتضمنة'
                        : 'Gymmawy Coins included'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                    {programme.loyaltyPointsAwarded > 0 && (
                      <div className="flex items-center gap-1 flex-1 justify-center">
                        {getGymmawyCoinIcon({ size: 32 })}
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
                        {getGymmawyCoinIcon({ size: 32 })}
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
        
        <img 
          src={getImageUrl(image)} 
          alt={getBilingualText(name, 'Programme')} 
          className="w-full h-auto object-cover"
          loading="lazy"
        />
         <div className="p-3 sm:p-4 flex flex-col flex-grow text-start" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          
          <h3 className="text-lg sm:text-2xl font-bold mb-2">{getBilingualText(name, 'Programme')}</h3>
          
          {/* Price display with discount handling */}
          <div className="mb-3 sm:mb-4 relative">
            {isFreeProgramme() ? (
              <p className="text-xl sm:text-2xl text-orange-500 font-bold">
                {i18n.language === 'ar' ? 'مجاني' : 'FREE'}
              </p>
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
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handlePurchase}
            disabled={loading}
            className="mt-auto w-full bg-[#281159] text-white py-2 px-3 sm:px-4 rounded-lg font-semibold hover:bg-[#3f0071] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading 
              ? (isFreeProgramme() 
                  ? (i18n.language === 'ar' ? 'جاري التحميل...' : 'Getting...') 
                  : t("purchasing")
                ) 
              : (isFreeProgramme() 
                  ? (i18n.language === 'ar' ? 'احصل عليه مجاناً' : 'Get Free') 
                  : t("button")
                )
            }
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
  