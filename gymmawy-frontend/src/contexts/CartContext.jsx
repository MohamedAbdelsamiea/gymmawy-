import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import storeService from '../services/storeService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeService.getCart();
      setCart(response.cart);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (productId, quantity = 1, size = "M") => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to cart');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await storeService.addToCart(productId, quantity, size);
      setCart(response.cart);
      return response;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = useCallback(async (productId, quantity, size = "M") => {
    if (!isAuthenticated) {
      throw new Error('Please log in to update cart');
    }

    try {
      setLoading(true);
      setError(null);
      await storeService.updateCartItem(productId, quantity, size);
      
      // Update cart state locally instead of reloading
      setCart(prevCart => {
        if (!prevCart) return prevCart;
        return {
          ...prevCart,
          items: prevCart.items.map(item => 
            item.product.id === productId && item.size === size
              ? { ...item, quantity }
              : item
          )
        };
      });
    } catch (err) {
      console.error('Error updating cart:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const removeFromCart = useCallback(async (itemId) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to remove items from cart');
    }

    try {
      setLoading(true);
      setError(null);
      await storeService.removeFromCart(itemId);
      
      // Update cart state locally instead of reloading
      setCart(prevCart => {
        if (!prevCart) return prevCart;
        return {
          ...prevCart,
          items: prevCart.items.filter(item => item.id !== itemId)
        };
      });
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const clearCart = async () => {
    if (!isAuthenticated) {
      throw new Error('Please log in to clear cart');
    }

    try {
      setLoading(true);
      setError(null);
      await storeService.clearCart();
      setCart({ ...cart, items: [] });
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate cart totals
  const getCartTotals = useCallback(() => {
    if (!cart || !cart.items) {
      return { itemCount: 0, totalPrice: 0 };
    }

    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.items.reduce((total, item) => {
      const product = item.product;
      if (!product) return total;
      
      // Get EGP price
      const egpPrice = product.prices?.find(p => p.currency === 'EGP');
      const price = egpPrice?.amount ? parseFloat(egpPrice.amount) : 0;
      
      // Apply discount if available
      const discountPercentage = product.discountPercentage || 0;
      const finalPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
      
      return total + (finalPrice * item.quantity);
    }, 0);

    return { itemCount, totalPrice };
  }, [cart]);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,
    getCartTotals,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
