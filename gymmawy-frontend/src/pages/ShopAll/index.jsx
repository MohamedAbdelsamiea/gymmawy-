import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAsset } from '../../hooks/useAsset';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ProductCard from '../../components/common/ProductCard';

const ShopAllPage = () => {
  const { t, i18n } = useTranslation('store');
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Static product data for now - expanded list
  const products = [
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
    },
    {
      id: 3,
      name: "GYMMAWY WHITE COMPRESSION SHIRT",
      price: 1200,
      discountedPrice: 950,
      image: "store/product1-2.png",
      hasDiscount: true
    },
    {
      id: 4,
      name: "GYMMAWY GRAY SWEATPANTS",
      price: 1400,
      discountedPrice: 1100,
      image: "store/product2-2.png",
      hasDiscount: true
    },
    {
      id: 5,
      name: "GYMMAWY BLACK HOODIE",
      price: 1800,
      image: "store/product1-3.png",
      hasDiscount: false
    },
    {
      id: 6,
      name: "GYMMAWY NAVY SHORTS",
      price: 800,
      discountedPrice: 650,
      image: "store/product2-3.png",
      hasDiscount: true
    },
    {
      id: 7,
      name: "GYMMAWY WHITE TANK TOP",
      price: 600,
      image: "store/product1-4.png",
      hasDiscount: false
    },
    {
      id: 8,
      name: "GYMMAWY BLACK JOGGERS",
      price: 1500,
      discountedPrice: 1200,
      image: "store/product2-4.png",
      hasDiscount: true
    }
  ];

  const loading = false;
  const error = null;

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
  const darkTypo = useAsset("store/for a real gymmawy dark.png", "common"); // Dark typo as requested

  return (
    <div className="min-h-screen bg-white">
      {/* Typo Section - Centered at top */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-center items-center">
            <img src={darkTypo} alt="FOR A REAL GYMMAWY" className="h-auto max-w-full scale-90 sm:scale-95 md:scale-100" />
          </div>
        </div>
      </section>

      {/* Products Section - 2 columns */}
      <section className="py-6 sm:py-8 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {products.map((product) => (
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

      {/* Purple Separator Line */}
      <div className="pt-8 sm:pt-12 md:pt-16 pb-2 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="h-px bg-[#190143]"></div>
        </div>
      </div>
    </div>
  );
};

export default ShopAllPage;
