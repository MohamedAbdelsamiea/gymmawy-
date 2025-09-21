import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ProductCard from '../../components/common/ProductCard';

const StorePage = () => {
  const { t, i18n } = useTranslation('store');
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Static product data for now
  const newArrivals = [
    {
      id: 1,
      name: "ORIGINAL GYMMAWY BLACK COMPRESSION",
      price: 1299,
      discountedPrice: 899,
      image: "store/product1-1.png",
      hasDiscount: true
    },
    {
      id: 2,
      name: "ORIGINAL GYMMAWY BLACK PANTS",
      price: 1600,
      discountedPrice: 1340,
      image: "store/product2-1.png",
      hasDiscount: true
    }
  ];

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative py-8 lg:py-16 overflow-hidden"
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
              <div className="w-full flex flex-col justify-end h-full sm:h-auto sm:justify-start">
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
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#190143]">NEW ARRIVALS</h2>
          </div>

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