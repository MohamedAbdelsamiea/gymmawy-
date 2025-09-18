import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { config } from '../../config';
import checkoutService from '../../services/checkoutService';
import imageUploadService from '../../services/imageUploadService';
import { useSecureImage } from '../../hooks/useSecureImage';
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
} from 'lucide-react';

const Checkout = () => {
  const { t, i18n } = useTranslation(['checkout', 'common']);
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();
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
  
  // Get plan data from location state
  const { plan, type } = location.state || {};
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: location.pathname, plan, type }, 
      });
    }
  }, [isAuthenticated, navigate, location.pathname, plan, type]);

  // Redirect if no plan data
  useEffect(() => {
    if (!plan) {
      navigate('/');
    }
  }, [plan, navigate]);

  // State management
  const [selectedDuration, setSelectedDuration] = useState('normal');
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
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Use secure image hook for payment proof
  const { dataUrl: secureImageUrl, loading: imageLoading, error: imageError } = useSecureImage(
    typeof paymentProof === 'string' ? paymentProof : null
  );

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
  
  // Debug: Log duration data (can be removed in production)
  // console.log('=== DURATION DEBUG ===');
  // console.log('Duration data:', durationData);
  // console.log('Subscription days:', durationData.subscriptionDays);
  // console.log('Gift days:', durationData.giftDays);
  // console.log('====================');

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

  // Get normal price (static)
  const getNormalPrice = () => {
    if (!plan) {
return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
}
    
    // console.log('=== NORMAL PRICE DEBUG ===');
    // console.log('plan.price:', plan.price);
    // console.log('plan.priceEGP:', plan.priceEGP);
    // console.log('plan.priceSAR:', plan.priceSAR);
    
    if (plan.price?.amount !== undefined && plan.price?.amount !== null && plan.price?.amount > 0) {
      // console.log('Using plan.price:', plan.price);
      return plan.price;
    }
    
    // Handle new price structure with objects (from backend)
    if (plan.priceEGP && typeof plan.priceEGP === 'object') {
      return {
        amount: plan.priceEGP.amount || 0,
        currency: plan.priceEGP.currency || 'EGP',
        currencySymbol: plan.priceEGP.currencySymbol || 'L.E',
      };
    }
    
    if (plan.priceSAR && typeof plan.priceSAR === 'object') {
      return {
        amount: plan.priceSAR.amount || 0,
        currency: plan.priceSAR.currency || 'SAR',
        currencySymbol: plan.priceSAR.currencySymbol || 'ر.س',
      };
    }
    
    const priceField = plan.priceEGP || plan.priceSAR;
    // console.log('Selected priceField:', priceField);
    
    if (priceField) {
      const amount = convertDecimalToNumber(priceField);
      // console.log('Converted amount:', amount);
      return {
        amount: amount,
        currency: 'EGP',
        currencySymbol: 'L.E',
      };
    }
    
    // console.log('Returning fallback price');
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  // Get medical price (static)
  const getMedicalPrice = () => {
    if (!plan) {
return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
}
    
    // console.log('=== MEDICAL PRICE DEBUG ===');
    // console.log('plan.medicalPrice:', plan.medicalPrice);
    // console.log('plan.medicalEGP:', plan.medicalEGP);
    // console.log('plan.medicalSAR:', plan.medicalSAR);
    
    if (plan.medicalPrice?.amount !== undefined && plan.medicalPrice?.amount !== null && plan.medicalPrice?.amount > 0) {
      // console.log('Using plan.medicalPrice:', plan.medicalPrice);
      return plan.medicalPrice;
    }
    
    // Handle new price structure with objects (from backend)
    if (plan.medicalEGP && typeof plan.medicalEGP === 'object') {
      return {
        amount: plan.medicalEGP.amount || 0,
        currency: plan.medicalEGP.currency || 'EGP',
        currencySymbol: plan.medicalEGP.currencySymbol || 'L.E',
      };
    }
    
    if (plan.medicalSAR && typeof plan.medicalSAR === 'object') {
      return {
        amount: plan.medicalSAR.amount || 0,
        currency: plan.medicalSAR.currency || 'SAR',
        currencySymbol: plan.medicalSAR.currencySymbol || 'ر.س',
      };
    }
    
    // Fallback to regular prices
    if (plan.priceEGP && typeof plan.priceEGP === 'object') {
      return {
        amount: plan.priceEGP.amount || 0,
        currency: plan.priceEGP.currency || 'EGP',
        currencySymbol: plan.priceEGP.currencySymbol || 'L.E',
      };
    }
    
    if (plan.priceSAR && typeof plan.priceSAR === 'object') {
      return {
        amount: plan.priceSAR.amount || 0,
        currency: plan.priceSAR.currency || 'SAR',
        currencySymbol: plan.priceSAR.currencySymbol || 'ر.س',
      };
    }
    
    const priceField = plan.medicalEGP || plan.medicalSAR || plan.priceEGP || plan.priceSAR;
    // console.log('Selected medical priceField:', priceField);
    
    if (priceField) {
      const amount = convertDecimalToNumber(priceField);
      // console.log('Converted medical amount:', amount);
      return {
        amount: amount,
        currency: 'EGP',
        currencySymbol: 'L.E',
      };
    }
    
    // console.log('Returning fallback medical price');
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
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
    
    // For other types or fallback
    if (typeof plan.price === 'string') {
      return parsePriceFromStatic(plan.price);
    }
    return plan.price || { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
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
    
    // Handle new price structure with objects (from backend)
    if (plan.priceEGP && typeof plan.priceEGP === 'object') {
      return {
        amount: plan.priceEGP.amount || 0,
        currency: plan.priceEGP.currency || 'EGP',
        currencySymbol: plan.priceEGP.currencySymbol || 'L.E',
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
        currencySymbol: plan.priceAED.currencySymbol || 'د.إ',
      };
    }
    
    if (plan.priceUSD && typeof plan.priceUSD === 'object') {
      return {
        amount: plan.priceUSD.amount || 0,
        currency: plan.priceUSD.currency || 'USD',
        currencySymbol: plan.priceUSD.currencySymbol || '$',
      };
    }
    
    // Handle raw price fields (legacy format)
    if (plan.priceEGP !== undefined) {
      const amount = convertDecimalToNumber(plan.priceEGP);
      return { amount, currency: 'EGP', currencySymbol: 'L.E' };
    }
    
    if (plan.priceSAR !== undefined) {
      const amount = convertDecimalToNumber(plan.priceSAR);
      return { amount, currency: 'SAR', currencySymbol: 'S.R' };
    }
    
    if (plan.priceAED !== undefined) {
      const amount = convertDecimalToNumber(plan.priceAED);
      return { amount, currency: 'AED', currencySymbol: 'د.إ' };
    }
    
    if (plan.priceUSD !== undefined) {
      const amount = convertDecimalToNumber(plan.priceUSD);
      return { amount, currency: 'USD', currencySymbol: '$' };
    }
    
    // Handle string price
    if (typeof plan.price === 'string') {
      if (plan.price === 'FREE' || plan.price === 'مجاني') {
        return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
      }
      return parsePriceFromStatic(plan.price);
    }
    
    return { amount: 0, currency: 'EGP', currencySymbol: 'L.E' };
  };

  const currentPrice = getPrice();
  
  // Debug: Log price calculation
  // console.log('=== PRICE DEBUG ===');
  // console.log('Current price:', currentPrice);
  // console.log('Price amount:', currentPrice?.amount);
  // console.log('Price currency:', currentPrice?.currency);
  // console.log('Price currencySymbol:', currentPrice?.currencySymbol);
  // console.log('==================');
  
  // Calculate discount from plan data and coupon
  const getDiscount = () => {
    let planDiscount = 0;
    let couponDiscountAmount = 0;
    
    // Check for plan-level discount percentage (subscriptions and programmes)
    if (plan?.discountPercentage && plan.discountPercentage > 0) {
      planDiscount = (currentPrice?.amount || 0) * (plan.discountPercentage / 100);
    }
    
    // Calculate price after plan discount
    const priceAfterPlanDiscount = (currentPrice?.amount || 0) - planDiscount;
    
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
  const subtotal = typeof currentPrice?.amount === 'number' ? currentPrice.amount : parseFloat(currentPrice?.amount) || 0;
  const total = subtotal - discount.totalDiscount;
  
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

  // Handle payment proof upload
  const handleFileUpload = async(e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file using the service
        imageUploadService.validateFile(file, 5); // 5MB max
        
        // Show loading state
        setUploadingProof(true);
        
        // Upload the file
        const uploadResult = await imageUploadService.uploadImage(file, 'payment-proofs');
        
        // Store the URL instead of the file object
        setPaymentProof(uploadResult.upload.url);
      } catch (error) {
        console.error('Payment proof upload failed:', error);
        alert(`Upload failed: ${error.message}`);
        // Reset the file input
        e.target.value = '';
      } finally {
        setUploadingProof(false);
      }
    }
  };

  // Handle copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Client-side validation for payment proof
    if ((paymentOption === 'instapay' || paymentOption === 'vodafone') && !paymentProof) {
      const errorMessage = i18n.language === 'ar' 
        ? 'يرجى رفع إثبات الدفع قبل إرسال الطلب' 
        : 'Please upload payment proof before submitting your order';
      setError(errorMessage);
      showError(errorMessage);
      setSubmitting(false);
      return;
    }

    try {
      // Use paymentProof directly if provided (now it's a URL string)
      const paymentProofUrl = paymentProof;

      if (type === 'subscription') {
        // Calculate current price and discount
        const currentPrice = getPrice();
        const discount = getDiscount();
        const isMedical = selectedDuration === 'medical';
        
        // Calculate total discount amount and percentage
        const totalDiscountAmount = getDiscount().totalDiscount;
        const totalDiscountPercentage = subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;
        const finalAmount = total; // This is the discounted amount
        
        // Create subscription with minimal data - let backend calculate prices
        const subscriptionData = {
          planId: plan.id,
          paymentMethod: paymentOption?.toUpperCase() === 'VODAFONE' ? 'VODAFONE_CASH' : 
                        paymentOption?.toUpperCase() === 'INSTAPAY' ? 'INSTA_PAY' : 
                        paymentOption?.toUpperCase(),
          // Additional subscription details
          isMedical: isMedical,
          currency: currentPrice?.currency || 'EGP',
          // Duration information
          subscriptionPeriodDays: durationData.subscriptionDays,
          giftPeriodDays: durationData.giftDays,
          // Plan details for reference
          planName: typeof plan.name === 'object' ? plan.name?.en || plan.name?.ar || 'Plan' : plan.name,
          planDescription: typeof plan.description === 'object' ? plan.description?.en || plan.description?.ar || '' : plan.description,
          // Coupon information
          couponId: couponValid && couponData ? couponData.id : null,
        };

        // Only include paymentProof if it has a value
        if (paymentProofUrl) {
          subscriptionData.paymentProof = paymentProofUrl;
        }


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
      } else {
        // console.log('Other order type submitted:', { plan, type, paymentOption, paymentProof });
      }

        setSuccess(true);
        setSubmitting(false);
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

  if (!isAuthenticated || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.orderSubmitted')}</h2>
          <p className="text-gray-600 mb-4">
            {t('checkout.orderSubmittedMessage', { type: i18n.language === 'ar' ? (type === 'subscription' ? 'اشتراك' : type === 'programme' ? 'برنامج' : type) : type })}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{t('checkout.nextSteps')}</strong><br/>
              • {t('checkout.nextSteps1')}<br/>
              • {t('checkout.nextSteps2')}<br/>
              • {t('checkout.nextSteps3', { type: i18n.language === 'ar' ? (type === 'subscription' ? 'اشتراك' : type === 'programme' ? 'برنامج' : type) : type })}<br/>
              • {t('checkout.nextSteps4')}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gymmawy-primary text-white py-2 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors"
          >
            {t('checkout.goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('checkout.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('checkout.title')}</h1>
          <p className="text-gray-600 mt-2">{t('checkout.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                              {getNormalPrice()?.amount > 0 ? `${getNormalPrice()?.amount}${i18n.language === 'ar' ? '\u00A0' : ' '}${i18n.language === 'ar' ? 'جم' : (getNormalPrice()?.currencySymbol || 'L.E')}` : t('checkout.free')}
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
                              {getMedicalPrice()?.amount > 0 ? `${getMedicalPrice()?.amount}${i18n.language === 'ar' ? '\u00A0' : ' '}${i18n.language === 'ar' ? 'جم' : (getMedicalPrice()?.currencySymbol || 'L.E')}` : t('checkout.free')}
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
                              return `${config.API_BASE_URL}${imagePath}`;
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
                          {currentPrice?.amount || 0} {currentPrice?.currencySymbol || 'L.E'}
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
                          {total > 0 ? total.toFixed(2) : (currentPrice?.amount || 0).toFixed(2)} {currentPrice?.currencySymbol || 'L.E'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Code */}
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
                  </div>
                </div>

                {/* Payment Options */}
                {paymentMethod === 'full' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">{t('checkout.choosePaymentOption')}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                          <img src="/assets/common/payments/insta-pay.png" alt="InstaPay" className={`h-8 w-8 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
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
                          <img src="/assets/common/payments/vodafone-cash.png" alt="Vodafone Cash" className={`h-8 w-8 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          <span className="text-sm font-medium text-gray-900">{t('checkout.vodafoneCash')}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {paymentMethod === 'installments' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">{t('checkout.chooseInstallmentProvider')}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="tabby"
                          checked={paymentOption === 'tabby'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300"
                        />
                        <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'} flex items-center`}>
                          <img src="/assets/common/payments/tabby.png" alt="Tabby" className={`h-8 w-8 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          <span className="text-sm font-medium text-gray-900">{t('checkout.tabby')}</span>
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
                          <img src="/assets/common/payments/tamara.png" alt="Tamara" className={`h-8 w-8 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          <span className="text-sm font-medium text-gray-900">{t('checkout.tamara')}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Payment Instructions */}
                {paymentOption === 'instapay' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-3">{t('checkout.instaPayInstructions.title')}</h5>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>rawdakhairy@instapay</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('rawdakhairy@instapay')}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Copy className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          {t('checkout.copy')}
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
                          onClick={() => copyToClipboard('01060599054 - 01014454237')}
                          className="flex items-center text-red-600 hover:text-red-800"
                        >
                          <Copy className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          {t('checkout.copy')}
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
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
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
                                  {typeof paymentProof === 'string' ? (
                                    imageLoading ? (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                      </div>
                                    ) : imageError ? (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                        </svg>
                                      </div>
                                    ) : secureImageUrl ? (
                                      <img 
                                        src={secureImageUrl}
                                        alt="Payment proof preview" 
                                        className="w-full h-full object-cover rounded"
                                        onError={(e) => {
                                          console.error('Image load error:', e);
                                          e.target.style.display = 'none';
                                        }}
                                        onLoad={() => {
                                          // Image loaded successfully
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                      </div>
                                    )
                                  ) : (
                                    <img 
                                      src={URL.createObjectURL(paymentProof)} 
                                      alt="Payment proof preview" 
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        console.error('Image load error:', e);
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {typeof paymentProof === 'string' ? 
                                    (imageLoading ? t('checkout.loadingPreview') : 
                                     imageError ? t('checkout.previewError') : 
                                     t('checkout.paymentProofUploaded')) : 
                                    paymentProof.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {typeof paymentProof === 'string' ? 
                                    (imageLoading ? t('checkout.pleaseWait') : 
                                     imageError ? t('checkout.unableToLoadPreview') : 
                                     t('checkout.readyForSubmission')) : 
                                    `${(paymentProof.size / 1024 / 1024).toFixed(2)} MB`}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPaymentProof(null)}
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
                {(paymentOption === 'tabby' || paymentOption === 'tamara') && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      {paymentOption === 'tabby' ? t('checkout.tabbyComingSoon') : t('checkout.tamaraComingSoon')}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !paymentOption}
                  className="px-8 py-3 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`}></div>
                      {t('checkout.processing')}
                    </>
                  ) : (
                    t('checkout.placeOrder')
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{getBilingualText(plan.name, 'Plan')}</h4>
                    {(plan?.discountPercentage > 0) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {plan.discountPercentage}% {t('checkout.off')}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{getBilingualText(plan.description, '')}</p>
                </div>

                {/* Benefits section - only show for subscriptions */}
                {type === 'subscription' && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">{t('checkout.benefits')}</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.benefits?.map((benefit, index) => {
                      const benefitDescription = typeof benefit === 'string' ? benefit : 
                        (benefit.benefit?.description ? 
                          (typeof benefit.benefit.description === 'string' ? benefit.benefit.description : 
                            (i18n.language === 'ar' ? 
                              (benefit.benefit.description?.ar || benefit.benefit.description?.en || '') :
                              (benefit.benefit.description?.en || benefit.benefit.description?.ar || ''))) : '');
                      return (
                        <li key={index} className="flex items-start">
                          <CheckCircle className={`h-4 w-4 text-green-500 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'} mt-0.5 flex-shrink-0`} />
                          {benefitDescription}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('checkout.subtotal')}</span>
                    <span className="font-medium">{Number(subtotal).toFixed(2)}{i18n.language === 'ar' ? '\u00A0' : ' '}{i18n.language === 'ar' ? 'جم' : (currentPrice?.currencySymbol || 'L.E')}</span>
                  </div>
                  
                  {discount.totalDiscount > 0 ? (
                    <div className="space-y-2">
                      {/* Plan discount */}
                      {(plan?.discountPercentage > 0) && (
                    <div className="flex justify-between text-sm text-green-600">
                          <span>{t('checkout.planDiscount')} ({plan.discountPercentage}%):</span>
                          <span>-{Number(discount.planDiscount).toFixed(2)}{i18n.language === 'ar' ? '\u00A0' : ' '}{i18n.language === 'ar' ? 'جم' : (currentPrice?.currencySymbol || 'L.E')}</span>
                    </div>
                  )}
                      
                      {/* Coupon discount */}
                      {(couponValid && couponCode.trim() && discount.couponDiscount > 0) && (
                    <div className="flex justify-between text-sm text-green-600">
                          <span>{t('checkout.couponDiscount')}:</span>
                          <span>{couponDiscount}%{i18n.language === 'ar' ? '\u00A0' : ' '}{t('checkout.off')}</span>
                        </div>
                      )}
                      
                      
                      {/* Total discount */}
                      <div className="flex justify-between text-sm font-medium text-green-600 border-t border-green-200 pt-1">
                        <span>{t('checkout.totalDiscount')}</span>
                        <span>-{Number(discount.totalDiscount).toFixed(2)}{i18n.language === 'ar' ? '\u00A0' : ' '}{i18n.language === 'ar' ? 'جم' : (currentPrice?.currencySymbol || 'L.E')}</span>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span>{t('checkout.total')}</span>
                    <span>{Number(total).toFixed(2)}{i18n.language === 'ar' ? '\u00A0' : ' '}{i18n.language === 'ar' ? 'جم' : (currentPrice?.currencySymbol || 'L.E')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
