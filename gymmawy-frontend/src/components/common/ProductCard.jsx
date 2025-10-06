import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Gift, Info } from 'lucide-react';
import { useAsset } from '../../hooks/useAsset';
import { config } from '../../config';

/**
 * ProductCard - A reusable component for displaying product information
 * 
 * @param {Object} product - Product object containing id, name, price, discountedPrice, image, hasDiscount
 * @param {Function} onAddToCart - Callback function when add to cart button is clicked
 * @param {Boolean} showAddToCartButton - Whether to show the add to cart button (default: true)
 * @param {String} className - Additional CSS classes for the card container
 * @param {String} imageClassName - CSS classes for the product image
 * @param {String} titleClassName - CSS classes for the product title
 * @param {String} priceClassName - CSS classes for the regular price
 * @param {String} discountedPriceClassName - CSS classes for the discounted price
 * @param {String} originalPriceClassName - CSS classes for the original price (when discounted)
 * 
 * @example
 * <ProductCard
 *   product={product}
 *   onAddToCart={handleAddToCart}
 *   showAddToCartButton={true}
 * />
 */
const ProductCard = ({ 
  product, 
  onAddToCart, 
  showAddToCartButton = true,
  className = "",
  imageClassName = "w-full h-auto",
  titleClassName = "text-2xl font-semibold text-[#190143] mb-2",
  priceClassName = "text-2xl font-light text-[#190143]",
  discountedPriceClassName = "text-2xl font-light text-[#190143]",
  originalPriceClassName = "text-2xl font-light text-gray-500 line-through"
}) => {
  const { i18n } = useTranslation();
  // Handle both local assets and API URLs
  const getImageSrc = (imagePath) => {
    if (!imagePath) return '/assets/common/store/product1-1.png';
    
    // If it's already a full URL, use it directly
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's an API URL (starts with /uploads/), prepend the backend base URL
    if (imagePath.startsWith('/uploads/')) {
      // Extract the base URL from API_BASE_URL (remove /api)
      const baseUrl = config.API_BASE_URL.replace('/api', '');
      return `${baseUrl}${imagePath}`;
    }
    
    // If it's a local asset path, return as is (will be handled by useAsset)
    return imagePath;
  };

  // Use useAsset for local assets, direct URL for API images
  const isApiImage = product.image && (product.image.startsWith('/uploads/') || product.image.startsWith('http'));
  const productImage = isApiImage ? getImageSrc(product.image) : useAsset(product.image, "common");
  
  // Debug logging (remove in production)
  if (config.ENABLE_DEBUG) {
    console.log('ProductCard - Product:', product.name, 'Image:', product.image, 'IsApiImage:', isApiImage, 'FinalSrc:', productImage);
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id, 1);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className={`bg-white transition-all duration-300 group ${className}`}>
        <div className="relative overflow-hidden">
          <img
            src={productImage}
            alt={product.name}
            className={`${imageClassName} transition-transform duration-300 group-hover:scale-110`}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.target.src = '/assets/common/store/product1-1.png';
            }}
          />
          
          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-lg">
                <span className="text-red-600 font-semibold text-sm">OUT OF STOCK</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-left mt-8">
          <h3 className={titleClassName}>{product.name}</h3>
          
          <div className="relative">
            {product.hasDiscount ? (
              <div className={`flex flex-wrap items-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={discountedPriceClassName}>
                  {product.discountedPrice} LE
                </span>
                <span className={originalPriceClassName}>
                  {product.price} LE
                </span>
                
                {/* Loyalty Points Badge */}
                {((product.loyaltyPointsAwarded > 0 || product.loyaltyPointsRequired > 0)) && (
                  <div className="group relative">
                    {/* Info Icon Trigger */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200">
                      <Award className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700">
                        {i18n.language === 'ar' ? 'نقاط' : 'Points'}
                      </span>
                      <Info className="h-3 w-3 text-purple-600" />
                    </div>
                    
                    {/* Hover Card */}
                    <div className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-48 p-2 bg-white rounded-lg shadow-xl border-2 border-purple-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50`}>
                      {/* Arrow */}
                      <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                      
                      {/* Content */}
                      <div className="relative">
                        <div className="text-center mb-1">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {i18n.language === 'ar' 
                              ? 'نقاط الولاء المتضمنة'
                              : 'Loyalty points included'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                          {product.loyaltyPointsAwarded > 0 && (
                            <div className="flex items-center gap-1 flex-1 justify-center">
                              <div className="p-1 bg-green-100 rounded-full">
                                <Gift className="h-3 w-3 text-green-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكسب' : 'Earn'}</span>
                                <span className="text-xs font-bold text-green-700">
                                  {product.loyaltyPointsAwarded}
                                </span>
                              </div>
                            </div>
                          )}
                          {product.loyaltyPointsRequired > 0 && (
                            <div className="flex items-center gap-1 flex-1 justify-center">
                              <div className="p-1 bg-orange-100 rounded-full">
                                <Award className="h-3 w-3 text-orange-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكلف' : 'Cost'}</span>
                                <span className="text-xs font-bold text-orange-700">
                                  {product.loyaltyPointsRequired}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex flex-wrap items-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={priceClassName}>
                  {product.price} LE
                </span>
                
                {/* Loyalty Points Badge - for non-discounted products */}
                {((product.loyaltyPointsAwarded > 0 || product.loyaltyPointsRequired > 0)) && (
                  <div className="group relative">
                    {/* Info Icon Trigger */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded-full cursor-help transition-colors duration-200">
                      <Award className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-bold text-purple-700">
                        {i18n.language === 'ar' ? 'نقاط' : 'Points'}
                      </span>
                      <Info className="h-3 w-3 text-purple-600" />
                    </div>
                    
                    {/* Hover Card */}
                    <div className={`absolute ${i18n.language === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-48 p-2 bg-white rounded-lg shadow-xl border-2 border-purple-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50`}>
                      {/* Arrow */}
                      <div className={`absolute -top-2 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} w-4 h-4 bg-white border-l-2 border-t-2 border-purple-200 rotate-45`}></div>
                      
                      {/* Content */}
                      <div className="relative">
                        <div className="text-center mb-1">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {i18n.language === 'ar' 
                              ? 'نقاط الولاء المتضمنة'
                              : 'Loyalty points included'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-around gap-2 pt-2 border-t border-gray-200">
                          {product.loyaltyPointsAwarded > 0 && (
                            <div className="flex items-center gap-1 flex-1 justify-center">
                              <div className="p-1 bg-green-100 rounded-full">
                                <Gift className="h-3 w-3 text-green-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكسب' : 'Earn'}</span>
                                <span className="text-xs font-bold text-green-700">
                                  {product.loyaltyPointsAwarded}
                                </span>
                              </div>
                            </div>
                          )}
                          {product.loyaltyPointsRequired > 0 && (
                            <div className="flex items-center gap-1 flex-1 justify-center">
                              <div className="p-1 bg-orange-100 rounded-full">
                                <Award className="h-3 w-3 text-orange-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">{i18n.language === 'ar' ? 'تكلف' : 'Cost'}</span>
                                <span className="text-xs font-bold text-orange-700">
                                  {product.loyaltyPointsRequired}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
