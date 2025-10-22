import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { config } from '../../config';
import TabbyCartPromo from '../../components/payment/TabbyCartPromo';
import useTabbyPromo from '../../hooks/useTabbyPromo';
import { useTranslation } from 'react-i18next';
import { useCurrencyContext } from '../../contexts/CurrencyContext';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, loading, error } = useCart();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const { isSupported: isTabbySupported, currentCountry } = useTabbyPromo();
  const { i18n } = useTranslation();
  const { currency, formatPrice, getCurrencyInfo } = useCurrencyContext();

  // Transform cart items for display
  const transformCartItem = (item) => {
    const product = item.product;
    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
    
    // Get price for current currency, fallback to EGP
    const currentPrice = product.prices?.find(p => p.currency === currency);
    const fallbackPrice = product.prices?.find(p => p.currency === 'EGP');
    const priceData = currentPrice || fallbackPrice;
    const price = priceData?.amount ? parseFloat(priceData.amount) : 0;
    const discountPercentage = product.discountPercentage || 0;
    const discountedPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
    
    // Handle image URL
    const getImageSrc = (imagePath) => {
      if (!imagePath) return '/assets/common/store/product1-1.png';
      
      if (imagePath.startsWith('/uploads/')) {
        const baseUrl = config.API_BASE_URL.replace('/api', '');
        return `${baseUrl}${imagePath}`;
      }
      return imagePath;
    };
    
    const productImage = primaryImage?.url ? getImageSrc(primaryImage.url) : '/assets/common/store/product1-1.png';
    
    return {
      id: item.id,
      productId: product.id,
      name: product.name?.en || product.name || 'Unnamed Product',
      price: price,
      discountedPrice: discountedPrice,
      hasDiscount: discountPercentage > 0,
      image: productImage,
      size: item.size || 'M', // Use actual size from cart item
      quantity: item.quantity
    };
  };

  const cartItems = cart?.items?.map(transformCartItem) || [];

  // Helper function to calculate shipping cost based on currency
  const calculateShippingCost = (currency = 'EGP') => {
    // Convert 200 L.E to the specified currency
    const baseShippingEGP = 200;
    
    // Simple conversion rates (in production, these should come from a currency service)
    const conversionRates = {
      'EGP': 1,      // Base currency
      'SAR': 0.15,   // 1 EGP = 0.15 SAR
      'AED': 0.16,   // 1 EGP = 0.16 AED
      'USD': 0.04,   // 1 EGP = 0.04 USD
      'KWD': 0.01    // 1 EGP = 0.01 KWD
    };
    
    const rate = conversionRates[currency] || 1;
    const shippingAmount = Math.round(baseShippingEGP * rate);
    
    console.log('🚚 Cart shipping cost calculation:', {
      baseShippingEGP,
      currency,
      rate,
      shippingAmount
    });
    
    return shippingAmount;
  };

  // Helper function to calculate free shipping threshold based on currency
  const calculateFreeShippingThreshold = (currency = 'EGP') => {
    // Convert 2000 L.E to the specified currency
    const baseThresholdEGP = 2000;
    
    // Simple conversion rates (in production, these should come from a currency service)
    const conversionRates = {
      'EGP': 1,      // Base currency
      'SAR': 0.15,   // 1 EGP = 0.15 SAR
      'AED': 0.16,   // 1 EGP = 0.16 AED
      'USD': 0.04,   // 1 EGP = 0.04 USD
      'KWD': 0.01    // 1 EGP = 0.01 KWD
    };
    
    const rate = conversionRates[currency] || 1;
    const threshold = Math.round(baseThresholdEGP * rate);
    
    console.log('🚚 Cart free shipping threshold calculation:', {
      baseThresholdEGP,
      currency,
      rate,
      threshold
    });
    
    return threshold;
  };

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.hasDiscount ? item.discountedPrice : item.price;
    return total + (price * item.quantity);
  }, 0);

  // Calculate shipping based on currency
  const baseShippingAmount = calculateShippingCost(currency);
  const freeShippingThreshold = calculateFreeShippingThreshold(currency);
  const shipping = subtotal > freeShippingThreshold ? 0 : baseShippingAmount;
  const total = subtotal + shipping;

  // Handle quantity change
  const handleQuantityChange = async (productId, newQuantity, size = "M") => {
    if (!isAuthenticated) {
      showError('Please log in to update cart');
      return;
    }

    if (newQuantity <= 0) {
      // Find the cart item to remove
      const cartItem = cart?.items?.find(item => item.product.id === productId && item.size === size);
      if (cartItem) {
        await handleRemoveItem(cartItem.id);
      }
      return;
    }

    try {
      setIsUpdating(true);
      await updateQuantity(productId, newQuantity, size);
      showSuccess('Cart updated successfully');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError(error.message || 'Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId) => {
    if (!isAuthenticated) {
      showError('Please log in to remove items from cart');
      return;
    }

    try {
      setIsUpdating(true);
      await removeFromCart(itemId);
      showSuccess('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      showError(error.message || 'Failed to remove item');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: '/checkout' }, 
      });
      return;
    }

    if (cartItems.length === 0) {
      showError('Your cart is empty');
      return;
    }

    // Navigate to checkout with cart items
    navigate('/checkout', {
      state: {
        type: 'cart',
        cartItems: cartItems,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white cart-page">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#190143] mb-2">SHOPPING CART</h1>
          <p className="text-gray-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        {loading ? (
          /* Loading State */
          <div className="text-center py-16 sm:py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#190143] mx-auto mb-6"></div>
            <h2 className="text-xl sm:text-2xl font-medium text-[#190143] mb-4">Loading cart...</h2>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-16 sm:py-24">
            <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-medium text-[#190143] mb-4">Error loading cart</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-[#190143] text-white px-6 py-3 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        ) : !isAuthenticated ? (
          /* Not Authenticated */
          <div className="text-center py-16 sm:py-24">
            <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-medium text-[#190143] mb-4">Please log in to view your cart</h2>
            <p className="text-gray-600 mb-8">You need to be logged in to see your cart items.</p>
            <Link
              to="/auth/login"
              className="inline-block bg-[#190143] text-white px-6 py-3 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105"
            >
              Log In
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16 sm:py-24">
            <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-medium text-[#190143] mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link
              to="/shop-all"
              className="inline-block bg-[#190143] text-white px-6 py-3 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4 sm:space-y-6">
                {cartItems.map((item) => {
                  const currentPrice = item.hasDiscount ? item.discountedPrice : item.price;
                  
                  return (
                    <div key={item.id} className="bg-white border border-gray-200 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image */}
                        <div className="w-full sm:w-32 h-32 sm:h-40 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.target.src = '/assets/common/store/product1-1.png';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-medium text-[#190143] mb-2">
                            <Link to={`/product/${item.productId}`} className="hover:text-opacity-70 transition-colors">
                              {item.name}
                            </Link>
                          </h3>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-sm text-gray-600">Size: {item.size}</span>
                          </div>

                          {/* Price */}
                          <div className="mb-4">
                            {item.hasDiscount ? (
                              <div className="flex items-center gap-3">
                                <span className="text-lg sm:text-xl font-medium text-[#190143]">
                                  {formatPrice(item.discountedPrice)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg sm:text-xl font-medium text-[#190143]">
                                {formatPrice(item.price)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-[#190143] w-24 h-10">
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.size)}
                                disabled={isUpdating}
                                className="w-8 h-10 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="flex-1 h-10 text-center text-sm font-medium text-[#190143] flex items-center justify-center">
                                {isUpdating ? '...' : item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.size)}
                                disabled={isUpdating}
                                className="w-8 h-10 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-medium text-[#190143]">
                            {formatPrice(currentPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 sticky top-8">
                <h2 className="text-xl font-medium text-[#190143] mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  
                  
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span className="text-[#190143]">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Tabby Promo Snippet */}
                {cartItems.length > 0 && (
                  <div className="mb-4">
                    <TabbyCartPromo
                      key={`tabby-cart-${i18n.language}-${total}`}
                      total={total}
                      currency={currency}
                      className="w-full"
                      country={currentCountry}
                    />
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isUpdating || cartItems.length === 0}
                  className="w-full bg-[#190143] text-white py-3 px-6 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isUpdating ? 'UPDATING...' : 'PROCEED TO CHECKOUT'}
                </button>

                <Link
                  to="/shop-all"
                  className="block w-full text-center text-[#190143] py-3 px-6 border border-[#190143] hover:bg-[#190143] hover:text-white transition-all duration-300"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Purple Separator Line */}
        <div className="pt-8 sm:pt-12 md:pt-16 pb-2 bg-white mt-12 sm:mt-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="h-px bg-[#190143]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
