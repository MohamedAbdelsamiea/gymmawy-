import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsset } from '../../hooks/useAsset';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

const CartPage = () => {
  // Static cart data for now
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "ORIGINAL GYMMAWY BLACK COMPRESSION",
      price: 1299,
      discountedPrice: 899,
      image: "store/product1-1.png",
      size: "M",
      quantity: 2,
      hasDiscount: true
    },
    {
      id: 2,
      name: "ORIGINAL GYMMAWY BLACK PANTS",
      price: 1600,
      discountedPrice: 1340,
      image: "store/product2-1.png",
      size: "L",
      quantity: 1,
      hasDiscount: true
    },
    {
      id: 3,
      name: "GYMMAWY WHITE COMPRESSION SHIRT",
      price: 1200,
      image: "store/product1-2.png",
      size: "S",
      quantity: 1,
      hasDiscount: false
    }
  ]);

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.hasDiscount ? item.discountedPrice : item.price;
    return total + (price * item.quantity);
  }, 0);

  const shipping = subtotal > 2000 ? 0 : 200; // Free shipping over 2000 LE
  const total = subtotal + shipping;

  // Handle quantity change
  const handleQuantityChange = (itemId, change) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) return null; // Remove item if quantity becomes 0
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) // Remove null items
    );
  };

  // Handle remove item
  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Handle checkout
  const handleCheckout = () => {
    // For now, just show alert
    alert('Redirecting to checkout...');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#190143] mb-2">SHOPPING CART</h1>
          <p className="text-gray-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        {cartItems.length === 0 ? (
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
                  const productImage = useAsset(item.image, "common");
                  const currentPrice = item.hasDiscount ? item.discountedPrice : item.price;
                  
                  return (
                    <div key={item.id} className="bg-white border border-gray-200 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image */}
                        <div className="w-full sm:w-32 h-32 sm:h-40 flex-shrink-0">
                          <img
                            src={productImage}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-medium text-[#190143] mb-2">
                            <Link to={`/product/${item.id}`} className="hover:text-opacity-70 transition-colors">
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
                                  {item.discountedPrice} LE
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {item.price} LE
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg sm:text-xl font-medium text-[#190143]">
                                {item.price} LE
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-[#190143] w-24 h-10">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="w-8 h-10 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143]"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="flex-1 h-10 text-center text-sm font-medium text-[#190143] flex items-center justify-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-8 h-10 flex items-center justify-center hover:bg-[#190143] hover:text-white transition-colors duration-200 text-[#190143]"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-medium text-[#190143]">
                            {(currentPrice * item.quantity).toLocaleString()} LE
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
                    <span className="font-medium">{subtotal.toLocaleString()} LE</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : `${shipping} LE`}
                    </span>
                  </div>
                  
                  {shipping > 0 && (
                    <p className="text-sm text-gray-500">
                      Add {(2000 - subtotal).toLocaleString()} LE more for free shipping
                    </p>
                  )}
                  
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span className="text-[#190143]">{total.toLocaleString()} LE</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#190143] text-white py-3 px-6 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 mb-4"
                >
                  PROCEED TO CHECKOUT
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
