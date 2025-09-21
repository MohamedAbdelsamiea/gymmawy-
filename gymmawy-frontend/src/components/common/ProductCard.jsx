import React from 'react';
import { Link } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';

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
  const productImage = useAsset(product.image, "common");

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
          />
        </div>
        
        <div className="text-left mt-8">
          <h3 className={titleClassName}>{product.name}</h3>
          
          <div>
            {product.hasDiscount ? (
              <div className="flex items-start space-x-4">
                <span className={discountedPriceClassName}>
                  {product.discountedPrice} LE
                </span>
                <span className={originalPriceClassName}>
                  {product.price} LE
                </span>
              </div>
            ) : (
              <span className={priceClassName}>
                {product.price} LE
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
