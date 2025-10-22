import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import ProductCard from '../../components/common/ProductCard';
import storeService from '../../services/storeService';

const StorePage = () => {
  const { t, i18n } = useTranslation('store');
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  
  // State for new arrivals
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transform API product data to ProductCard format
  const transformProduct = (apiProduct) => {
    const primaryImage = apiProduct.images?.find(img => img.isPrimary) || apiProduct.images?.[0];
    const price = apiProduct.price?.amount ? parseFloat(apiProduct.price.amount) : 0;
    const discountPercentage = apiProduct.discountPercentage || 0;
    const discountedPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
    
    return {
      id: apiProduct.id,
      name: apiProduct.name?.en || apiProduct.name || 'Unnamed Product',
      price: price,
      discountedPrice: discountedPrice,
      hasDiscount: discountPercentage > 0,
      stock: apiProduct.stock || 0,
      image: primaryImage?.url || '/assets/common/store/product1-1.png',
      loyaltyPointsAwarded: apiProduct.loyaltyPointsAwarded || 0,
      loyaltyPointsRequired: apiProduct.loyaltyPointsRequired || 0
    };
  };

  // Load new arrivals from API
  useEffect(() => {
    const loadNewArrivals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await storeService.getNewArrivals({ 
          limit: 8,
          currency: 'EGP' // Default currency, can be made dynamic
        });
        console.log('New arrivals API response:', response);
        const transformedProducts = (response.items || []).map(transformProduct);
        console.log('Transformed products:', transformedProducts);
        setNewArrivals(transformedProducts);
      } catch (err) {
        console.error('Error loading new arrivals:', err);
        setError(err.message);
        // Fallback to empty array on error
        setNewArrivals([]);
      } finally {
        setLoading(false);
      }
    };

    loadNewArrivals();
  }, []);

  // Handle anchor scrolling after page load
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      // Wait for the page to fully load, then scroll to the anchor
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  // Handle add to cart
  const handleAddToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      // For now, just show success message
      showSuccess('Product added to cart successfully');
    } catch (error) {
      showError('Failed to add product to cart');
    }
  };

  // Store assets
  const heroBg = useAsset("store/hero-img.png", "common");
  const heroText = useAsset("store/hero-typo.png", "common");
  const shopAllButton = useAsset("store/shop-all-button.png", "common");
  const backgroundImage = useAsset("store/sub-image.png", "common");

  return (
    <div className="min-h-screen" dir="ltr">
      {/* Hero Section */}
      <section
        id="store"
        className="relative pb-8 lg:pb-16 pt-0 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[800px]">
            {/* Text Column */}
            <div
              className={`order-2 md:order-${
                i18n.language === "en" ? 1 : 4
              } lg:col-span-1 flex flex-col justify-end mb-16 h-full sm:h-auto`}
            >
              <div className="w-full flex flex-col justify-end h-full sm:h-auto sm:justify-start mt-8 lg:mt-12">
                <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-14">
                    <img src={heroText} alt="FOR A REAL GYMMAWY" className="h-auto sm:scale-[1.4] md:scale-[1.6] origin-left" />
                </div>
                <div className="transform transition-transform duration-500 hover:scale-105">
                  <Link to="/shop-all">
                    <img src={shopAllButton} alt="SHOP ALL" className="h-auto cursor-pointer sm:scale-115 md:scale-125 origin-left" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Empty Columns */}
            <div className="order-1 md:order-2 lg:col-span-2"></div>
            <div
              className={`order-3 md:order-${
                i18n.language === "en" ? 4 : 1
              } lg:col-span-1`}
            ></div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white" dir="ltr">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#190143]">NEW ARRIVALS</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">Failed to load new arrivals</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-[#190143] text-white rounded-lg hover:bg-[#281159] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : newArrivals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No new arrivals available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  showAddToCartButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Background Image Section */}
      <section>
        <div className="w-full">
          <img
            src={backgroundImage}
            alt="Gymmawy Store"
            className="w-full h-auto"
          />
        </div>
      </section>

    </div>
  );
};

export default StorePage;