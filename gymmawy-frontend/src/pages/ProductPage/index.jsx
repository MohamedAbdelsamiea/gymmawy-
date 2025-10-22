import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useCart } from '../../contexts/CartContext';
import { ChevronLeft, ChevronRight, Plus, Minus, Award, Gift, Info } from 'lucide-react';
import storeService from '../../services/storeService';
import { config } from '../../config';
import TabbyPromo from '../../components/payment/TabbyPromo';
import useTabbyPromo from '../../hooks/useTabbyPromo';
import { useTranslation } from 'react-i18next';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import AuthRequiredModal from '../../components/modals/AuthRequiredModal';
import useAuthRequired from '../../hooks/useAuthRequired';
import { getGymmawyCoinIcon } from '../../utils/currencyUtils';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const { addToCart, loading: cartLoading } = useCart();
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthRequired();
  const { isSupported: isTabbySupported, currentCountry } = useTabbyPromo();
  const { i18n } = useTranslation();
  const { currency, formatPrice, getCurrencyInfo } = useCurrencyContext();

  // State for product interactions
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // State for product data
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Load product from API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await storeService.getProduct(id);
        console.log('Product API response:', response);
        
        if (response.product) {
          console.log('Product API response:', response.product);
          console.log('Product prices:', response.product.prices);
          setProduct(response.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  // Load related products
  useEffect(() => {
    const loadRelatedProducts = async () => {
      if (!id) return;
      
      try {
        setRelatedLoading(true);
        const response = await storeService.getRelatedProducts(id, { 
          limit: 4,
          currency: 'EGP' 
        });
        console.log('Related products API response:', response);
        
        const transformedRelated = (response.items || []).map(transformProduct);
        console.log('Transformed related products:', transformedRelated);
        setRelatedProducts(transformedRelated);
      } catch (err) {
        console.error('Error loading related products:', err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    if (id) {
      loadRelatedProducts();
    }
  }, [id]);

  // Transform API product data
  const transformProduct = (apiProduct) => {
    const primaryImage = apiProduct.images?.find(img => img.isPrimary) || apiProduct.images?.[0];
    
    // Get price for current currency, fallback to EGP
    const currentPrice = apiProduct.prices?.find(p => p.currency === currency);
    const fallbackPrice = apiProduct.prices?.find(p => p.currency === 'EGP');
    const priceData = currentPrice || fallbackPrice;
    const price = priceData?.amount ? parseFloat(priceData.amount) : 0;
    const discountPercentage = apiProduct.discountPercentage || 0;
    const discountedPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
    
    // Handle image URL - check if it's an API image or local asset
    const getImageSrc = (imagePath) => {
      if (!imagePath) return '/assets/common/store/product1-1.png'; // Fallback
      
      if (imagePath.startsWith('/uploads/')) {
        const baseUrl = config.API_BASE_URL.replace('/api', '');
        return `${baseUrl}${imagePath}`;
      }
      return imagePath;
    };
    
    const productImage = primaryImage?.url ? getImageSrc(primaryImage.url) : '/assets/common/store/product1-1.png';
    
    console.log('Transform product - Current Currency:', currency);
    console.log('Transform product - Price Data:', priceData);
    console.log('Transform product - Price:', price);
    console.log('Transform product - Discount:', discountPercentage);
    console.log('Transform product - Discounted Price:', discountedPrice);
    console.log('Transform product - Primary Image:', primaryImage);
    console.log('Transform product - Final Image:', productImage);
    
    return {
      id: apiProduct.id,
      name: apiProduct.name?.en || apiProduct.name || 'Unnamed Product',
      price: price,
      discountedPrice: discountedPrice,
      hasDiscount: discountPercentage > 0,
      stock: apiProduct.stock || 0,
      image: productImage, // Single image for related products
      loyaltyPointsAwarded: apiProduct.loyaltyPointsAwarded || 0,
      loyaltyPointsRequired: apiProduct.loyaltyPointsRequired || 0,
      images: apiProduct.images?.map(img => img.url) || [],
      description: apiProduct.description?.en || apiProduct.description || '',
      sizes: ['S', 'M', 'L', 'XL'], // Default sizes for now
      productDetails: "Made from premium moisture-wicking fabric with compression technology. Features ergonomic seams and flatlock stitching for maximum comfort. Perfect for intense workouts and training sessions.",
      careInstructions: "Machine wash cold with like colors. Do not bleach. Tumble dry low. Iron on low heat if needed. Do not dry clean.",
      sizeChart: "S: Chest 36-38\", M: Chest 38-40\", L: Chest 40-42\", XL: Chest 42-44\""
    };
  };

  const transformedProduct = product ? transformProduct(product) : null;
  
  // Helper function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/assets/common/store/product1-1.png';
    
    if (imagePath.startsWith('/uploads/')) {
      return `${config.STATIC_BASE_URL}${imagePath}`;
    }
    
    // For local assets, we need to handle this differently since useAsset can't be called conditionally
    // We'll use a fallback approach
    return imagePath;
  };
  
  const currentImage = transformedProduct?.images?.[currentImageIndex] 
    ? getImageUrl(transformedProduct.images[currentImageIndex])
    : '/assets/common/store/product1-1.png';

  // Helper functions
  const nextImage = () => {
    if (isTransitioning || !transformedProduct?.images?.length) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % transformedProduct.images.length);
      setIsTransitioning(false);
    }, 150);
  };

  const prevImage = () => {
    if (isTransitioning || !transformedProduct?.images?.length) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + transformedProduct.images.length) % transformedProduct.images.length);
      setIsTransitioning(false);
    }, 150);
  };

  const goToImage = (index) => {
    if (isTransitioning || index === currentImageIndex || !transformedProduct?.images?.length) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const toggleAccordion = (section) => {
    setExpandedAccordion(expandedAccordion === section ? null : section);
  };

  const handleAddToCart = async () => {
    requireAuth(async () => {
      // User is authenticated, proceed with adding to cart
      if (!transformedProduct) {
        showError('Product not loaded');
        return;
      }

      if (transformedProduct.stock === 0) {
        showError('This product is out of stock');
        return;
      }

      try {
        await addToCart(transformedProduct.id, quantity, selectedSize);
        showSuccess(`Added ${quantity} ${transformedProduct.name} (Size: ${selectedSize}) to cart`);
      } catch (error) {
        console.error('Error adding to cart:', error);
        showError(error.message || 'Failed to add product to cart');
      }
    });
  };

  const handleBuyNow = () => {
    requireAuth(() => {
      // User is authenticated, proceed with buy now
      if (!transformedProduct) {
        showError('Product not loaded');
        return;
      }

      if (transformedProduct.stock === 0) {
        showError('This product is out of stock');
        return;
      }

      // Navigate to checkout with product data for immediate purchase
      navigate('/checkout', {
        state: {
          product: {
            id: transformedProduct.id,
            name: transformedProduct.name,
            price: transformedProduct.price,
            discountedPrice: transformedProduct.discountedPrice,
            hasDiscount: transformedProduct.hasDiscount,
            image: transformedProduct.image,
            quantity: quantity,
            size: selectedSize,
            stock: transformedProduct.stock,
          },
          type: 'product',
          buyNow: true, // Flag to indicate this is a buy now purchase
        },
      });
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#190143] mx-auto mb-4"></div>
          <p className="text-[#190143] text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !transformedProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Product not found'}</p>
          <button 
            onClick={() => navigate('/store')} 
            className="px-4 py-2 bg-[#190143] text-white rounded-lg hover:bg-[#281159] transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white product-page" dir="ltr">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16" dir="ltr">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
          {/* Product Image Carousel */}
          <div className="relative">
            <div className="aspect-square relative overflow-hidden">
              <div className="relative w-full h-full">
                <img
                  src={currentImage}
                  alt={transformedProduct.name}
                  className={`w-full h-full object-cover transition-all duration-300 ease-in-out ${
                    isTransitioning ? 'opacity-50 scale-105' : 'opacity-100 scale-100'
                  }`}
                  key={currentImageIndex}
                  onError={(e) => {
                    e.target.src = '/assets/common/store/product1-1.png';
                  }}
                />
              </div>
              
              {/* Out of Stock Overlay */}
              {transformedProduct.stock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <div className="bg-white px-6 py-3 rounded-lg">
                    <span className="text-red-600 font-bold text-lg">OUT OF STOCK</span>
                  </div>
                </div>
              )}
              
              {/* Carousel Navigation */}
              {transformedProduct.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-80 p-2 sm:p-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6 text-[#190143]" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-60 hover:bg-opacity-80 p-2 sm:p-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6 text-[#190143]" />
                  </button>
                </>
              )}
            </div>

            {/* Image Thumbnails */}
            {transformedProduct.images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 justify-center">
                {transformedProduct.images.map((image, index) => {
                  const thumbnailSrc = getImageUrl(image);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`w-12 h-12 sm:w-16 sm:h-16 overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-[#190143] ring-opacity-30' 
                          : 'hover:bg-[#190143] hover:bg-opacity-10'
                      }`}
                    >
                      <img
                        src={thumbnailSrc}
                        alt={`${transformedProduct.name} ${index + 1}`}
                        className="w-full h-full object-cover transition-all duration-300"
                        onError={(e) => {
                          e.target.src = '/assets/common/store/product1-1.png';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6 px-4 sm:px-8 md:px-16 lg:px-28">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#190143] mb-3 sm:mb-4">{transformedProduct.name}</h1>
              
              {/* Stock Status */}
              {transformedProduct.stock === 0 && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <span className="text-red-600 font-semibold">This product is currently out of stock</span>
                </div>
              )}
              
              {/* Pricing */}
              <div className="mb-6">
                {transformedProduct.hasDiscount ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-bold text-[#190143]">
                      {formatPrice(transformedProduct.discountedPrice)}
                    </span>
                    <span className="text-2xl font-light text-gray-500 line-through">
                      {formatPrice(transformedProduct.price)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-bold text-[#190143]">
                      {formatPrice(transformedProduct.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabby Promo Snippet */}
              {transformedProduct && (
                <div className="mb-6">
                  <TabbyPromo
                    key={`tabby-product-${i18n.language}-${transformedProduct.id}`}
                    price={transformedProduct.hasDiscount ? transformedProduct.discountedPrice : transformedProduct.price}
                    currency={currency}
                    source="product"
                    selector="#TabbyProductPromo"
                    className="w-full"
                    country={currentCountry}
                    shouldInheritBg={false}
                  />
                </div>
              )}

              {/* Size Selection + Gymmawy Coins */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-[#190143] mb-3">Size</h3>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {transformedProduct.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={transformedProduct.stock === 0}
                        className={`w-10 h-10 border border-[#190143] flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                          selectedSize === size
                            ? 'bg-[#190143] text-white'
                            : 'bg-white text-[#190143] hover:bg-[#190143] hover:text-white'
                        } ${transformedProduct.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  
                  {/* Gymmawy Coins Badge */}
                  {(transformedProduct.loyaltyPointsAwarded > 0 || transformedProduct.loyaltyPointsRequired > 0) && (
                    <div className="group relative">
                      <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200">
                        <span className="text-sm font-bold text-purple-700">{i18n.language === 'ar' ? 'عملات جيماوي' : 'Gymmawy Coins'}</span>
                      </div>
                      <div className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-52 p-2 bg-white rounded-lg shadow-xl border-2 border-purple-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50`}>
                        <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                        <div className="relative">
                          <div className="text-center mb-1">
                            <p className="text-xs text-gray-600 leading-relaxed">{i18n.language === 'ar' ? 'عملات جيماوي المتضمنة' : 'Gymmawy Coins included'}</p>
                          </div>
                          <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                            {transformedProduct.loyaltyPointsAwarded > 0 && (
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                {getGymmawyCoinIcon({ size: 32 })}
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكسب' : 'Earn'}</span>
                                  <span className="text-xs font-bold text-green-700">{transformedProduct.loyaltyPointsAwarded}</span>
                                </div>
                              </div>
                            )}
                            {transformedProduct.loyaltyPointsRequired > 0 && (
                              <div className="flex items-center gap-1 flex-1 justify-center">
                                {getGymmawyCoinIcon({ size: 32 })}
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكلف' : 'Cost'}</span>
                                  <span className="text-xs font-bold text-orange-700">{transformedProduct.loyaltyPointsRequired}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selector and Add to Cart */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-[#190143] mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center border border-[#190143] w-28 h-12 ${transformedProduct.stock === 0 ? 'opacity-50' : ''}`}>
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={transformedProduct.stock === 0}
                      className="w-8 h-12 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143] disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleQuantityChange(1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleQuantityChange(-1);
                        }
                      }}
                      disabled={transformedProduct.stock === 0}
                      className="w-12 h-12 text-center text-base font-medium text-[#190143] border-0 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
                      min="1"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={transformedProduct.stock === 0}
                      className="w-8 h-12 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143] disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={transformedProduct.stock === 0 || cartLoading}
                    className={`px-6 py-3 text-base font-medium transition-all duration-300 flex items-center justify-center gap-2 flex-1 h-12 ${
                      transformedProduct.stock === 0 || cartLoading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[#190143] text-white hover:bg-white hover:text-[#190143] hover:border-[#190143] border border-transparent'
                    }`}
                  >
                    {cartLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 13m-10 0h10" />
                      </svg>
                    )}
                    {transformedProduct.stock === 0 ? 'OUT OF STOCK' : cartLoading ? 'ADDING...' : 'ADD TO CART'}
                  </button>
                </div>
              </div>

              {/* Buy Now Button */}
              <div className="mb-6">
                <button
                  onClick={handleBuyNow}
                  disabled={transformedProduct.stock === 0}
                  className={`px-6 py-3 text-base font-medium transition-all duration-300 w-full ${
                    transformedProduct.stock === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#190143] text-white hover:bg-white hover:text-[#190143] hover:border-[#190143] border border-transparent'
                  }`}
                >
                  {transformedProduct.stock === 0 ? 'OUT OF STOCK' : 'BUY IT NOW'}
                </button>
              </div>

              {/* Accordion Sections */}
              <div className="space-y-2">
                {/* Product Details */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('details')}
                    className="w-full flex justify-between items-center py-3 text-left"
                  >
                    <span className="text-base font-medium text-[#190143]">PRODUCT DETAILS</span>
                    <Plus className={`h-6 w-6 text-[#190143] font-bold transition-transform duration-300 flex-shrink-0 ${
                      expandedAccordion === 'details' ? 'rotate-45' : ''
                    }`} />
                  </button>
                    {expandedAccordion === 'details' && (
                      <div className="pb-3 text-gray-700 leading-relaxed text-sm">
                        <ul className="space-y-1">
                          <li>• Advanced compression technology</li>
                          <li>• Moisture-wicking 250GSM Premium fabric</li>
                          <li>• AdvanxedFlex™ 3.0 Multi-Colored Signature Print Front, Back</li>
                        </ul>
                      </div>
                    )}
                </div>

                {/* Care & Maintenance */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('care')}
                    className="w-full flex justify-between items-center py-3 text-left"
                  >
                    <span className="text-base font-medium text-[#190143]">CARE & MAINTENANCE</span>
                    <Plus className={`h-6 w-6 text-[#190143] font-bold transition-transform duration-300 flex-shrink-0 ${
                      expandedAccordion === 'care' ? 'rotate-45' : ''
                    }`} />
                  </button>
                    {expandedAccordion === 'care' && (
                      <div className="pb-3 text-gray-700 leading-relaxed text-sm">
                        <p className="mb-2">To preserve the quality and fit of your product:</p>
                        <ul className="space-y-1">
                          <li>• Always iron inside out.</li>
                          <li>• Avoid hot water to maintain the elegance of the print and the perfect fit of the fabric.</li>
                        </ul>
                      </div>
                    )}
                </div>

                {/* Size Chart */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => toggleAccordion('size')}
                    className="w-full flex justify-between items-center py-3 text-left"
                  >
                    <span className="text-base font-medium text-[#190143]">SIZE CHART</span>
                    <Plus className={`h-6 w-6 text-[#190143] font-bold transition-transform duration-300 flex-shrink-0 ${
                      expandedAccordion === 'size' ? 'rotate-45' : ''
                    }`} />
                  </button>
                    {expandedAccordion === 'size' && (
                      <div className="pb-3 text-gray-700 leading-relaxed text-sm">
                        <img 
                          src="/assets/common/store/size-chart.png" 
                          alt="Size Chart" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-light text-[#190143] mb-8 text-center">RELATED ITEMS</h2>
          
          {relatedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
              ))}
            </div>
          ) : relatedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No related items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="bg-white transition-all duration-300 group">
                  <Link to={`/product/${relatedProduct.id}`}>
                    <div className="relative overflow-hidden">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-auto transition-transform duration-300 group-hover:scale-110"
                      />
                      
                      {/* Out of Stock Overlay */}
                      {relatedProduct.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <div className="bg-white px-4 py-2 rounded-lg">
                            <span className="text-red-600 font-semibold text-sm">OUT OF STOCK</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-left mt-8">
                      <h3 className="text-2xl font-semibold text-[#190143] mb-2">{relatedProduct.name}</h3>
                      
                      <div>
                        {relatedProduct.hasDiscount ? (
                          <div className="flex items-start space-x-4">
                            <span className="text-2xl font-light text-[#190143]">
                              {formatPrice(relatedProduct.discountedPrice)}
                            </span>
                            <span className="text-2xl font-light text-gray-500 line-through">
                              {formatPrice(relatedProduct.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-light text-[#190143]">
                            {formatPrice(relatedProduct.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Purple Separator Line */}
      <div className="pt-16 pb-2 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-px bg-[#190143]"></div>
        </div>
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
      />
    </div>
  );
};

export default ProductPage;
