import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsset } from '../../hooks/useAsset';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ProductCard from '../../components/common/ProductCard';
import storeService from '../../services/storeService';

const ShopAllPage = () => {
  const { t, i18n } = useTranslation('store');
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await storeService.getAllProducts({ 
          skip: (page - 1) * 20,
          take: 20,
          currency: 'EGP' // Default currency, can be made dynamic
        });
        console.log('All products API response:', response);
        
        const transformedProducts = (response.items || []).map(transformProduct);
        console.log('Transformed products:', transformedProducts);
        
        if (page === 1) {
          setProducts(transformedProducts);
        } else {
          setProducts(prev => [...prev, ...transformedProducts]);
        }
        
        setHasMore((response.items || []).length === 20);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err.message);
        // Fallback to empty array on error
        if (page === 1) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page]);

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

  // Load more products
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };


  // Store assets
  const darkTypo = useAsset("store/for a real gymmawy dark.png", "common"); // Dark typo as requested

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Typo Section - Centered at top */}
      <section className="py-8 sm:py-12 md:py-16 bg-white" dir="ltr">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-center items-center">
            <img src={darkTypo} alt="FOR A REAL GYMMAWY" className="h-auto max-w-full scale-90 sm:scale-95 md:scale-100" />
          </div>
        </div>
      </section>

      {/* Products Section - 2 columns */}
      <section className="py-6 sm:py-8 bg-white" dir="ltr">
        <div className="container mx-auto px-4 sm:px-6">
          {loading && page === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">Failed to load products</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-[#190143] text-white rounded-lg hover:bg-[#281159] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products found</p>
            </div>
          ) : (
            <>
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
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-[#190143] text-white rounded-lg hover:bg-[#281159] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </>
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
