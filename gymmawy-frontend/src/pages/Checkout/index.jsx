import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useCurrencyContext } from '../../contexts/CurrencyContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../hooks/useLanguage';
import { config } from '../../config';
import checkoutService from '../../services/checkoutService';
import imageUploadService from '../../services/imageUploadService';
import tabbyService from '../../services/tabbyService';
import rewardsService from '../../services/rewardsService';
import useTabbyPromo from '../../hooks/useTabbyPromo';
import countryDetectionService from '../../services/countryDetectionService';
import { useSecureImage } from '../../hooks/useSecureImage';

// Helper function to get consistent currency symbols
const getCurrencySymbol = (currency, language = 'en') => {
  const symbols = {
    'USD': '$',
    'SAR': '﷼',
    'AED': language === 'ar' ? 'د.إ' : 'AED',
    'EGP': language === 'ar' ? 'ج.م' : 'EGP'
  };
  return symbols[currency] || (language === 'ar' ? 'ج.م' : 'EGP');
};

import { 
  CreditCard, 
  Copy, 
  Upload, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Calendar,
  Tag,
  Shield,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Truck,
  Plus,
} from 'lucide-react';
import * as Accordion from "@radix-ui/react-accordion";

const Checkout = () => {
  const { t, i18n } = useTranslation(['checkout', 'common']);
  const { isArabic } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess, showInfo } = useToast();
  const { currency: detectedCurrency, isLoading: currencyLoading, formatPrice, isTabbySupported } = useCurrencyContext();
  const { cart, loadCart, loading: cartLoading } = useCart();
  
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to get bilingual text
  const getBilingualText = (text, fallback = '') => {
    if (!text) {
return fallback;
}
    if (typeof text === 'object') {
      return i18n.language === 'ar' && text.ar 
        ? text.ar 
        : text.en || text.ar || fallback;
    }
    return text || fallback;
  };
  
  // Get data from location state (plan, product, or cart items)
  const { plan, product, cartItems, type, currency: passedCurrency, buyNow, subtotal: cartSubtotal, shipping: cartShipping, total: cartTotal, fromPaymentFailure, paymentFailureReason, fromPaymentCancel, preserveCart } = location.state || {};
  
  // All state management - moved to top to avoid hooks order issues
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [isLoyaltyRedemption, setIsLoyaltyRedemption] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [loadedCartItems, setLoadedCartItems] = useState(null);
  const [cartLoadError, setCartLoadError] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('normal');
  const prescoringCalledRef = useRef(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponDiscountType, setCouponDiscountType] = useState('percentage');
  const [couponData, setCouponData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [paymentOption, setPaymentOption] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [tabbyAvailable, setTabbyAvailable] = useState(false);
  const [tabbyRejectionMessage, setTabbyRejectionMessage] = useState(null);
  const [forceTabbyAvailable, setForceTabbyAvailable] = useState(false);
  const [tabbyPrescoringLoading, setTabbyPrescoringLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [tabbyConfiguration, setTabbyConfiguration] = useState(null);
  const [shippingDetails, setShippingDetails] = useState({
    shippingBuilding: '',
    shippingStreet: '',
    shippingCity: '',
    shippingCountry: '',
    shippingPostalCode: ''
  });
  const [cartLoadAttempted, setCartLoadAttempted] = useState(false);
  const cartLoadTimeoutRef = useRef(null);
  
  // Check for loyalty redemption data on component mount
  useEffect(() => {
    const loyaltyCheckoutData = sessionStorage.getItem('loyaltyCheckoutData');
    if (loyaltyCheckoutData) {
      try {
        const parsedData = JSON.parse(loyaltyCheckoutData);
        if (parsedData.type === 'loyalty') {
          setLoyaltyData(parsedData);
          setIsLoyaltyRedemption(true);
          console.log('🎁 Loyalty redemption detected:', parsedData);
        }
      } catch (error) {
        console.error('Error parsing loyalty checkout data:', error);
        sessionStorage.removeItem('loyaltyCheckoutData');
      }
    }
  }, []);

  // Store original purchase data for payment retry
  useEffect(() => {
    if (plan || product || cartItems) {
      const originalPurchaseData = {
        plan,
        product,
        cartItems,
        type,
        currency: passedCurrency,
        buyNow,
        subtotal: cartSubtotal,
        shipping: cartShipping,
        total: cartTotal
      };
      sessionStorage.setItem('originalPurchaseData', JSON.stringify(originalPurchaseData));
      console.log('💾 Stored original purchase data for payment retry:', originalPurchaseData);
    }
  }, [plan, product, cartItems, type, passedCurrency, buyNow, cartSubtotal, cartShipping, cartTotal]);

  // Load cart data when returning from payment failure/cancellation (only for cart purchases)
  useEffect(() => {
    const loadCartData = async () => {
      // Only load cart if we're returning from payment failure/cancellation for a CART purchase
      // and we don't have the original cart data
      if ((fromPaymentFailure || fromPaymentCancel || preserveCart) && 
          type === 'cart' && 
          !cartItems && 
          isAuthenticated && 
          !cartLoadAttempted) {
        console.log('🛒 Loading cart data for payment retry...');
        setCartLoadAttempted(true);
        setIsLoadingCart(true);
        setCartLoadError(null);
        
        // Clear any existing timeout
        if (cartLoadTimeoutRef.current) {
          clearTimeout(cartLoadTimeoutRef.current);
        }
        
        // Add a small delay to prevent rapid API calls
        cartLoadTimeoutRef.current = setTimeout(async () => {
          try {
            await loadCart(true); // Force load cart for payment retry
            console.log('✅ Cart loaded successfully');
          } catch (error) {
            console.error('❌ Failed to load cart:', error);
            setCartLoadError(error.message);
            showError('Failed to load your cart. Please try again.');
          } finally {
            setIsLoadingCart(false);
          }
        }, 100);
      }
    };

    loadCartData();
    
    // Cleanup timeout on unmount
    return () => {
      if (cartLoadTimeoutRef.current) {
        clearTimeout(cartLoadTimeoutRef.current);
      }
    };
  }, [fromPaymentFailure, fromPaymentCancel, preserveCart, cartItems, type, isAuthenticated, loadCart, showError, cartLoadAttempted]);

  // Transform cart data when it's loaded
  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0 && !cartItems) {
      console.log('🛒 Transforming cart data for checkout...');
      
      const transformCartItem = (item) => {
        const product = item.product;
        if (!product) return null;
        
        // Get EGP price
        const egpPrice = product.prices?.find(p => p.currency === 'EGP');
        const price = egpPrice?.amount ? parseFloat(egpPrice.amount) : 0;
        
        // Apply discount if available
        const discountPercentage = product.discountPercentage || 0;
        const discountedPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
        
        // Get primary image
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
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
          size: item.size || 'M',
          quantity: item.quantity
        };
      };

      const transformedItems = cart.items.map(transformCartItem).filter(Boolean);
      setLoadedCartItems(transformedItems);
      
      // Calculate totals
      const subtotal = transformedItems.reduce((total, item) => {
        const itemPrice = item.hasDiscount ? item.discountedPrice : item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
      
      // Calculate shipping based on currency
      const currentCurrency = currency || 'EGP';
      const baseShippingAmount = calculateShippingCost(currentCurrency);
      const freeShippingThreshold = calculateFreeShippingThreshold(currentCurrency);
      const shipping = subtotal > freeShippingThreshold ? 0 : baseShippingAmount;
      const total = subtotal + shipping;
      
      console.log('✅ Cart data transformed:', { items: transformedItems.length, subtotal, total });
      
      // Show success message when cart is loaded for payment retry
      if (fromPaymentFailure || fromPaymentCancel) {
        const message = i18n.language === 'ar' 
          ? 'تم تحميل سلة التسوق بنجاح. يمكنك الآن إعادة المحاولة.'
          : 'Your cart has been loaded successfully. You can now retry your payment.';
        showSuccess(message);
      }
    }
  }, [cart, cartItems, fromPaymentFailure, fromPaymentCancel, i18n.language, showSuccess]);

  // Debug: Log currency detection
  console.log('🔍 Checkout - Currency detection:', {
    detectedCurrency,
    currencyLoading,
    plan: plan?.name
  });
  
  // Use detected currency from CurrencyContext (user can change via currency selector)
  // This ensures prices update when user changes currency
  const currency = detectedCurrency || passedCurrency || 'USD';
  
  // Debug: Log the currency being used
  // console.log('🔍 Checkout - Currency from home page:', passedCurrency);
  // console.log('🔍 Checkout - Detected currency:', detectedCurrency);
  // console.log('🔍 Checkout - Final currency:', currency);
  // console.log('🔍 Checkout - Type:', type);
  // console.log('🔍 Checkout - Plan benefits:', plan?.benefits);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: location.pathname, plan, type }, 
      });
    }
  }, [isAuthenticated, navigate, location.pathname, plan, type]);

  // Redirect if no data (plan, product, or cart items) - but wait for cart loading
  useEffect(() => {
    // Don't redirect if we're still loading cart data
    if (isLoadingCart) {
      return;
    }
    
    // Don't redirect if we have cart data from context
    if (cart && cart.items && cart.items.length > 0) {
      return;
    }
    
    // Don't redirect if we have loaded cart items
    if (loadedCartItems && loadedCartItems.length > 0) {
      return;
    }
    
    if (!plan && !product && !cartItems) {
      console.log('No checkout data found, redirecting to home');
      navigate('/');
    }
  }, [plan, product, cartItems, cart, loadedCartItems, isLoadingCart, navigate]);

  // Function to reset prescoring flag (for manual testing)
  const resetPrescoringFlag = () => {
    prescoringCalledRef.current = false;
    console.log('🔄 PRESCORING - Flag reset, allowing new call');
  };
  
  // Clear any existing rejection message for testing
  useEffect(() => {
    if (forceTabbyAvailable) {
      setTabbyRejectionMessage(null);
    }
  }, [forceTabbyAvailable]);

  // Generate dynamic Tabby instructions based on real configuration
  const getTabbyInstructions = () => {
    if (!tabbyConfiguration?.available_products?.installments?.[0]) {
      // Fallback to default instructions if no configuration
      return [
        t('checkout.tabbyInstruction1'),
        t('checkout.tabbyInstruction2'),
        t('checkout.tabbyInstruction3')
      ];
    }

    const installment = tabbyConfiguration.available_products.installments[0];
    const installmentsCount = installment.installments_count || 2;
    const serviceFee = parseFloat(installment.service_fee || '0');
    const currency = tabbyConfiguration.currency || 'SAR';
    
    const instructions = [
      `Pay in ${installmentsCount} ${serviceFee === 0 ? 'interest-free' : 'low-interest'} installments`,
      'Secure payment processing by Tabby',
      serviceFee === 0 ? 'No additional fees or charges' : `Low service fee: ${serviceFee} ${currency}`
    ];

    return instructions;
  };

  // Get Tabby hook data
  const { currentCountry } = useTabbyPromo();

  // Get phone number based on currency for Tabby
  const getPhoneForCurrency = (currency) => {
    switch (currency) {
      case 'SAR':
        return '+966500000001'; // Saudi Arabia test number
      case 'AED':
        return '+971500000001'; // UAE test number
      case 'KWD':
        return '+96590000001'; // Kuwait test number
      default:
        return user?.mobileNumber || '+201000000000'; // Default to Egypt
    }
  };

  // Get country code based on currency for Tabby
  const getCountryForCurrency = (currency) => {
    switch (currency) {
      case 'SAR':
        return 'SA'; // Saudi Arabia
      case 'AED':
        return 'AE'; // UAE
      case 'KWD':
        return 'KW'; // Kuwait
      default:
        return 'EG'; // Default to Egypt
    }
  };

  // Get city based on currency for Tabby
  const getCityForCurrency = (currency) => {
    switch (currency) {
      case 'SAR':
        return 'Riyadh'; // Saudi Arabia
      case 'AED':
        return 'Dubai'; // UAE
      case 'KWD':
        return 'Kuwait City'; // Kuwait
      default:
        return 'Cairo'; // Default to Egypt
    }
  };



  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview);
      }
    };
  }, [paymentProofPreview]);

  // Reset payment option if cash on delivery is selected for non-physical orders
  useEffect(() => {
    if (paymentOption === 'cash_on_delivery' && type !== 'cart' && type !== 'product') {
      setPaymentOption(''); // Reset to empty to force user to select a valid option
    }
  }, [type, paymentOption]);


  // Helper function to format subscription period
  const formatSubscriptionPeriod = (days) => {
    // Ensure days is a number
    const numDays = parseInt(days) || 0;
    
    // If no days provided, return empty string
    if (numDays === 0) {
return '';
}
    
    // Check if it's a clean week division (like 42 days = 6 weeks)
    if (numDays >= 7 && numDays % 7 === 0) {
      const weeks = numDays / 7;
      return t('common.weeks', { count: weeks });
    }
    // Check if it's a clean month division (like 30, 60, 90 days)
    else if (numDays >= 30 && numDays % 30 === 0) {
      const months = numDays / 30;
      return t('common.months', { count: months });
    }
    // For other cases, show days
    else {
      return t('common.days', { count: numDays });
    }
  };

  // Helper function to format gift period
  const formatGiftPeriod = (days) => {
    if (days === 0) {
return '';
}
    return ` + ${formatSubscriptionPeriod(days)}`;
  };

  // Helper function to parse duration from static data (e.g., "6 Weeks + 6 Weeks")
  const parseDurationFromStatic = (duration) => {
    if (!duration) {
return { subscriptionDays: 0, giftDays: 0 };
}
    
    // Split by " + " to separate main and gift periods
    const parts = duration.split(' + ');
    const mainPeriod = parts[0] || '';
    const giftPeriod = parts[1] || '';
    
    // Parse main period
    const mainMatch = mainPeriod.match(/(\d+)\s*(weeks?|months?|days?)/i);
    let subscriptionDays = 0;
    if (mainMatch) {
      const value = parseInt(mainMatch[1]);
      const unit = mainMatch[2].toLowerCase();
      if (unit.startsWith('week')) {
        subscriptionDays = value * 7;
      } else if (unit.startsWith('month')) {
        subscriptionDays = value * 30;
      } else if (unit.startsWith('day')) {
        subscriptionDays = value;
      }
    }
    
    // Parse gift period
    const giftMatch = giftPeriod.match(/(\d+)\s*(weeks?|months?|days?)/i);
    let giftDays = 0;
    if (giftMatch) {
      const value = parseInt(giftMatch[1]);
      const unit = giftMatch[2].toLowerCase();
      if (unit.startsWith('week')) {
        giftDays = value * 7;
      } else if (unit.startsWith('month')) {
        giftDays = value * 30;
      } else if (unit.startsWith('day')) {
        giftDays = value;
      }
    }
    
    return { subscriptionDays, giftDays };
  };

  // Helper function to parse price from static data (e.g., "1999 L.E")
  const parsePriceFromStatic = (priceString) => {
    if (!priceString) {
return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
}
    
    // Extract amount and currency symbol
    const match = priceString.match(/(\d+(?:\.\d+)?)\s*(.+)/);
    if (match) {
      const amount = parseFloat(match[1]);
      const currencySymbol = match[2].trim();
      return {
        amount,
        currency: currencySymbol === 'L.E' ? 'EGP' : 'EGP',
        currencySymbol,
      };
    }
    
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Debug: Log plan data to see what we're receiving (can be removed in production)
  // console.log('=== CHECKOUT DEBUG ===');
  // console.log('Plan object:', plan);
  // console.log('Plan subscriptionPeriodDays:', plan?.subscriptionPeriodDays);
  // console.log('Plan giftPeriodDays:', plan?.giftPeriodDays);
  // console.log('Plan subscriptionPeriod:', plan?.subscriptionPeriod);
  // console.log('Plan giftPeriod:', plan?.giftPeriod);
  // console.log('Plan price:', plan?.price);
  // console.log('Plan priceEGP:', plan?.priceEGP);
  // console.log('Plan priceSAR:', plan?.priceSAR);
  // console.log('Plan medicalEGP:', plan?.medicalEGP);
  // console.log('Plan medicalSAR:', plan?.medicalSAR);
  // console.log('Plan discountPercentage:', plan?.discountPercentage);
  // console.log('Plan keys:', plan ? Object.keys(plan) : 'No plan');
  // console.log('====================');

  // Get duration data - handle both API and static data
  const getDurationData = () => {
    if (!plan) {
      return { subscriptionDays: 0, giftDays: 0 };
    }
    
    // Check for API data format with different possible field names
    if (plan.subscriptionPeriodDays !== undefined) {
      return {
        subscriptionDays: plan.subscriptionPeriodDays || 0,
        giftDays: plan.giftPeriodDays || 0,
      };
    } else if (plan.subscriptionPeriod !== undefined) {
      // Alternative API field names
      return {
        subscriptionDays: plan.subscriptionPeriod || 0,
        giftDays: plan.giftPeriod || 0,
      };
    } else if (plan.duration) {
      // Static data format - parse from duration string
      return parseDurationFromStatic(plan.duration);
    }
    
    // If we have a plan but no duration data, try to infer from plan name
    if (plan.name) {
      const planName = typeof plan.name === 'string' ? plan.name : (plan.name.en || plan.name.ar || '');
      const nameLower = planName.toLowerCase();
      
      // Try to extract duration from plan name
      if (nameLower.includes('6 weeks') || nameLower.includes('6 أسابيع')) {
        return { subscriptionDays: 42, giftDays: 42 }; // 6 weeks + 6 weeks
      } else if (nameLower.includes('6 months') || nameLower.includes('6 أشهر')) {
        return { subscriptionDays: 180, giftDays: 180 }; // 6 months + 6 months
      } else if (nameLower.includes('3 months') || nameLower.includes('3 أشهر')) {
        return { subscriptionDays: 90, giftDays: 90 }; // 3 months + 3 months
      } else if (nameLower.includes('12 months') || nameLower.includes('12 شهر')) {
        return { subscriptionDays: 360, giftDays: 360 }; // 12 months + 12 months
      }
    }
    
    return { subscriptionDays: 0, giftDays: 0 };
  };

  const durationData = getDurationData();

  // Helper function to convert Prisma Decimal to number
  const convertDecimalToNumber = (decimalField) => {
    // console.log('=== DECIMAL CONVERSION DEBUG ===');
    // console.log('Input decimalField:', decimalField);
    // console.log('Type:', typeof decimalField);
    
    if (!decimalField) {
      // console.log('No decimalField, returning 0');
      return 0;
    }
    
    if (typeof decimalField === 'number') {
      // console.log('Number type, returning:', decimalField);
      return decimalField;
    }
    
    if (typeof decimalField === 'string') {
      // console.log('String type, parsing:', decimalField);
      return parseFloat(decimalField);
    }
    
    if (decimalField.s !== undefined && decimalField.e !== undefined && decimalField.d !== undefined) {
      // Handle Prisma Decimal object: {s: 1, e: 3, d: [3300]}
      // s = sign (1 for positive, -1 for negative)
      // e = exponent (number of digits after decimal point)
      // d = digits array
      const sign = decimalField.s === 1 ? 1 : -1;
      const exponent = decimalField.e;
      const digits = decimalField.d;
      const digitsStr = digits.join('');
      
      // console.log('Prisma Decimal object detected');
      // console.log('Sign:', sign, 'Exponent:', exponent, 'Digits:', digits, 'DigitsStr:', digitsStr);
      
      // For e=3 and d=[3300], the value is 3300 (not 3.300)
      // Prisma Decimal stores the value as-is when e equals the number of digits
      // So 3300 with e=3 means 3300, not 3.300
      const amount = parseFloat(digitsStr);
      const finalResult = amount * sign;
      
      // console.log('Parsed amount:', amount, 'Final result:', finalResult);
      // console.log('================================');
      return finalResult;
    }
    
    if (decimalField.toString) {
      // console.log('Has toString method, using it as fallback');
      const result = parseFloat(decimalField.toString());
      // console.log('toString result:', result);
      return result;
    }
    
    // console.log('No matching condition, returning 0');
    // console.log('================================');
    return 0;
  };

  // Get normal price (using new allPrices format)
  const getNormalPrice = () => {
    if (!plan) {
      return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    }
    
    // Use new allPrices format
    if (plan.allPrices?.regular) {
      // Use the currency passed from home page, fallback to EGP if not available
      const currencies = Object.keys(plan.allPrices.regular);
      const defaultCurrency = currencies.includes(currency) ? currency : 
                             currencies.includes('EGP') ? 'EGP' : 
                             currencies[0] || 'EGP';
      const amount = plan.allPrices.regular[defaultCurrency] || 0;
      
      console.log('🔍 Checkout - Normal price debug:', {
        passedCurrency: currency,
        availableCurrencies: currencies,
        selectedCurrency: defaultCurrency,
        amount: amount
      });
      
      // Get currency symbol
      const currencySymbol = getCurrencySymbol(defaultCurrency, i18n.language);
      
      return {
        amount: amount,
        currency: defaultCurrency,
        currencySymbol: currencySymbol,
      };
    }
    
    // Fallback to individual price fields (for programmes)
    if (plan.priceEGP !== undefined || plan.priceUSD !== undefined || plan.priceSAR !== undefined || plan.priceAED !== undefined) {
      let selectedPrice = 0;
      let selectedCurrency = 'EGP';
      
      // Select price based on detected currency
      switch (currency) {
        case 'EGP':
          selectedPrice = convertDecimalToNumber(plan.priceEGP) || 0;
          selectedCurrency = 'EGP';
          break;
        case 'SAR':
          selectedPrice = convertDecimalToNumber(plan.priceSAR) || 0;
          selectedCurrency = 'SAR';
          break;
        case 'AED':
          selectedPrice = convertDecimalToNumber(plan.priceAED) || 0;
          selectedCurrency = 'AED';
          break;
        case 'USD':
          selectedPrice = convertDecimalToNumber(plan.priceUSD) || 0;
          selectedCurrency = 'USD';
          break;
        default:
          // Fallback to EGP if currency not found
          selectedPrice = convertDecimalToNumber(plan.priceEGP) || 0;
          selectedCurrency = 'EGP';
          break;
      }
      
      // Get currency symbol
      const currencySymbol = getCurrencySymbol(selectedCurrency, i18n.language);
      
      console.log('🔍 Checkout - Individual price fields debug:', {
        currency: currency,
        selectedCurrency: selectedCurrency,
        selectedPrice: selectedPrice,
        currencySymbol: currencySymbol
      });
      
      return {
        amount: selectedPrice,
        currency: selectedCurrency,
        currencySymbol: currencySymbol,
      };
    }
    
    // Fallback to old format if allPrices is not available
    if (plan.price?.amount !== undefined && plan.price?.amount !== null && plan.price?.amount > 0) {
      return plan.price;
    }
    
    // Handle string prices
    if (typeof plan.price === 'string') {
      if (plan.price === 'FREE' || plan.price === 'مجاني') {
        return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
      }
      return parsePriceFromStatic(plan.price);
    }
    
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Get medical price (using new allPrices format)
  const getMedicalPrice = () => {
    if (!plan) {
      return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    }
    
    // Use new allPrices format
    if (plan.allPrices?.medical) {
      // Use the currency passed from home page, fallback to EGP if not available
      const currencies = Object.keys(plan.allPrices.medical);
      const defaultCurrency = currencies.includes(currency) ? currency : 
                             currencies.includes('EGP') ? 'EGP' : 
                             currencies[0] || 'EGP';
      const amount = plan.allPrices.medical[defaultCurrency] || 0;
      
      // Get currency symbol
      const currencySymbol = getCurrencySymbol(defaultCurrency, i18n.language);
      
      return {
        amount: amount,
        currency: defaultCurrency,
        currencySymbol: currencySymbol,
      };
    }
    
    // Fallback to old format if allPrices is not available
    if (plan.medicalPrice?.amount !== undefined && plan.medicalPrice?.amount !== null && plan.medicalPrice?.amount > 0) {
      return plan.medicalPrice;
    }
    
    // Fallback to regular prices
    return getNormalPrice();
  };

  // Calculate pricing based on selected duration
  const getPrice = () => {
    if (type === 'subscription') {
      return selectedDuration === 'medical' ? getMedicalPrice() : getNormalPrice();
    }
    
    // For programmes
    if (type === 'programme') {
      return getProgrammePrice();
    }
    
    // For cart and product orders, don't use plan price
    if (type === 'cart' || type === 'product') {
      return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    }
    
    // For other types or fallback
    if (plan && typeof plan.price === 'string') {
      return parsePriceFromStatic(plan.price);
    }
    if (plan && plan.price) {
      return plan.price;
    }
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Get programme price
  const getProgrammePrice = () => {
    if (!plan) {
      return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
    }
    
    // Handle structured price object (new format from backend)
    if (plan.price && typeof plan.price === 'object') {
      return {
        amount: plan.price.amount || 0,
        currency: plan.price.currency || 'EGP',
        currencySymbol: plan.price.currencySymbol || 'L.E',
      };
    }
    
    // Handle new price structure with objects (from backend) - prioritize by detected currency
    if (detectedCurrency === 'USD' && plan.priceUSD && typeof plan.priceUSD === 'object') {
      return {
        amount: plan.priceUSD.amount || 0,
        currency: plan.priceUSD.currency || 'USD',
        currencySymbol: plan.priceUSD.currencySymbol || '$',
      };
    }
    
    if (detectedCurrency === 'SAR' && plan.priceSAR && typeof plan.priceSAR === 'object') {
      return {
        amount: plan.priceSAR.amount || 0,
        currency: plan.priceSAR.currency || 'SAR',
        currencySymbol: plan.priceSAR.currencySymbol || 'ر.س',
      };
    }
    
    if (detectedCurrency === 'AED' && plan.priceAED && typeof plan.priceAED === 'object') {
      return {
        amount: plan.priceAED.amount || 0,
        currency: plan.priceAED.currency || 'AED',
        currencySymbol: plan.priceAED.currencySymbol || (i18n.language === 'ar' ? 'د.إ' : 'AED'),
      };
    }
    
    if (currency === 'EGP' && plan.priceEGP && typeof plan.priceEGP === 'object') {
      return {
        amount: plan.priceEGP.amount || 0,
        currency: plan.priceEGP.currency || 'EGP',
        currencySymbol: plan.priceEGP.currencySymbol || 'L.E',
      };
    }
    
    // Fallback to any available price object
    if (plan.priceUSD && typeof plan.priceUSD === 'object') {
      return {
        amount: plan.priceUSD.amount || 0,
        currency: plan.priceUSD.currency || 'USD',
        currencySymbol: plan.priceUSD.currencySymbol || '$',
      };
    }
    
    if (plan.priceSAR && typeof plan.priceSAR === 'object') {
      return {
        amount: plan.priceSAR.amount || 0,
        currency: plan.priceSAR.currency || 'SAR',
        currencySymbol: plan.priceSAR.currencySymbol || 'ر.س',
      };
    }
    
    if (plan.priceAED && typeof plan.priceAED === 'object') {
      return {
        amount: plan.priceAED.amount || 0,
        currency: plan.priceAED.currency || 'AED',
        currencySymbol: plan.priceAED.currencySymbol || (i18n.language === 'ar' ? 'د.إ' : 'AED'),
      };
    }
    
    if (plan.priceEGP && typeof plan.priceEGP === 'object') {
      return {
        amount: plan.priceEGP.amount || 0,
        currency: plan.priceEGP.currency || 'EGP',
        currencySymbol: plan.priceEGP.currencySymbol || 'L.E',
      };
    }
    
    // Handle raw price fields (legacy format) - use detected currency
    let selectedPrice = 0;
    let selectedCurrency = 'EGP';
    let currencySymbol = 'L.E';
    
    // Select price based on detected currency
    switch (detectedCurrency) {
      case 'EGP':
        if (plan.priceEGP !== undefined) {
          selectedPrice = convertDecimalToNumber(plan.priceEGP);
          selectedCurrency = 'EGP';
          currencySymbol = 'L.E';
        }
        break;
      case 'SAR':
        if (plan.priceSAR !== undefined) {
          selectedPrice = convertDecimalToNumber(plan.priceSAR);
          selectedCurrency = 'SAR';
          currencySymbol = 'ر.س';
        }
        break;
      case 'AED':
        if (plan.priceAED !== undefined) {
          selectedPrice = convertDecimalToNumber(plan.priceAED);
          selectedCurrency = 'AED';
          currencySymbol = i18n.language === 'ar' ? 'د.إ' : 'AED';
        }
        break;
      case 'USD':
        if (plan.priceUSD !== undefined) {
          selectedPrice = convertDecimalToNumber(plan.priceUSD);
          selectedCurrency = 'USD';
          currencySymbol = '$';
        }
        break;
      default:
        // Fallback to EGP if currency not found
        if (plan.priceEGP !== undefined) {
          selectedPrice = convertDecimalToNumber(plan.priceEGP);
          selectedCurrency = 'EGP';
          currencySymbol = 'L.E';
        }
        break;
    }
    
    // If no price found for the selected currency, try other currencies as fallback
    if (selectedPrice === 0) {
      if (plan.priceEGP !== undefined) {
        selectedPrice = convertDecimalToNumber(plan.priceEGP);
        selectedCurrency = 'EGP';
        currencySymbol = 'L.E';
      } else if (plan.priceSAR !== undefined) {
        selectedPrice = convertDecimalToNumber(plan.priceSAR);
        selectedCurrency = 'SAR';
        currencySymbol = 'ر.س';
      } else if (plan.priceAED !== undefined) {
        selectedPrice = convertDecimalToNumber(plan.priceAED);
        selectedCurrency = 'AED';
        currencySymbol = 'د.إ';
      } else if (plan.priceUSD !== undefined) {
        selectedPrice = convertDecimalToNumber(plan.priceUSD);
        selectedCurrency = 'USD';
        currencySymbol = '$';
      }
    }
    
    console.log('🔍 Checkout - Programme price debug:', {
      detectedCurrency: detectedCurrency,
      selectedCurrency: selectedCurrency,
      selectedPrice: selectedPrice,
      currencySymbol: currencySymbol,
      planPriceSAR: plan?.priceSAR,
      planPriceUSD: plan?.priceUSD
    });
    
    return { amount: selectedPrice, currency: selectedCurrency, currencySymbol: currencySymbol };
  };

  const currentPrice = getPrice();
  
  // Debug: Log price calculation
  // console.log('=== PRICE DEBUG ===');
  // console.log('Current price:', currentPrice);
  // console.log('Price amount:', currentPrice?.amount);
  // console.log('Price currency:', currentPrice?.currency);
  // console.log('Price currencySymbol:', currentPrice?.currencySymbol);
  // console.log('==================');

  // Get pricing for cart items or single product
  const getCartOrProductPrice = () => {
    if (type === 'cart') {
      // Use loaded cart items if available, otherwise use cartTotal from state
      if (loadedCartItems && loadedCartItems.length > 0) {
        const subtotal = loadedCartItems.reduce((total, item) => {
          const itemPrice = item.hasDiscount ? item.discountedPrice : item.price;
          return total + (itemPrice * item.quantity);
        }, 0);
        
        // Calculate shipping based on currency
        const currentCurrency = currency || 'EGP';
        const baseShippingAmount = calculateShippingCost(currentCurrency);
        const freeShippingThreshold = calculateFreeShippingThreshold(currentCurrency);
        const shipping = subtotal > freeShippingThreshold ? 0 : baseShippingAmount;
        const total = subtotal + shipping;
        
        return {
          amount: total,
          currency: currentCurrency,
          currencySymbol: getCurrencySymbol(currentCurrency, i18n.language)
        };
      } else {
        return {
          amount: cartTotal || 0,
          currency: 'EGP',
          currencySymbol: 'L.E'
        };
      }
    } else if (type === 'product') {
      const price = product.hasDiscount ? product.discountedPrice : product.price;
      return {
        amount: price * (product.quantity || 1),
        currency: 'EGP',
        currencySymbol: 'L.E'
      };
    }
    return currentPrice;
  };

  const finalPrice = getCartOrProductPrice();
  
  // Reset payment option when currency changes to ensure valid options are shown
  useEffect(() => {
    if (finalPrice?.currency === 'EGP' && (paymentOption === 'paymob_card' || paymentOption === 'paymob_apple')) {
      setPaymentOption(''); // Reset Paymob options for EGP currency
    } else if (finalPrice?.currency !== 'EGP' && (paymentOption === 'vodafone' || paymentOption === 'instapay')) {
      setPaymentOption(''); // Reset Vodafone/InstaPay options for non-EGP currencies
    } else if (finalPrice?.currency !== 'SAR' && (paymentOption === 'paymob_card' || paymentOption === 'paymob_apple')) {
      setPaymentOption(''); // Reset Paymob options for non-SAR currencies
    }
  }, [finalPrice?.currency, paymentOption]);
  
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
    
    console.log('🚚 Shipping cost calculation:', {
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
    
    console.log('🚚 Free shipping threshold calculation:', {
      baseThresholdEGP,
      currency,
      rate,
      threshold
    });
    
    return threshold;
  };

  // Calculate shipping cost based on currency
  const getShippingCost = () => {
    // Only add shipping for cart and product orders (physical items)
    if (type === 'cart' || type === 'product') {
      const currentCurrency = currency || 'EGP';
      const baseShippingAmount = calculateShippingCost(currentCurrency);
      const freeShippingThreshold = calculateFreeShippingThreshold(currentCurrency);
      
      // Calculate current subtotal for free shipping check
      let currentSubtotal = 0;
      
      if (type === 'cart') {
        // Use loaded cart items if available, otherwise use cartSubtotal from state
        if (loadedCartItems && loadedCartItems.length > 0) {
          currentSubtotal = loadedCartItems.reduce((total, item) => {
            const itemPrice = item.hasDiscount ? item.discountedPrice : item.price;
            return total + (itemPrice * item.quantity);
          }, 0);
        } else {
          currentSubtotal = cartSubtotal || 0;
        }
      } else if (type === 'product') {
        // Use discounted price if product has discount, otherwise use regular price
        const productPrice = product.hasDiscount ? product.discountedPrice : product.price;
        currentSubtotal = productPrice * (product.quantity || 1);
      }
      
      const shippingAmount = currentSubtotal > freeShippingThreshold ? 0 : baseShippingAmount;
      
      console.log('🚚 Main shipping calculation:', {
        currentCurrency,
        currentSubtotal,
        freeShippingThreshold,
        baseShippingAmount,
        finalShippingAmount: shippingAmount
      });
      
      return shippingAmount;
    }
    return 0; // No shipping for subscriptions/programmes (digital)
  };

  const shippingCost = getShippingCost();
  
  // Calculate discount from plan data and coupon
  const getDiscount = () => {
    let planDiscount = 0;
    let couponDiscountAmount = 0;
    
    // Get the original price before any discounts
    let originalPrice = 0;
    
    if (type === 'cart') {
      originalPrice = cartSubtotal || 0;
    } else if (type === 'product') {
      originalPrice = product.price * (product.quantity || 1);
    } else {
      // For subscriptions/programmes - use the correct currency's original amount
      if (detectedCurrency === 'SAR' && plan?.priceSAR?.originalAmount) {
        originalPrice = plan.priceSAR.originalAmount;
      } else if (detectedCurrency === 'USD' && plan?.priceUSD?.originalAmount) {
        originalPrice = plan.priceUSD.originalAmount;
      } else if (detectedCurrency === 'AED' && plan?.priceAED?.originalAmount) {
        originalPrice = plan.priceAED.originalAmount;
      } else if (detectedCurrency === 'EGP' && plan?.priceEGP?.originalAmount) {
        originalPrice = plan.priceEGP.originalAmount;
      } else {
        // Fallback to current price if no original amount found
        originalPrice = currentPrice?.amount || 0;
      }
    }
    
    // Check for plan-level discount percentage (subscriptions and programmes)
    if (plan?.discountPercentage && plan.discountPercentage > 0) {
      planDiscount = originalPrice * (plan.discountPercentage / 100);
    }
    
    // Calculate price after plan discount
    const priceAfterPlanDiscount = originalPrice - planDiscount;
    
    // Check for coupon discount (if coupon is valid) - apply on price AFTER plan discount
    if (couponValid && couponCode.trim()) {
      if (couponDiscountType === 'percentage') {
        couponDiscountAmount = priceAfterPlanDiscount * (couponDiscount / 100);
      } else {
        couponDiscountAmount = couponDiscount;
      }
    }
    
    return {
      planDiscount,
      couponDiscount: couponDiscountAmount,
      totalDiscount: planDiscount + couponDiscountAmount
    };
  };
  
  const discount = getDiscount();
  
  // Get the original price before any discounts
  let originalPrice = 0;
  
  if (type === 'cart') {
    // Use loaded cart items if available, otherwise use cartSubtotal from state
    if (loadedCartItems && loadedCartItems.length > 0) {
      originalPrice = loadedCartItems.reduce((total, item) => {
        const itemPrice = item.hasDiscount ? item.discountedPrice : item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
    } else {
      originalPrice = cartSubtotal || 0;
    }
  } else if (type === 'product') {
    // Use discounted price if product has discount, otherwise use regular price
    const productPrice = product.hasDiscount ? product.discountedPrice : product.price;
    originalPrice = productPrice * (product.quantity || 1);
  } else {
    // For subscriptions/programmes - use the correct currency's original amount
    if (detectedCurrency === 'SAR' && plan?.priceSAR?.originalAmount) {
      originalPrice = plan.priceSAR.originalAmount;
    } else if (detectedCurrency === 'USD' && plan?.priceUSD?.originalAmount) {
      originalPrice = plan.priceUSD.originalAmount;
    } else if (detectedCurrency === 'AED' && plan?.priceAED?.originalAmount) {
      originalPrice = plan.priceAED.originalAmount;
    } else if (detectedCurrency === 'EGP' && plan?.priceEGP?.originalAmount) {
      originalPrice = plan.priceEGP.originalAmount;
    } else {
      // Fallback to current price if no original amount found
      originalPrice = currentPrice?.amount || 0;
    }
  }
  
  const subtotal = originalPrice;
  const total = useMemo(() => {
    return subtotal - discount.totalDiscount + shippingCost;
  }, [subtotal, discount.totalDiscount, shippingCost]);
  
  // Debug: Log order summary calculation
  console.log('🔍 Order Summary Debug:', {
    detectedCurrency,
    originalPrice,
    subtotal,
    discount: discount.totalDiscount,
    shippingCost,
    total,
    planPriceSAR: plan?.priceSAR,
    currentPrice
  });

  // Get Tabby rejection message based on reason
  const getTabbyRejectionMessage = (rejectionReason) => {
    switch (rejectionReason) {
      case 'order_amount_too_high':
        return t('checkout.tabbyRejectionAmountHigh');
      case 'order_amount_too_low':
        return t('checkout.tabbyRejectionAmountLow');
      case 'not_available':
      default:
        return t('checkout.tabbyRejectionGeneral');
    }
  };

  // Check Tabby availability with actual pre-scoring
  const checkTabbyAvailability = async (currency) => {
    // Prevent multiple simultaneous calls
    if (tabbyPrescoringLoading) {
      console.log('🔍 PRESCORING - Already in progress, skipping');
      return;
    }

    // Prevent multiple calls for the same currency
    if (prescoringCalledRef.current) {
      console.log('🔍 PRESCORING - Already called for this currency, skipping');
      return;
    }

    // Mark as called
    prescoringCalledRef.current = true;

    try {
      setTabbyPrescoringLoading(true);
      console.log('🔍 PRESCORING - Checking Tabby availability:', {
        currency,
        currentCountry,
        forceTabbyAvailable,
        total
      });
      
      // Force Tabby available for testing - this should never be called when force is true
      if (forceTabbyAvailable) {
        console.log('🧪 Testing mode: Forcing Tabby availability (this should not be called)');
        setTabbyAvailable(true);
        setTabbyRejectionMessage(null);
        return;
      }
      
      // Skip country check for pre-scoring - let Tabby API determine eligibility
      console.log(`🔍 Country detected: ${currentCountry} - proceeding to pre-scoring`);
      
      // Check if currency is supported by Tabby
      const supportedCurrencies = ['SAR', 'AED'];
      const isCurrencySupported = supportedCurrencies.includes(currency);
      
      if (!isCurrencySupported) {
        console.log(`❌ Tabby not supported for currency: ${currency}`);
        setTabbyAvailable(false);
        setTabbyRejectionMessage(t('checkout.tabbyRejectionGeneral'));
        return;
      }
      
      // Now do actual pre-scoring with Tabby API using REAL order data
      console.log('🔍 PRESCORING - Performing official Tabby pre-scoring check');
      
      // Create real order data for pre-scoring (not test data)
      const realOrderData = {
        amount: total,
        currency: currency,
        description: 'Pre-scoring check for Tabby eligibility',
        buyer: {
          phone: getPhoneForCurrency(currency),
          email: user?.email || 'test@example.com',
          name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Test User'
        },
        order: {
          tax_amount: '0.00',
          shipping_amount: '0.00',
          discount_amount: '0.00',
          updated_at: new Date().toISOString(),
          reference_id: `prescore-${Date.now()}`,
          items: [{
            title: 'Test Item',
            description: 'Pre-scoring test',
            quantity: 1,
            unit_price: total.toString(),
            discount_amount: '0.00',
            reference_id: 'test-item',
            image_url: '',
            product_url: '',
            category: 'test'
          }]
        },
        items: [{
          title: 'Test Item',
          description: 'Pre-scoring test',
          quantity: 1,
          unit_price: total.toString(),
          discount_amount: '0.00',
          reference_id: 'test-item',
          image_url: '',
          product_url: '',
          category: 'test'
        }],
        ...(type === 'cart' || type === 'product' ? {
          shipping_address: {
            line1: shippingDetails?.shippingAddress || 'Test Address',
            line2: shippingDetails?.shippingAddress2 || '',
            city: shippingDetails?.shippingCity || getCityForCurrency(currency),
            state: shippingDetails?.shippingState || '',
            zip: shippingDetails?.shippingPostalCode || '00000',
            country: getCountryForCurrency(currency)
          }
        } : {}),
        meta: {
          order_id: `prescore-${Date.now()}`,
          customer: {
            registered: !!user,
            loyalty_level: 0
          }
        },
        attachment: {}
      };
      
      console.log('🔍 PRESCORING - Real order data for pre-scoring:', JSON.stringify(realOrderData, null, 2));
      
      // Create checkout data for pre-scoring
      const checkoutData = tabbyService.createCheckoutData(realOrderData, type === 'cart' ? 'order' : type);
      console.log('🔍 PRESCORING - Checkout data for pre-scoring:', JSON.stringify(checkoutData, null, 2));
      
      // Perform official Tabby pre-scoring (calls backend endpoint)
      const prescoringResult = await tabbyService.performBackgroundPrescoring(realOrderData, type);
      console.log('🔍 PRESCORING - Official Tabby response:', prescoringResult);
      
      // Check official Tabby status as per documentation
      if (prescoringResult.status === 'created') {
        console.log('✅ PRESCORING - Tabby status "created" - customer eligible - showing payment option');
        setTabbyAvailable(true);
        setTabbyRejectionMessage(null);
        setTabbyConfiguration(prescoringResult.configuration);
      } else if (prescoringResult.status === 'rejected') {
        console.log('❌ PRESCORING - Tabby status "rejected" - customer not eligible - hiding payment option');
        const rejectionReason = prescoringResult.rejection_reason || 'not_available';
        console.log('❌ PRESCORING - Rejection reason:', rejectionReason);
        
        // Set appropriate rejection message based on reason
        let rejectionMessage = '';
        switch (rejectionReason) {
          case 'order_amount_too_high':
            rejectionMessage = t('checkout.tabbyRejectionAmountHigh');
            break;
          case 'order_amount_too_low':
            rejectionMessage = t('checkout.tabbyRejectionAmountLow');
            break;
          case 'not_available':
          default:
            rejectionMessage = t('checkout.tabbyRejectionGeneral');
            break;
        }
        
        setTabbyAvailable(false);
        setTabbyRejectionMessage(rejectionMessage);
      } else {
        console.log('⚠️ PRESCORING - Unknown Tabby status:', prescoringResult.status);
        setTabbyAvailable(false);
        setTabbyRejectionMessage(t('checkout.tabbyRejectionGeneral'));
      }
      
    } catch (error) {
      console.error('❌ PRESCORING - Error during pre-scoring:', error);
      console.error('❌ PRESCORING - Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      // On error, hide Tabby option
      setTabbyAvailable(false);
      setTabbyRejectionMessage(t('checkout.tabbyRejectionGeneral'));
    } finally {
      setTabbyPrescoringLoading(false);
    }
  };

  // Reset prescoring flag when currency changes
  useEffect(() => {
    prescoringCalledRef.current = false;
  }, [currency]);

  // Check Tabby availability when currency changes
  useEffect(() => {
    console.log('🔍 PRESCORING TRIGGER - useEffect called:', {
      currency,
      currencyLoading,
      total,
      currentCountry,
      forceTabbyAvailable,
      prescoringCalled: prescoringCalledRef.current
    });
    
    if (currency && !currencyLoading && total > 0 && !forceTabbyAvailable && !tabbyPrescoringLoading) {
      console.log('🔍 PRESCORING TRIGGER - Conditions met, calling checkTabbyAvailability');
      checkTabbyAvailability(currency);
    } else {
      console.log('🔍 PRESCORING TRIGGER - Conditions not met:', {
        hasCurrency: !!currency,
        notLoading: !currencyLoading,
        hasTotal: total > 0,
        notForced: !forceTabbyAvailable,
        notPrescoringLoading: !tabbyPrescoringLoading
      });
    }
  }, [currency, currencyLoading, total, forceTabbyAvailable]); // Removed tabbyPrescoringLoading to prevent infinite loop

  // Immediate effect when force flag changes
  useEffect(() => {
    if (forceTabbyAvailable) {
      console.log('🧪 Force Tabby flag changed - immediately setting available');
      setTabbyAvailable(true);
      setTabbyRejectionMessage(null);
    } else {
      // When force mode is disabled, recheck availability
      if (currency && !currencyLoading && total > 0) {
        checkTabbyAvailability(currency);
      }
    }
  }, [forceTabbyAvailable]);

  // Handle payment failure state
  useEffect(() => {
    if (fromPaymentFailure && paymentFailureReason) {
      const failureMessage = paymentFailureReason === 'rejected' 
        ? (i18n.language === 'ar' 
            ? 'نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.'
            : 'Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.')
        : (i18n.language === 'ar'
            ? 'انتهت صلاحية جلسة الدفع. يرجى المحاولة مرة أخرى.'
            : 'Your payment session has expired. Please try again with a new payment session.');
      
      setError(failureMessage);
      showError(failureMessage);
      
      // Ensure Tabby remains available for retry
      setTabbyAvailable(true);
    }
  }, [fromPaymentFailure, paymentFailureReason, i18n.language, showError]);

  // Handle payment cancellation state
  useEffect(() => {
    if (fromPaymentCancel) {
      const cancelMessage = i18n.language === 'ar' 
        ? 'لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى.'
        : 'You aborted the payment. Please retry or choose another payment method.';
      
      setError(cancelMessage);
      showInfo(cancelMessage);
      
      // Ensure Tabby remains available for retry
      setTabbyAvailable(true);
    }
  }, [fromPaymentCancel, i18n.language, showInfo]);
  
  // Debug: Log discount calculation
  // console.log('=== DISCOUNT DEBUG ===');
  // console.log('Plan discount percentage:', plan?.discountPercentage);
  // console.log('Plan keys with discount:', Object.keys(plan || {}).filter(key => key.toLowerCase().includes('discount')));
  // console.log('Coupon valid:', couponValid);
  // console.log('Coupon code:', couponCode);
  // console.log('Calculated discount:', discount);
  // console.log('Subtotal:', subtotal);
  // console.log('Total after discount:', total);
  // console.log('========================');

  // Handle coupon validation
  const validateCoupon = async() => {
    if (!couponCode.trim()) {
return;
}
    
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const result = await checkoutService.validateCoupon(couponCode);
      
      if (result.valid) {
        setCouponValid(true);
        setCouponError(null);
        setCouponDiscount(result.discount || 0);
        setCouponDiscountType(result.discountType || 'percentage');
        setCouponData(result.coupon); // Store the full coupon object
        // console.log('Coupon validated successfully:', result);
      } else {
        setCouponValid(false);
        // Set specific error type based on backend message
        const errorMessage = result.message || '';
        let errorType = 'invalidCoupon'; // default
        
        if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('انتهت')) {
          errorType = 'couponExpired';
        } else if (errorMessage.toLowerCase().includes('global usage limit') || errorMessage.toLowerCase().includes('can no longer be used')) {
          errorType = 'couponGlobalLimit';
        } else if (errorMessage.toLowerCase().includes('already used') || errorMessage.toLowerCase().includes('maximum number of times allowed per user')) {
          errorType = 'couponMaxUsage';
        } else if (errorMessage.toLowerCase().includes('max usage') || errorMessage.toLowerCase().includes('maximum') || errorMessage.toLowerCase().includes('limit') || errorMessage.toLowerCase().includes('الحد الأقصى')) {
          errorType = 'couponMaxUsage';
        } else if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('غير موجود')) {
          errorType = 'couponNotFound';
        }
        
        setCouponError(errorType);
        setCouponDiscount(0);
        setCouponData(null); // Clear coupon data
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setCouponValid(false);
      setCouponError('invalidCoupon'); // Use generic error for network/server errors
      setCouponDiscount(0);
      setCouponData(null); // Clear coupon data
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle payment proof file selection (preview only, upload on submit)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file using the service
        imageUploadService.validateFile(file, 5); // 5MB max
        
        // Store the file object for later upload
        setPaymentProof(file);
        
        // Create preview URL for display
        const previewUrl = URL.createObjectURL(file);
        setPaymentProofPreview(previewUrl);
      } catch (error) {
        console.error('Payment proof validation failed:', error);
        alert(`Validation failed: ${error.message}`);
        // Reset the file input
        e.target.value = '';
        setPaymentProof(null);
        setPaymentProofPreview(null);
      }
    }
  };

  // Handle copy to clipboard with feedback
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    // Clear the "Copied!" message after 1 second
    setTimeout(() => {
      setCopiedField(null);
    }, 1000);
  };

  // Render order summary content
  const renderOrderSummary = () => (
    <div className="space-y-4">
      {type === 'cart' ? (
        // Cart items summary
        <div>
          <h4 className="font-medium text-gray-900 mb-3">{t('checkout.orderItems')}</h4>
          <div className="space-y-3">
            {cartItems?.map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.target.src = '/assets/common/store/product1-1.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">{item.name}</p>
                  <p className="text-xs text-gray-600 mb-2">{t('checkout.size')}: {item.size} • {t('checkout.quantity')}: {item.quantity}</p>
                  <div className="flex items-center space-x-2">
                    {item.hasDiscount ? (
                      <>
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(item.discountedPrice * item.quantity)}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          -{(((item.price - item.discountedPrice) / item.price) * 100).toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : type === 'product' ? (
        // Single product summary
        <div>
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                e.target.src = '/assets/common/store/product1-1.png';
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{t('checkout.size')}: {product.size} • {t('checkout.quantity')}: {product.quantity}</p>
              <div className="flex items-center space-x-2">
                {product.hasDiscount ? (
                  <>
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(product.price * product.quantity)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(product.discountedPrice * product.quantity)}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      -{(((product.price - product.discountedPrice) / product.price) * 100).toFixed(0)}%
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(product.price * product.quantity)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Plan/programme summary
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">{getBilingualText(plan?.name, 'Plan')}</h4>
            {(plan?.discountPercentage > 0) ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {plan.discountPercentage}% {t('checkout.off')}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-600 mt-1">{getBilingualText(plan?.description, '')}</p>
        </div>
      )}

      {/* Benefits section - only show for subscriptions */}
      {type === 'subscription' && (
      <div>
        <Accordion.Root type="single" collapsible className="w-full">
          <Accordion.Item value="benefits">
            <Accordion.Header>
              <Accordion.Trigger className="group flex items-center justify-between w-full py-3 text-left text-gray-900 font-medium leading-snug focus:outline-none hover:text-gray-700 transition-colors">
                <span>
                  {t('checkout.benefits')}
                  <span className="text-xs text-gray-500 font-normal">
                    {i18n.language === 'ar' ? ' (اضغط للتوسع)' : ' (click to expand)'}
                  </span>
                </span>
                <Plus className="h-4 w-4 text-gray-500 font-bold transition-transform duration-300 group-data-[state=open]:rotate-45 flex-shrink-0" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="pb-3 text-sm text-gray-600">
              <ul className="space-y-1">
                {plan.benefits?.map((benefit, index) => {
                  const benefitDescription = typeof benefit === 'string' ? benefit : 
                    (benefit.description ? 
                      (typeof benefit.description === 'string' ? benefit.description : 
                        (i18n.language === 'ar' ? 
                          (benefit.description?.ar || benefit.description?.en || '') :
                          (benefit.description?.en || benefit.description?.ar || ''))) : '');
                  return (
                    <li key={index} className="flex items-start">
                      <CheckCircle className={`h-4 w-4 text-green-500 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} mt-0.5 flex-shrink-0`} />
                      {benefitDescription}
                    </li>
                  );
                })}
              </ul>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
      )}

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('checkout.subtotal')}</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        
        {/* Shipping cost for cart and product orders */}
        {(type === 'cart' || type === 'product') && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
            </span>
          </div>
        )}
        
        {/* Coupon discount (for all order types) */}
        {couponValid && couponCode.trim() && discount.couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>
              {t('checkout.couponDiscount')} ({couponCode})
              {couponDiscountType === 'percentage' ? (
                <span className={`text-green-600 ${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`}>({couponDiscount}%)</span>
              ) : (
                <span className={`text-green-600 ${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`}>({couponDiscount} {currentPrice?.currencySymbol || 'L.E'})</span>
              )}
              :
            </span>
            <span>-{formatPrice(discount.couponDiscount)}</span>
          </div>
        )}
        
        {/* Plan discount (for subscriptions/programmes only) */}
        {type !== 'cart' && type !== 'product' && (plan?.discountPercentage > 0) && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t('checkout.planDiscount')} ({plan.discountPercentage}%):</span>
            <span>-{formatPrice(discount.planDiscount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
          <span>{t('checkout.total')}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );

  // Handle Paymob payment
  const handlePaymobPayment = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Determine payment method for Paymob
      const paymobPaymentMethod = paymentOption === 'paymob_apple' ? 'apple_pay' : 'card';
      
      console.log('🔍 Processing Paymob payment:', {
        paymentMethod: paymobPaymentMethod,
        total,
        currency: 'SAR', // Always use SAR for Paymob
        type
      });

      // Prepare payment data
      const paymentData = {
        amount: total,
        currency: 'SAR', // Always use SAR for Paymob
        paymentMethod: paymobPaymentMethod,
        items: getOrderItemsForPaymob(),
        billingData: {
          firstName: user?.firstName || 'User',
          lastName: user?.lastName || 'Name',
          email: user?.email || 'user@example.com',
          phoneNumber: user?.mobileNumber || '+966500000001',
          street: type === 'cart' || type === 'product' ? (shippingDetails?.shippingStreet || '') : '',
          building: type === 'cart' || type === 'product' ? (shippingDetails?.shippingBuilding || '') : '',
          apartment: type === 'cart' || type === 'product' ? (shippingDetails?.shippingApartment || '') : '',
          floor: type === 'cart' || type === 'product' ? (shippingDetails?.shippingFloor || '') : '',
          city: type === 'cart' || type === 'product' ? (shippingDetails?.shippingCity || 'Riyadh') : 'Riyadh',
          state: type === 'cart' || type === 'product' ? (shippingDetails?.shippingState || 'Riyadh') : 'Riyadh',
          country: 'KSA', // Always use KSA for Paymob
          postalCode: type === 'cart' || type === 'product' ? (shippingDetails?.shippingPostalCode || '') : ''
        },
        customer: {
          firstName: user?.firstName || 'User',
          lastName: user?.lastName || 'Name',
          email: user?.email || 'user@example.com',
          extras: {
            userId: user?.id,
            userRole: user?.role
          }
        },
        extras: {
          source: 'web',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          orderType: type,
          planId: plan?.id || null,
          subscriptionPlanId: type === 'subscription' ? plan?.id : null
        }
      };

      console.log('🔍 Paymob payment data:', paymentData);

      // Import PaymobService dynamically
      const { default: paymobService } = await import('../../services/paymobService.js');
      
      // Create payment intention
      const result = await paymobService.createAndPay(paymentData);
      
      if (result.success && result.checkoutUrl) {
        showSuccess('Redirecting to secure payment page...');
        
        // Redirect to Paymob checkout directly (like Tabby)
        window.location.href = result.checkoutUrl;

        // Don't set success state yet - wait for actual payment completion
        // The success state will be set when user returns from successful payment
        setSubmitting(false);
      } else {
        throw new Error('Failed to create payment intention');
      }

    } catch (error) {
      console.error('Paymob payment error:', error);
      setError(error.message);
      showError(error.message);
      setSubmitting(false);
    }
  };

  // Helper function to get order items for Paymob
  const getOrderItemsForPaymob = () => {
    const items = [];
    
    if (type === 'subscription' && plan) {
      items.push({
        name: typeof plan.name === 'object' ? plan.name?.en || plan.name?.ar || 'Subscription' : plan.name,
        amount: total,
        description: typeof plan.description === 'object' ? plan.description?.en || plan.description?.ar || '' : plan.description,
        quantity: 1
      });
    } else if (type === 'programme' && plan) {
      items.push({
        name: typeof plan.name === 'object' ? plan.name?.en || plan.name?.ar || 'Programme' : plan.name,
        amount: total,
        description: typeof plan.description === 'object' ? plan.description?.en || plan.description?.ar || '' : plan.description,
        quantity: 1
      });
    } else if (type === 'cart' && cartItems) {
      cartItems.forEach(item => {
        items.push({
          name: item.name,
          amount: item.price * item.quantity,
          description: `${item.quantity}x ${item.name}`,
          quantity: item.quantity
        });
      });
    } else if (type === 'product' && product) {
      items.push({
        name: product.name,
        amount: total,
        description: `${product.quantity}x ${product.name}`,
        quantity: product.quantity
      });
    } else {
      // Fallback item
      items.push({
        name: 'Gymmawy Purchase',
        amount: total,
        description: 'Purchase from Gymmawy',
        quantity: 1
      });
    }
    
    return items;
  };

  // Handle Tabby payment
  const handleTabbyPayment = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Generate a proper UUID for the order
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Debug: Log price information
      console.log('🔍 Tabby payment price debug:', {
        currentPrice,
        total,
        finalPrice,
        type
      });

      // Prepare order data for Tabby
      const orderData = {
        id: generateUUID(),
        amount: total, // Use total amount for consistency
        currency: currency || 'EGP', // Use the current currency from context
        description: `Payment for ${type === 'cart' ? 'cart items' : type}`,
        lang: i18n.language === 'ar' ? 'ar' : 'en', // Add language marker
        user: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          mobileNumber: getPhoneForCurrency(currency || 'EGP')
        },
        items: getOrderItemsForTabby(),
        // Include shipping address for all orders (Tabby requires it)
        // For physical items, use actual shipping details
        // For digital items (programmes), use default values
        shippingAddress: {
          address: type === 'cart' || type === 'product' 
            ? (shippingDetails?.shippingStreet || 'Digital Product Address')
            : 'Digital Product Address',
          city: type === 'cart' || type === 'product' 
            ? (shippingDetails?.shippingCity || getCityForCurrency(currency || 'EGP'))
            : getCityForCurrency(currency || 'EGP'),
          country: getCountryForCurrency(currency || 'EGP'),
          postalCode: type === 'cart' || type === 'product' 
            ? (shippingDetails?.shippingPostalCode || '00000')
            : '00000'
        }
      };

      // Create checkout data for Tabby
      const checkoutData = tabbyService.createCheckoutData(orderData, type === 'cart' ? 'order' : type);

      // Debug: Log the complete order data being sent to Tabby
      console.log('🔍 COMPLETE ORDER DATA FOR TABBY:');
      console.log('📦 Order Data:', JSON.stringify(orderData, null, 2));
      console.log('🔧 Checkout Data:', JSON.stringify(checkoutData, null, 2));
      console.log('📱 Phone Number:', orderData.user.mobileNumber);
      console.log('💰 Currency:', orderData.currency);
      console.log('🌍 Country:', orderData.shippingAddress?.country || 'No shipping address');
      console.log('🏙️ City:', orderData.shippingAddress?.city || 'No shipping address');

      // Validate checkout data
      const validation = tabbyService.validateCheckoutData(checkoutData);
      if (!validation.isValid) {
        console.error('❌ Tabby validation failed:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create Tabby checkout session
      console.log('🔍 Creating Tabby checkout session with:', checkoutData);
      const result = await tabbyService.createCheckoutSession(checkoutData);
      console.log('🔍 Tabby checkout session created:', result);
      
      // Check if the response indicates rejection
      if (result.status === 'rejected') {
        const rejectionMessage = tabbyService.getRejectionMessage(
          result.configuration?.products?.installments?.rejection_reason || 'not_available',
          i18n.language
        );
        setError(rejectionMessage.message);
        showError(rejectionMessage.message);
        setSubmitting(false);
        return;
      }
      
      // Debug: Log the result structure
      console.log('🔍 Tabby checkout result:', result);
      console.log('🔍 Tabby checkout_session:', result?.checkout_session);
      console.log('🔍 Tabby checkout_url:', result?.checkout_session?.checkout_url);
      console.log('🔍 Full result structure:', JSON.stringify(result, null, 2));

      // Check multiple possible locations for checkout URL
      const checkoutUrl = result?.checkout_session?.checkout_url || 
                         result?.checkout_url || 
                         result?.configuration?.available_products?.installments?.[0]?.web_url ||
                         result?.web_url;

      console.log('🔍 Final checkout URL found:', checkoutUrl);

      if (checkoutUrl) {
        showSuccess('Redirecting to secure payment page...');
        // Redirect to Tabby checkout
        window.location.href = checkoutUrl;
      } else {
        console.error('❌ No checkout URL found in any expected location');
        console.error('❌ Available keys in result:', Object.keys(result || {}));
        console.error('❌ Available keys in checkout_session:', Object.keys(result?.checkout_session || {}));
        throw new Error('No checkout URL received from Tabby');
      }

    } catch (error) {
      console.error('Tabby payment failed:', error);
      
      // Handle background pre-scoring failure
      if (error.response?.status === 400 && error.response?.data?.reason === 'Background pre-scoring failed') {
        const errorMessage = error.response.data.message || 'Tabby payment is not available for this purchase.';
        setError(errorMessage);
        showError(errorMessage);
        // Hide Tabby option when pre-scoring fails
        setTabbyAvailable(false);
        setTabbyRejectionMessage(errorMessage);
        console.log('❌ Tabby background pre-scoring failed - hiding payment method');
      } else {
        const errorMessage = error.message || 'Payment initialization failed. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get order items for Tabby
  const getOrderItemsForTabby = () => {
    // Helper function to extract string from name (handles both string and object formats)
    const getNameString = (name) => {
      if (typeof name === 'string') return name;
      if (typeof name === 'object' && name !== null) {
        // Handle object with language keys like {en: "Name", ar: "الاسم"}
        return name.en || name.ar || Object.values(name)[0] || 'Item';
      }
      return 'Item';
    };

    if (type === 'cart') {
      // Use loaded cart items if available, otherwise use cartItems from state
      const itemsToUse = loadedCartItems || cartItems;
      return itemsToUse?.map(item => ({
        title: getNameString(item.name) || 'Product',
        quantity: item.quantity || 1,
        price: item.hasDiscount ? item.discountedPrice : item.price || 0,
        category: 'product'
      })) || [];
    } else if (type === 'product') {
      return [{
        title: getNameString(product?.name) || 'Product',
        quantity: product?.quantity || 1,
        price: product?.price || 0,
        category: 'product'
      }];
    } else {
      // For subscriptions/programmes
      return [{
        title: getNameString(plan?.name) || 'Subscription/Programme',
        quantity: 1,
        price: currentPrice?.amount || total,
        category: type === 'subscription' ? 'subscription' : 'programme'
      }];
    }
  };

  // Handle loyalty redemption
  const handleLoyaltyRedemption = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate shipping details for loyalty redemption
      if (!shippingDetails.firstName || !shippingDetails.lastName || !shippingDetails.phone) {
        const errorMessage = i18n.language === 'ar' 
          ? 'يرجى ملء جميع البيانات المطلوبة للتوصيل' 
          : 'Please fill in all required shipping details';
        setError(errorMessage);
        showError(errorMessage);
        setSubmitting(false);
        return;
      }

      // Prepare shipping address for backend
      const shippingAddress = {
        firstName: shippingDetails.firstName,
        lastName: shippingDetails.lastName,
        phone: shippingDetails.phone,
        building: shippingDetails.shippingBuilding || '',
        street: shippingDetails.shippingStreet || '',
        city: shippingDetails.shippingCity || '',
        country: shippingDetails.shippingCountry || '',
        postcode: shippingDetails.shippingPostcode || ''
      };

      console.log('🎁 Processing loyalty redemption:', {
        rewardId: loyaltyData.rewardId,
        category: loyaltyData.category,
        shippingAddress
      });

      // Call the rewards service to process redemption
      const result = await rewardsService.redeemReward(
        loyaltyData.rewardId,
        loyaltyData.category,
        shippingAddress
      );

      if (result.success) {
        // Clear the loyalty data from session storage
        sessionStorage.removeItem('loyaltyCheckoutData');
        
        // Show success message
        const successMessage = i18n.language === 'ar' 
          ? 'تم استبدال المكافأة بنجاح!' 
          : 'Reward redeemed successfully!';
        showSuccess(successMessage);

        // Navigate to success page or dashboard
        navigate('/dashboard', { 
          state: { 
            fromLoyaltyRedemption: true,
            orderNumber: result.data.order.orderNumber,
            remainingPoints: result.data.remainingPoints
          }
        });
      } else {
        throw new Error(result.error || 'Redemption failed');
      }

    } catch (error) {
      console.error('❌ Loyalty redemption error:', error);
      const errorMessage = error.message || (i18n.language === 'ar' 
        ? 'فشل في استبدال المكافأة. يرجى المحاولة مرة أخرى.' 
        : 'Failed to redeem reward. Please try again.');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Client-side validation for payment option selection (skip for loyalty redemptions)
    if (!isLoyaltyRedemption && !paymentOption) {
      const errorMessage = i18n.language === 'ar' 
        ? 'يرجى اختيار طريقة الدفع' 
        : 'Please select a payment method';
      setError(errorMessage);
      showError(errorMessage);
      setSubmitting(false);
      return;
    }

    // Client-side validation for payment proof (skip for loyalty redemptions)
    if (!isLoyaltyRedemption && (paymentOption === 'instapay' || paymentOption === 'vodafone') && !paymentProof) {
      const errorMessage = i18n.language === 'ar' 
        ? 'يرجى رفع إثبات الدفع قبل إرسال الطلب' 
        : 'Please upload payment proof before submitting your order';
      setError(errorMessage);
      showError(errorMessage);
      setSubmitting(false);
      return;
    }

    // Client-side validation for shipping details (cart and product orders)
    if ((type === 'cart' || type === 'product') && paymentOption === 'cash_on_delivery') {
      if (!shippingDetails.shippingBuilding || !shippingDetails.shippingStreet || 
          !shippingDetails.shippingCity) {
        const errorMessage = i18n.language === 'ar' 
          ? 'يرجى ملء جميع البيانات المطلوبة للتوصيل' 
          : 'Please fill in all required shipping details';
        setError(errorMessage);
        showError(errorMessage);
        setSubmitting(false);
        return;
      }
    }

    // Handle Paymob payments separately
    if (paymentOption === 'paymob_card' || paymentOption === 'paymob_apple') {
      await handlePaymobPayment();
      return;
    }

    // Handle loyalty redemption separately
    if (isLoyaltyRedemption && loyaltyData) {
      await handleLoyaltyRedemption();
      return;
    }

    // Handle Tabby payment separately
    if (paymentOption === 'tabby') {
      // Check if Tabby has a rejection message (not available)
      if (tabbyRejectionMessage) {
        const errorMessage = i18n.language === 'ar' 
          ? 'طريقة الدفع المختارة غير متاحة. يرجى اختيار طريقة دفع أخرى' 
          : 'Selected payment method is not available. Please choose another payment method';
        setError(errorMessage);
        showError(errorMessage);
        setSubmitting(false);
        return;
      }
      
      await handleTabbyPayment();
      return;
    }

    // Prevent submission for Tamara (not yet available)
    if (paymentOption === 'tamara') {
      const errorMessage = i18n.language === 'ar' 
        ? 'هذا الخيار غير متاح حالياً' 
        : 'This payment option is currently unavailable';
      setError(errorMessage);
      showError(errorMessage);
      setSubmitting(false);
      return;
    }

    try {
      // Upload payment proof if provided (File object)
      let paymentProofUrl = null;
      if (paymentProof) {
        try {
          setUploadingProof(true);
          const uploadResult = await imageUploadService.uploadImage(paymentProof, 'payment-proofs');
          paymentProofUrl = uploadResult.upload.url;
          console.log('✅ Payment proof uploaded:', paymentProofUrl);
        } catch (uploadError) {
          console.error('❌ Payment proof upload failed:', uploadError);
          showError(i18n.language === 'ar' 
            ? 'فشل رفع إثبات الدفع. يرجى المحاولة مرة أخرى.' 
            : 'Failed to upload payment proof. Please try again.');
          setSubmitting(false);
          setUploadingProof(false);
          return;
        } finally {
          setUploadingProof(false);
        }
      }

      if (type === 'subscription') {
        const isMedical = selectedDuration === 'medical';
        
        // Send only essential data - let backend calculate all prices
        const subscriptionData = {
          planId: plan.id,
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONE_CASH' : 
                        paymentOption?.toUpperCase() === 'INSTAPAY' ? 'INSTA_PAY' : 
                        paymentOption === 'paymob_card' ? 'PAYMOB' :
                        paymentOption === 'paymob_apple' ? 'PAYMOB' :
                        paymentOption?.toUpperCase(),
          isMedical: isMedical,
          currency: currency, // Current selected currency
          // Coupon information - backend will validate and calculate discount
          couponId: couponValid && couponData ? couponData.id : null,
        };

        // Only include paymentProof if it has a value
        if (paymentProofUrl) {
          subscriptionData.paymentProof = paymentProofUrl;
        }

        // Debug: Log subscription data being sent
        console.log('🔍 Subscription data being sent to backend:', subscriptionData);
        console.log('✅ Backend will calculate and validate all prices');

        const result = await checkoutService.createSubscription(subscriptionData);
        // console.log('Subscription created:', result);
        showSuccess(i18n.language === 'ar' ? 'تم إنشاء الاشتراك بنجاح!' : 'Subscription created successfully!');
      } else if (type === 'programme') {
        // Handle programme purchase
        const currentPrice = getPrice();
        const discount = getDiscount();
        const finalAmount = total; // This is the discounted amount
        
        // Create programme purchase data - send minimal data, let backend calculate prices
        const programmeData = {
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONE_CASH' : 
                        paymentOption?.toUpperCase() === 'INSTAPAY' ? 'INSTA_PAY' : 
                        paymentOption === 'paymob_card' ? 'PAYMOB' :
                        paymentOption === 'paymob_apple' ? 'PAYMOB' :
                        paymentOption?.toUpperCase(),
          currency: currentPrice?.currency || 'EGP',
          programmeName: typeof plan.name === 'object' ? plan.name?.en || plan.name?.ar || 'Programme' : plan.name,
          programmeDescription: typeof plan.description === 'object' ? plan.description?.en || plan.description?.ar || '' : plan.description,
        };

        // Only include paymentProof if it has a value
        if (paymentProofUrl) {
          programmeData.paymentProof = paymentProofUrl;
        }

        // Include coupon data if valid coupon is being used
        if (couponValid && couponData) {
          programmeData.couponId = couponData.id;
        }

        // Validate data before sending
        if (!plan.id) {
          throw new Error('Programme ID is required');
        }
        if (!programmeData.currency) {
          throw new Error('Currency is required');
        }
        if (!programmeData.paymentMethod) {
          throw new Error('Payment method is required');
        }

        console.log('Creating programme purchase with data:', programmeData);
        console.log('Programme ID:', plan.id);

        const result = await checkoutService.purchaseProgramme(plan.id, programmeData);
        console.log('Programme purchased:', result);
        showSuccess(i18n.language === 'ar' ? 'تم شراء البرنامج بنجاح!' : 'Programme purchased successfully!');
      } else if (type === 'cart') {
        // Handle cart order
        const orderData = {
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONE_CASH' : 
                        paymentOption?.toUpperCase() === 'INSTAPAY' ? 'INSTA_PAY' : 
                        paymentOption?.toUpperCase() === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' :
                        paymentOption === 'paymob_card' ? 'PAYMOB' :
                        paymentOption === 'paymob_apple' ? 'PAYMOB' :
                        paymentOption?.toUpperCase(),
          currency: 'EGP',
          couponId: couponValid && couponData ? couponData.id : null,
          shippingDetails: shippingDetails,
          shippingCost: shippingCost,
        };

        // Only include paymentProof if it has a value and is not cash on delivery
        if (paymentProofUrl && paymentOption !== 'cash_on_delivery') {
          orderData.paymentProof = paymentProofUrl;
        }

        const result = await checkoutService.createOrderFromCart(orderData);
        showSuccess(i18n.language === 'ar' ? 'تم إنشاء الطلب بنجاح!' : 'Order created successfully!');
      } else if (type === 'product') {
        // Handle single product order
        const orderData = {
          productId: product.id,
          quantity: product.quantity,
          size: product.size,
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONE_CASH' : 
                        paymentOption?.toUpperCase() === 'INSTAPAY' ? 'INSTA_PAY' : 
                        paymentOption?.toUpperCase() === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' :
                        paymentOption === 'paymob_card' ? 'PAYMOB' :
                        paymentOption === 'paymob_apple' ? 'PAYMOB' :
                        paymentOption?.toUpperCase(),
          currency: 'EGP',
          couponId: couponValid && couponData ? couponData.id : null,
          shippingDetails: shippingDetails,
          shippingCost: shippingCost,
          buyNow: true,
        };

        // Only include paymentProof if it has a value and is not cash on delivery
        if (paymentProofUrl && paymentOption !== 'cash_on_delivery') {
          orderData.paymentProof = paymentProofUrl;
        }

        console.log('Creating single product order with data:', orderData);
        const result = await checkoutService.createOrder(orderData);
        console.log('Single product order created:', result);
        showSuccess(i18n.language === 'ar' ? 'تم إنشاء الطلب بنجاح!' : 'Order created successfully!');
      } else {
        // console.log('Other order type submitted:', { plan, type, paymentOption, paymentProof });
      }

        setSuccess(true);
        setSubmitting(false);
        
        // Clean up stored purchase data on successful payment
        sessionStorage.removeItem('originalPurchaseData');
        console.log('🧹 Cleaned up stored purchase data after successful payment');
    } catch (error) {
      console.error('Submission error:', error);
      
      // Handle specific payment validation errors with user-friendly messages
      let userFriendlyMessage = error.message || 'Failed to place order. Please try again.';
      
      if (error.message && error.message.includes('Payment proof URL is required')) {
        if (i18n.language === 'ar') {
          userFriendlyMessage = 'يرجى رفع إثبات الدفع قبل إرسال الطلب';
        } else {
          userFriendlyMessage = 'Please upload payment proof before submitting your order';
        }
      } else if (error.message && error.message.includes('Payment validation failed')) {
        if (i18n.language === 'ar') {
          userFriendlyMessage = 'فشل في التحقق من بيانات الدفع. يرجى التحقق من جميع البيانات والمحاولة مرة أخرى';
        } else {
          userFriendlyMessage = 'Payment validation failed. Please check all details and try again';
        }
      }
      
      setError(userFriendlyMessage);
      showError(userFriendlyMessage);
      setSubmitting(false);
    }
  };

  // Show loading state if no checkout data is available
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary"></div>
      </div>
    );
  }

  // Show error state if no checkout data is available
  if (!plan && !product && !cartItems && !loadedCartItems && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Checkout Data</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            It looks like you accessed the checkout page directly. Please add items to your cart or select a product to continue.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gymmawy-primary text-white py-3 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors text-sm sm:text-base font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <CheckCircle className="h-16 w-16 text-gymmawy-primary mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('checkout.orderSubmitted')}</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            {t('checkout.orderSubmittedMessage', { type: i18n.language === 'ar' ? (type === 'subscription' ? 'اشتراك' : type === 'programme' ? 'برنامج' : type) : type })}
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-800">
              <strong>{t('checkout.nextSteps')}</strong><br/>
              • {t('checkout.nextSteps1')}<br/>
              • {t('checkout.nextSteps2')}<br/>
              • {t(`checkout.nextSteps3${type === 'subscription' ? 'Subscription' : type === 'product' ? 'Product' : type === 'cart' ? 'Cart' : ''}`, { type: i18n.language === 'ar' ? (type === 'subscription' ? 'اشتراك' : type === 'programme' ? 'برنامج' : type) : type })}<br/>
              • {t(`checkout.nextSteps4${type === 'subscription' ? 'Subscription' : type === 'product' ? 'Product' : type === 'cart' ? 'Cart' : ''}`, { type: i18n.language === 'ar' ? (type === 'subscription' ? 'اشتراك' : type === 'programme' ? 'برنامج' : type) : type })}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gymmawy-primary text-white py-3 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors text-sm sm:text-base font-medium"
          >
            {t('checkout.goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8 lg:pb-8 overflow-x-hidden">
      {/* Header - Fixed */}
      <div 
        className="bg-gray-50 border-b border-gray-200 shadow-sm"
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999,
          backgroundColor: 'rgb(249, 250, 251)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('checkout.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isLoyaltyRedemption 
              ? (i18n.language === 'ar' ? 'استبدال المكافأة' : 'Redeem Reward')
              : t('checkout.title')
            }
          </h1>
          <p className="text-gray-600 mt-2">
            {isLoyaltyRedemption 
              ? (i18n.language === 'ar' 
                  ? 'أكمل بياناتك لاستبدال المكافأة بنقاط جيماوي الخاصة بك'
                  : 'Complete your details to redeem your reward with Gymmawy Points'
                )
              : t('checkout.subtitle')
            }
          </p>
          {isLoyaltyRedemption && loyaltyData && (
            <div className="mt-4 p-4 bg-gymmawy-primary/10 border border-gymmawy-primary/20 rounded-lg">
              <div className="flex items-center">
                <Package className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} text-gymmawy-primary`} />
                <span className="text-sm font-medium text-gray-900">
                  {i18n.language === 'ar' ? 'المكافأة:' : 'Reward:'} {loyaltyData.rewardName}
                </span>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">
                  {i18n.language === 'ar' ? 'النقاط المطلوبة:' : 'Points Required:'} {loyaltyData.pointsRequired}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add padding to compensate for fixed header */}
      <div style={{ paddingTop: '160px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-full">
        {/* Content */}
        <div className="mb-8"></div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 sm:pb-0">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 mb-8 sm:mb-0">
              {/* Duration Selection (for subscriptions) */}
              {type === 'subscription' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} text-gymmawy-primary`} />
                    {t('checkout.chooseDuration')}
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="duration"
                        value="normal"
                        checked={selectedDuration === 'normal'}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex-1`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {durationData.subscriptionDays > 0 ? (
                              <>
                                {formatSubscriptionPeriod(durationData.subscriptionDays)}
                                {formatGiftPeriod(durationData.giftDays)}
                              </>
                            ) : (
                              <span className="text-gray-500">{t('checkout.durationNotSpecified')}</span>
                            )}
                          </span>
                            <span className="text-sm font-medium text-gray-900">
                              {getNormalPrice()?.amount > 0 ? `${getNormalPrice()?.amount}${i18n.language === 'ar' ? '\u00A0' : ' '}${getNormalPrice()?.currencySymbol || 'L.E'}` : t('checkout.free')}
                            </span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="duration"
                        value="medical"
                        checked={selectedDuration === 'medical'}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex-1`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {durationData.subscriptionDays > 0 ? (
                              <>
                                {formatSubscriptionPeriod(durationData.subscriptionDays)}
                                {formatGiftPeriod(durationData.giftDays)} - {t('checkout.medicalPackage')}
                              </>
                            ) : (
                              <span className="text-gray-500">{t('checkout.durationNotSpecified')} - {t('checkout.medicalPackage')}</span>
                            )}
                          </span>
                            <span className="text-sm font-medium text-gray-900">
                              {getMedicalPrice()?.amount > 0 ? `${getMedicalPrice()?.amount}${i18n.language === 'ar' ? '\u00A0' : ' '}${getMedicalPrice()?.currencySymbol || 'L.E'}` : t('checkout.free')}
                            </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Programme Details (for programmes) */}
              {type === 'programme' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} text-gymmawy-primary`} />
                    {t('checkout.programmeDetails')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {(plan.image || plan.imageUrl) && (
                        <img 
                          src={(() => {
                            const imagePath = plan.imageUrl || plan.image;
                            if (!imagePath) return '';
                            if (imagePath.startsWith('http')) return imagePath;
                            if (imagePath.startsWith('/uploads/')) {
                              return `${config.STATIC_BASE_URL}${imagePath}`;
                            }
                            return imagePath;
                          })()} 
                          alt={getBilingualText(plan.name, 'Plan')} 
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            console.error('Programme image load error:', e);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{getBilingualText(plan.name, 'Plan')}</h4>
                        {plan.description && (
                          <p className="text-gray-600 text-sm">{getBilingualText(plan.description, '')}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{i18n.language === 'ar' ? 'السعر الأصلي' : 'Original Price'}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {(() => {
                            // Use the correct currency's original amount based on detected currency
                            if (detectedCurrency === 'SAR' && plan?.priceSAR?.originalAmount) {
                              return formatPrice(plan.priceSAR.originalAmount);
                            } else if (detectedCurrency === 'USD' && plan?.priceUSD?.originalAmount) {
                              return formatPrice(plan.priceUSD.originalAmount);
                            } else if (detectedCurrency === 'AED' && plan?.priceAED?.originalAmount) {
                              return formatPrice(plan.priceAED.originalAmount);
                            } else if (detectedCurrency === 'EGP' && plan?.priceEGP?.originalAmount) {
                              return formatPrice(plan.priceEGP.originalAmount);
                            } else {
                              // Fallback to any available original amount
                              const fallbackAmount = plan?.priceSAR?.originalAmount || plan?.priceUSD?.originalAmount || plan?.priceEGP?.originalAmount || plan?.priceAED?.originalAmount || currentPrice?.amount || 0;
                              return formatPrice(fallbackAmount);
                            }
                          })()}
                        </span>
                      </div>
                      
                      {plan?.discountPercentage > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{i18n.language === 'ar' ? 'خصم البرنامج' : 'Programme Discount'}</span>
                          <span className="text-sm font-medium text-green-600">
                            {plan.discountPercentage}% {i18n.language === 'ar' ? 'خصم' : 'off'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{i18n.language === 'ar' ? 'السعر النهائي' : 'Final Price'}</span>
                        <span className="text-lg font-semibold text-gymmawy-primary">
                          {formatPrice(currentPrice?.amount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Code - Hide for loyalty redemptions */}
              {!isLoyaltyRedemption && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} text-gymmawy-primary`} />
                  {t('checkout.couponCode')}
                </h3>
                
                <div className={`flex ${i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponValid(null);
                      setCouponError(null);
                      setCouponData(null); // Clear coupon data when code changes
                    }}
                    placeholder={t('checkout.enterCouponCode')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? t('checkout.validating') : t('checkout.apply')}
                  </button>
                </div>
                
                {couponValid !== null && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center text-sm ${
                    couponValid 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {couponValid ? (
                      <CheckCircle className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} flex-shrink-0`} />
                    ) : (
                      <XCircle className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} flex-shrink-0`} />
                    )}
                    <span className="font-medium">
                      {couponValid ? t('checkout.couponApplied') : t(`checkout.${couponError}`)}
                    </span>
                  </div>
                )}
                </div>
              )}

              {/* Shipping Details - Only for cart and product orders */}
              {(type === 'cart' || type === 'product') && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} text-gymmawy-primary`} />
                    {t('checkout.shippingDetails')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.buildingStreet')} *
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.shippingBuilding}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, shippingBuilding: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder={t('checkout.enterBuildingName')}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.streetAddress')} *
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.shippingStreet}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, shippingStreet: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder={t('checkout.enterStreetAddress')}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.city')} *
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.shippingCity}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, shippingCity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder={t('checkout.enterCity')}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.country')}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.shippingCountry}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, shippingCountry: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder={t('checkout.enterCountry')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.postalCode')}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.shippingPostcode}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, shippingPostcode: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                        placeholder={t('checkout.enterPostalCode')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary - Mobile Only (before payment method) - Hide for loyalty redemptions */}
              {!isLoyaltyRedemption && (
                <div className="lg:hidden mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h3>
                  {renderOrderSummary()}
                </div>
              </div>
              )}


              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} text-gymmawy-primary`} />
                  {t('checkout.paymentMethod')}
                </h3>
                
                {/* Payment Type Selection */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="full"
                        checked={paymentMethod === 'full'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                      />
                      <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                        <span className="text-sm font-medium text-gray-900">{t('checkout.payFullAmount')}</span>
                      </div>
                    </label>

                    {/* Only show installments option for AED and SAR */}
                    {isTabbySupported && (
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="installments"
                          checked={paymentMethod === 'installments'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                          <span className="text-sm font-medium text-gray-900">{t('checkout.payInInstallments')}</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Payment Options - Hide for loyalty redemptions */}
                {paymentMethod === 'full' && !isLoyaltyRedemption && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">{t('checkout.choosePaymentOption')}</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Show Paymob options only for SAR currency */}
                      {finalPrice?.currency === 'SAR' && (
                        <>
                          {/* Paymob Card Payment */}
                          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentOption"
                              value="paymob_card"
                              checked={paymentOption === 'paymob_card'}
                              onChange={(e) => setPaymentOption(e.target.value)}
                              className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                            />
                            <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                              <div className={`h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
                            </div>
                          </label>

                          {/* Paymob Apple Pay */}
                          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentOption"
                              value="paymob_apple"
                              checked={paymentOption === 'paymob_apple'}
                              onChange={(e) => setPaymentOption(e.target.value)}
                              className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                            />
                            <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                              <div className={`h-8 w-8 bg-black rounded-md flex items-center justify-center ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`}>
                                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-900">Apple Pay</span>
                            </div>
                          </label>
                        </>
                      )}

                      {/* Show InstaPay and Vodafone Cash only for EGP currency */}
                      {finalPrice?.currency === 'EGP' && (
                        <>
                          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentOption"
                              value="instapay"
                              checked={paymentOption === 'instapay'}
                              onChange={(e) => setPaymentOption(e.target.value)}
                              className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                            />
                            <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                              <img src="/assets/common/payments/insta-pay.png" alt="InstaPay" className={`h-8 w-auto object-contain ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                              <span className="text-sm font-medium text-gray-900">{t('checkout.instaPay')}</span>
                            </div>
                          </label>

                          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="paymentOption"
                              value="vodafone"
                              checked={paymentOption === 'vodafone'}
                              onChange={(e) => setPaymentOption(e.target.value)}
                              className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                            />
                            <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                              <img src="/assets/common/payments/vodafone-cash.png" alt="Vodafone Cash" className={`h-8 w-auto object-contain ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                              <span className="text-sm font-medium text-gray-900">{t('checkout.vodafoneCash')}</span>
                            </div>
                          </label>
                        </>
                      )}

                      {/* Cash on Delivery - Only for cart and product orders (physical items) */}
                      {(type === 'cart' || type === 'product') && (
                        <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentOption"
                            value="cash_on_delivery"
                            checked={paymentOption === 'cash_on_delivery'}
                            onChange={(e) => setPaymentOption(e.target.value)}
                            className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                          />
                          <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                            <Package className={`h-8 w-8 text-gymmawy-primary ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                            <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === 'installments' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">{t('checkout.chooseInstallmentProvider')}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Always show Tabby option, but disable if there's a rejection message */}
                      <label className={`flex items-center p-4 border rounded-lg ${
                        tabbyRejectionMessage 
                          ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60' 
                          : 'border-gray-200 cursor-pointer hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="paymentOption"
                          value="tabby"
                          checked={paymentOption === 'tabby'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          disabled={!tabbyAvailable}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 disabled:opacity-50"
                        />
                        <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                          <img src="/assets/common/payments/tabby.png" alt="Tabby" className={`h-8 w-auto object-contain ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${
                              tabbyRejectionMessage ? 'text-red-700' : 'text-gray-900'
                            }`}>
                              {t('checkout.tabby')}
                            </span>
                            <span className={`text-xs ${
                              tabbyRejectionMessage ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {tabbyRejectionMessage || t('checkout.tabbyDescription')}
                            </span>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="tamara"
                          checked={paymentOption === 'tamara'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                          <img src="/assets/common/payments/tamara.png" alt="Tamara" className={`h-8 w-auto object-contain ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          <span className="text-sm font-medium text-gray-900">{t('checkout.tamara')}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}


                {paymentOption === 'instapay' && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-3">{t('checkout.instaPayInstructions.title')}</h5>
                    <div className="space-y-2 text-sm text-purple-800">
                      <div className="flex items-center justify-between">
                        <span>rawdakhairy@instapay</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('rawdakhairy@instapay', 'instapay')}
                          className="flex items-center text-purple-600 hover:text-purple-800"
                        >
                          <Copy className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          {copiedField === 'instapay' ? (
                            i18n.language === 'ar' ? 'تم النسخ!' : 'Copied!'
                          ) : (
                            t('checkout.copy')
                          )}
                        </button>
                      </div>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{t('checkout.instaPayInstructions.step1')}</li>
                        <li>{t('checkout.instaPayInstructions.step2')}</li>
                        <li>{t('checkout.instaPayInstructions.step3')}</li>
                      </ol>
                    </div>
                  </div>
                )}

                {paymentOption === 'vodafone' && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-3">{t('checkout.vodafoneInstructions.title')}</h5>
                    <div className="space-y-2 text-sm text-red-800">
                      <div className="flex items-center justify-between">
                        <span>01060599054 - 01014454237</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('01060599054 - 01014454237', 'vodafone')}
                          className="flex items-center text-red-600 hover:text-red-800"
                        >
                          <Copy className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          {copiedField === 'vodafone' ? (
                            i18n.language === 'ar' ? 'تم النسخ!' : 'Copied!'
                          ) : (
                            t('checkout.copy')
                          )}
                        </button>
                      </div>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{t('checkout.vodafoneInstructions.step1')}</li>
                        <li>{t('checkout.vodafoneInstructions.step2')}</li>
                        <li>{t('checkout.vodafoneInstructions.step3')}</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery Instructions - Only for cart and product orders */}
                {paymentOption === 'cash_on_delivery' && (type === 'cart' || type === 'product') && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-3">Cash on Delivery</h5>
                    <div className="space-y-2 text-sm text-green-800">
                      <p>• Pay cash when your order is delivered</p>
                      <p>• No upfront payment required</p>
                      <p>• Delivery fee may apply</p>
                      <p>• Have exact change ready for faster processing</p>
                    </div>
                  </div>
                )}

                {/* Payment Proof Upload */}
                {(paymentOption === 'instapay' || paymentOption === 'vodafone') && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.paymentProof')} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      {t('checkout.uploadInstructions')}
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="payment-proof"
                        disabled={uploadingProof}
                      />
                      <label
                        htmlFor="payment-proof"
                        className={`flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                          uploadingProof 
                            ? 'cursor-not-allowed bg-gray-50' 
                            : 'cursor-pointer hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-center">
                          {uploadingProof ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary mx-auto mb-2"></div>
                              <span className="text-sm font-medium text-gray-700">{t('checkout.uploading')}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">{t('checkout.chooseImageFile')}</span>
                              <p className="text-xs text-gray-500 mt-1">{t('checkout.dragAndDrop')}</p>
                            </>
                          )}
                        </div>
                      </label>
                      
                      {paymentProof && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  {paymentProofPreview ? (
                                    <img 
                                      src={paymentProofPreview} 
                                      alt="Payment proof preview" 
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        console.error('Image load error:', e);
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {paymentProof?.name || t('checkout.paymentProofSelected')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {paymentProof?.size ? `${(paymentProof.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                  {' • '}
                                  {t('checkout.willUploadOnSubmit', 'Will upload when you place order')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProof(null);
                                setPaymentProofPreview(null);
                                // Revoke the object URL to free memory
                                if (paymentProofPreview) {
                                  URL.revokeObjectURL(paymentProofPreview);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tabby/Tamara Placeholder */}
                {paymentOption === 'tamara' && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {t('checkout.tamaraComingSoon')}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {i18n.language === 'ar' ? 'هذا الخيار غير متاح حالياً' : 'This payment option is currently unavailable'}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pb-12 sm:pb-0">
                <button
                  type="submit"
                  disabled={submitting || (!isLoyaltyRedemption && (!paymentOption || paymentOption === 'tamara'))}
                  className="px-8 py-3 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`}></div>
                      {isLoyaltyRedemption 
                        ? (i18n.language === 'ar' ? 'جاري الاستبدال...' : 'Redeeming...')
                        : t('checkout.processing')
                      }
                    </>
                  ) : (
                    isLoyaltyRedemption 
                      ? (i18n.language === 'ar' ? 'استبدال المكافأة' : 'Redeem Reward')
                      : t('checkout.placeOrder')
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary - Desktop Only - Hide for loyalty redemptions */}
          {!isLoyaltyRedemption && (
            <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h3>
              {renderOrderSummary()}
            </div>
          </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Checkout;
