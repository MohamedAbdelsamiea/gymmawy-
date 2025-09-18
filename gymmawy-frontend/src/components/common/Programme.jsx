// src/components/Programme.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config';

export default function Programme({ image, name, price, programme }) {
    const { t, i18n } = useTranslation('programmes');
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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
        if (imagePath.startsWith('http')) {
return imagePath;
} // Already a full URL
        if (imagePath.startsWith('/uploads/')) {
            return `${config.API_BASE_URL}${imagePath}`;
        }
        return imagePath; // Return as-is for other cases
    };

    const handlePurchase = () => {
      if (!isAuthenticated) {
        // Redirect to login with return path
        navigate('/auth/login', { 
          state: { from: '/checkout', plan: programme, type: 'programme' }, 
        });
        return;
      }

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
    };

    return (
      <div className="bg-[#190143] overflow-hidden flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <img src={getImageUrl(image)} alt={getBilingualText(name, 'Programme')} className="w-full h-auto object-cover" />
         <div className="p-4 flex flex-col flex-grow text-start" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-2xl font-bold mb-2">{getBilingualText(name, 'Programme')}</h3>
          
          {/* Price display with discount handling */}
          <div className="mb-4">
            {price === 'FREE' || price === 'مجاني' ? (
              <p className="text-2xl text-orange-500 font-bold">{price}</p>
            ) : programme?.discountPercentage > 0 ? (
              // Display discounted price similar to packages section
              <div className="flex flex-col items-start">
                <div className={`flex items-center ${i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <span className="text-lg text-gray-400 line-through">
                    {(() => {
                      // Get the original price from programme data
                      const originalPrice = programme.priceEGP?.originalAmount || 
                                         programme.priceSAR?.originalAmount || 
                                         programme.priceAED?.originalAmount || 
                                         programme.priceUSD?.originalAmount;
                      
                      if (originalPrice) {
                        // Use the currency symbol from the current price display
                        const currencySymbol = price.replace(/\d+(?:\.\d+)?/g, '').trim();
                        return `${originalPrice.toFixed(0)} ${currencySymbol}`;
                      }
                      return price;
                    })()}
                  </span>
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                    -{programme.discountPercentage}%
                  </span>
                </div>
                <span className="text-2xl font-bold text-orange-400 mt-1">
                  {(() => {
                    // Extract price and currency from the formatted price string
                    const priceMatch = price.match(/(\d+(?:\.\d+)?)/);
                    const currencySymbol = price.replace(/\d+(?:\.\d+)?/g, '').trim();
                    if (priceMatch && currencySymbol) {
                      return `${priceMatch[1]} ${currencySymbol}`;
                    }
                    return price;
                  })()}
                </span>
              </div>
            ) : (
              <p className="text-2xl">
                {(() => {
                  // Extract price and currency from the formatted price string
                  const priceMatch = price.match(/(\d+(?:\.\d+)?)/);
                  const currencySymbol = price.replace(/\d+(?:\.\d+)?/g, '').trim();
                  if (priceMatch && currencySymbol) {
                    return `${priceMatch[1]} ${currencySymbol}`;
                  }
                  return price;
                })()}
              </p>
            )}
          </div>
          <button 
            onClick={handlePurchase}
            disabled={loading}
            className="mt-auto w-full bg-[#281159] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#3f0071] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("purchasing") : t("button")}
          </button>
        </div>
      </div>
    );
  }
  