import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Gift, Info } from 'lucide-react';
import { useAsset } from '../../hooks/useAsset';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
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
  // Handle both local assets and API URLs
  const getImageSrc = (imagePath) => {
    if (!imagePath || imagePath.trim() === '') return '/assets/common/store/product1-1.png';
    
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
  const productImage = isApiImage ? getImageSrc(product.image) : (product.image && product.image.trim() !== '' ? useAsset(product.image, "common") : '/assets/common/store/product1-1.png');
  
  // Ensure we never have an empty string as image source
  const finalImageSrc = productImage && productImage.trim() !== '' ? productImage : '/assets/common/store/product1-1.png';
  
  // Debug logging (remove in production)
  if (config.ENABLE_DEBUG) {
    console.log('ProductCard - Product:', product.name, 'Image:', product.image, 'IsApiImage:', isApiImage, 'FinalSrc:', productImage);
  }

  const { formatPrice } = useCurrencyContext();

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id, 1);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className={`bg-white transition-all duration-300 group ${className}`} dir="ltr" style={{ direction: 'ltr' }}>
        <div className="relative overflow-hidden">
          <img
            src={finalImageSrc}
            alt={product.name}
            className={`${imageClassName} transition-transform duration-300 group-hover:scale-110`}
            loading="lazy"
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
        
        <div className="text-left mt-8" dir="ltr" style={{ direction: 'ltr' }}>
          <h3 className={titleClassName} dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{product.name}</h3>
          
          <div className="relative">
            {(() => {
              const hasMonetaryPrice = typeof product.price === 'number' && product.price > 0;
              const hasDiscount = !!product.hasDiscount && hasMonetaryPrice && typeof product.discountedPrice === 'number' && product.discountedPrice > 0 && product.discountedPrice < product.price;
              const hasCoins = !hasMonetaryPrice && typeof product.loyaltyPointsRequired === 'number' && product.loyaltyPointsRequired > 0;

              if (hasMonetaryPrice) {
                return hasDiscount ? (
                  <div className="flex items-center gap-2">
                    <span className={discountedPriceClassName}>
                      {formatPrice(product.discountedPrice)}
                    </span>
                    <span className={originalPriceClassName}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                ) : (
                  <span className={priceClassName}>
                    {formatPrice(product.price)}
                  </span>
                );
              }

              if (hasCoins) {
                return (
                  <div className="flex items-center gap-2 text-[#190143]">
                    <Gift className="w-5 h-5" />
                    <span className={priceClassName}>
                      {product.loyaltyPointsRequired} Gymmawy Coins
                    </span>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
